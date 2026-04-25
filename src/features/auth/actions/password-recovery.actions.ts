'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { sendPasswordResetEmail } from '@/services/email/resend.service';
import { generateCode, hashCode, OTP_TTL_MINUTES, MAX_ATTEMPTS } from './_otp-shared';

interface RequestPasswordResetInput {
  email: string;
}

interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

interface PasswordResetMetadata {
  code_hash: string;
  expires_at: string;
  attempts: number;
}

const LIST_USERS_PER_PAGE = 1000;
const LIST_USERS_MAX_PAGES = 50;

async function findUserByEmail(email: string) {
  const admin = getServiceClient();
  const target = email.toLowerCase();

  for (let page = 1; page <= LIST_USERS_MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: LIST_USERS_PER_PAGE,
    });
    if (error) {
      console.error('[password-recovery] listUsers failed:', error.message);
      return null;
    }
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === target);
    if (match) return match;
    if (data.users.length < LIST_USERS_PER_PAGE) return null;
  }
  return null;
}

export async function requestPasswordResetAction(
  input: RequestPasswordResetInput,
): Promise<{ message: string }> {
  const email = input.email?.trim().toLowerCase();
  if (!email) {
    throw new Error('El email es requerido');
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('No existe una cuenta con este email');
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
    throw new Error('No se pudo generar el código de recuperación');
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .maybeSingle();

  await sendPasswordResetEmail({ to: email, code, firstName: profile?.first_name ?? null });

  return { message: 'Te enviamos un código a tu email.' };
}

async function clearPasswordResetMetadata(userId: string, currentAppMetadata: Record<string, unknown>) {
  const admin = getServiceClient();
  const { password_reset: _drop, ...rest } = currentAppMetadata;
  await admin.auth.admin.updateUserById(userId, { app_metadata: rest });
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<{ message: string }> {
  const email = input.email?.trim().toLowerCase();
  const otp = input.otp?.trim();
  const newPassword = input.newPassword;

  if (!email || !otp || !newPassword) {
    throw new Error('Email, código y nueva contraseña son requeridos');
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('Código inválido');
  }

  const appMetadata = (user.app_metadata ?? {}) as Record<string, unknown>;
  const reset = appMetadata.password_reset as PasswordResetMetadata | undefined;

  if (!reset) {
    throw new Error('No hay un código pendiente para este email');
  }

  if (new Date(reset.expires_at).getTime() < Date.now()) {
    await clearPasswordResetMetadata(user.id, appMetadata);
    throw new Error('El código expiró. Solicita uno nuevo.');
  }

  if ((reset.attempts ?? 0) >= MAX_ATTEMPTS) {
    await clearPasswordResetMetadata(user.id, appMetadata);
    throw new Error('Demasiados intentos. Solicita un nuevo código.');
  }

  const admin = getServiceClient();

  if (reset.code_hash !== hashCode(otp)) {
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...appMetadata,
        password_reset: { ...reset, attempts: (reset.attempts ?? 0) + 1 },
      },
    });
    throw new Error('Código inválido');
  }

  const { password_reset: _drop, ...restMetadata } = appMetadata;
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    app_metadata: restMetadata,
  });
  if (updateError) {
    throw new Error(updateError.message || 'No se pudo actualizar la contraseña');
  }

  return { message: 'Contraseña actualizada correctamente.' };
}
