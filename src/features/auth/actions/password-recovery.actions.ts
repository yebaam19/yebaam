'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { sendPasswordResetEmail } from '@/services/email/resend.service';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { validatePasswordPolicy } from '@/lib/auth/password-policy';
import {
  generateCode,
  hashCode,
  getRemoteIp,
  findUserByEmail,
  consumeOtpAttempt,
  resetOtpAttempts,
  OTP_TTL_MINUTES,
  MAX_ATTEMPTS,
} from './_otp-shared';
import { checkRateLimit } from '@/lib/api/rate-limit';
import type { AuthActionResult } from '../interfaces/auth.interfaces';

/**
 * Ceiling on reset attempts per email and per IP.
 *
 * `resetPasswordAction` has no CAPTCHA of its own (only the *request* step
 * does), so before this it could be called as fast as the network allowed.
 * Deliberately generous for a human who mistypes a code, and nowhere near
 * enough to walk a 6-digit space.
 */
const RESET_ATTEMPT_LIMIT = { limit: 20, windowMs: 15 * 60 * 1000 };

// Igual que en otp-signup.actions.ts: los errores esperados se devuelven
// como { ok: false, error } porque Next.js redacta los mensajes lanzados
// en Server Actions en producción.

interface RequestPasswordResetInput {
  email: string;
  captchaToken?: string;
}

interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

const PASSWORD_RESET_ACK =
  'Si existe una cuenta con ese email, te enviamos un código para restablecer tu contraseña.';

interface PasswordResetMetadata {
  code_hash: string;
  expires_at: string;
  attempts: number;
}

export async function requestPasswordResetAction(
  input: RequestPasswordResetInput,
): Promise<AuthActionResult> {
  try {
    const email = input.email?.trim().toLowerCase();
    if (!email) {
      return { ok: false, error: 'El email es requerido' };
    }

    const captcha = await verifyTurnstileToken(input.captchaToken, {
      remoteIp: await getRemoteIp(),
      expectedAction: 'password-reset',
    });
    if (!captcha.ok) {
      return { ok: false, error: captcha.reason };
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return { ok: true, message: PASSWORD_RESET_ACK };
    }

    const admin = getServiceClient();
    const code = generateCode();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    const passwordReset: PasswordResetMetadata = {
      code_hash: codeHash,
      expires_at: expiresAt,
      attempts: 0,
    };

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        password_reset: passwordReset,
      },
    });
    if (updateError) {
      console.error('[password-recovery] write metadata failed:', updateError.message);
      return { ok: false, error: 'No se pudo generar el código de recuperación' };
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .maybeSingle();

    await sendPasswordResetEmail({ to: email, code, firstName: profile?.first_name ?? null });

    return { ok: true, message: PASSWORD_RESET_ACK };
  } catch (err) {
    console.error('[password-recovery] unexpected error:', err);
    return { ok: false, error: 'No pudimos enviar el código. Intenta de nuevo.' };
  }
}

async function clearPasswordResetMetadata(userId: string, currentAppMetadata: Record<string, unknown>) {
  const admin = getServiceClient();
  const { password_reset: _drop, ...rest } = currentAppMetadata;
  await admin.auth.admin.updateUserById(userId, { app_metadata: rest });
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<AuthActionResult> {
  try {
    const email = input.email?.trim().toLowerCase();
    const otp = input.otp?.trim();
    const newPassword = input.newPassword;

    if (!email || !otp || !newPassword) {
      return { ok: false, error: 'Email, código y nueva contraseña son requeridos' };
    }

    const passwordError = validatePasswordPolicy(newPassword);
    if (passwordError) {
      return { ok: false, error: passwordError };
    }

    // Cheap pre-gate before findUserByEmail, which pages through listUsers and
    // is what made the race window wide enough to exploit in the first place.
    const ip = await getRemoteIp();
    const byEmail = checkRateLimit(`pwreset:email:${email}`, RESET_ATTEMPT_LIMIT);
    const byIp = ip ? checkRateLimit(`pwreset:ip:${ip}`, RESET_ATTEMPT_LIMIT) : { ok: true };
    if (!byEmail.ok || !byIp.ok) {
      return { ok: false, error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' };
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return { ok: false, error: 'Código inválido' };
    }

    const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
    const reset = appMetadata.password_reset as PasswordResetMetadata | undefined;

    if (!reset) {
      return { ok: false, error: 'No hay un código pendiente para este email' };
    }

    if (new Date(reset.expires_at).getTime() < Date.now()) {
      await clearPasswordResetMetadata(user.id, appMetadata);
      return { ok: false, error: 'El código expiró. Solicita uno nuevo.' };
    }

    // Burn the attempt BEFORE comparing the code, atomically, so a batch of
    // parallel guesses costs one attempt each rather than one between them.
    const attempt = await consumeOtpAttempt(user.id, 'password_reset');
    if (attempt.available) {
      if (attempt.lockedOut) {
        await clearPasswordResetMetadata(user.id, appMetadata);
        await resetOtpAttempts(user.id, 'password_reset');
        return { ok: false, error: 'Demasiados intentos. Solicita un nuevo código.' };
      }
    } else if ((reset.attempts ?? 0) >= MAX_ATTEMPTS) {
      // Fallback path: the atomic RPC is not deployed yet, so this is the old
      // non-atomic check. Still bounds the sequential case.
      await clearPasswordResetMetadata(user.id, appMetadata);
      return { ok: false, error: 'Demasiados intentos. Solicita un nuevo código.' };
    }

    const admin = getServiceClient();

    if (reset.code_hash !== hashCode(otp)) {
      if (!attempt.available) {
        await admin.auth.admin.updateUserById(user.id, {
          app_metadata: {
            ...appMetadata,
            password_reset: { ...reset, attempts: (reset.attempts ?? 0) + 1 },
          },
        });
      }
      return { ok: false, error: 'Código inválido' };
    }

    const { password_reset: _drop, ...restMetadata } = appMetadata;
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      app_metadata: restMetadata,
    });
    if (updateError) {
      return { ok: false, error: updateError.message || 'No se pudo actualizar la contraseña' };
    }

    await resetOtpAttempts(user.id, 'password_reset');
    return { ok: true, message: 'Contraseña actualizada correctamente.' };
  } catch (err) {
    console.error('[password-recovery] unexpected error:', err);
    return { ok: false, error: 'No pudimos actualizar la contraseña. Intenta de nuevo.' };
  }
}
