'use server';

import { getServiceClient } from '@/utils/supabase/server';
import { sendOtpEmail } from '@/services/email/resend.service';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { validatePasswordPolicy } from '@/lib/auth/password-policy';
import {
  generateCode,
  hashCode,
  otpExpiresAt,
  getRemoteIp,
  findUserByEmail,
  MAX_ATTEMPTS,
} from './_otp-shared';
import State from 'country-state-city/lib/cjs/state';
import Country from 'country-state-city/lib/cjs/country';
import { isOccupationSlug } from '../constants/occupations';
import type {
  RegisterDTO,
  VerifyEmailRequest,
  ResendOtpRequest,
  AuthActionResult,
} from '../interfaces/auth.interfaces';

// Los errores esperados se devuelven como { ok: false, error } en lugar de
// lanzarse: Next.js redacta los mensajes de errores lanzados en Server
// Actions en producción y el usuario solo vería un error genérico.

function resolveCountryName(countryInput: string | undefined | null): string {
  if (!countryInput) return '';
  // Accept either an ISO-2 code (new clients) or a country name (legacy).
  if (countryInput.length === 2) {
    return Country.getCountryByCode(countryInput.toUpperCase())?.name ?? countryInput;
  }
  return countryInput;
}

function resolveStateName(countryInput: string | undefined | null, stateInput: string | undefined | null): string {
  if (!stateInput) return '';
  if (!countryInput) return stateInput;
  const countryIso = countryInput.length === 2 ? countryInput.toUpperCase() : Country.getAllCountries().find(c => c.name === countryInput)?.isoCode;
  if (!countryIso) return stateInput;
  const match = State.getStateByCodeAndCountry(stateInput, countryIso);
  return match?.name ?? stateInput;
}

async function issueOtpFor(userId: string, email: string, firstName?: string | null) {
  const admin = getServiceClient();
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = otpExpiresAt();

  await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('purpose', 'signup')
    .is('consumed_at', null);

  const { error: insertError } = await admin.from('otp_codes').insert({
    user_id: userId,
    email,
    code_hash: codeHash,
    expires_at: expiresAt,
    purpose: 'signup',
  });
  if (insertError) {
    throw new Error(insertError.message || 'No se pudo generar el código de verificación');
  }

  await sendOtpEmail({ to: email, code, firstName });
}

function isEmailExistsError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'email_exists' || /already been registered/i.test(error.message ?? '');
}

/**
 * El email ya tiene cuenta: si está sin confirmar (registro a medias),
 * reemite el OTP para que el usuario aterrice en /verify-email; si ya
 * está confirmada, le decimos que inicie sesión.
 */
async function recoverExistingAccount(email: string): Promise<AuthActionResult> {
  const existing = await findUserByEmail(email);

  if (existing && !existing.email_confirmed_at) {
    const admin = getServiceClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('first_name')
      .eq('id', existing.id)
      .maybeSingle();

    await issueOtpFor(existing.id, email, profile?.first_name ?? null);
    return {
      ok: true,
      pendingVerification: true,
      message: 'Ya tenías un registro pendiente. Te enviamos un nuevo código de verificación.',
    };
  }

  return {
    ok: false,
    error: 'Este correo ya está registrado. Inicia sesión o usa "¿Olvidaste tu contraseña?".',
  };
}

export async function signupWithOtpAction(userData: RegisterDTO): Promise<AuthActionResult> {
  try {
    if (!userData.email || !userData.password) {
      return { ok: false, error: 'Email y contraseña son requeridos' };
    }

    const passwordError = validatePasswordPolicy(userData.password);
    if (passwordError) {
      return { ok: false, error: passwordError };
    }

    if (!isOccupationSlug(userData.occupation)) {
      return { ok: false, error: 'Ocupación inválida o requerida' };
    }

    const captcha = await verifyTurnstileToken(userData.captchaToken, {
      remoteIp: await getRemoteIp(),
      expectedAction: 'signup',
    });
    if (!captcha.ok) {
      return { ok: false, error: captcha.reason };
    }

    const admin = getServiceClient();

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: false,
      user_metadata: {
        name: [userData.firstName, userData.lastName].filter(Boolean).join(' '),
      },
    });

    if (createError || !created?.user) {
      if (isEmailExistsError(createError)) {
        return recoverExistingAccount(userData.email);
      }
      console.error('[signup] createUser failed:', createError?.message);
      return { ok: false, error: createError?.message || 'Error al registrar usuario' };
    }

    const userId = created.user.id;

    await admin
      .from('profiles')
      .update({
        username: userData.email.split('@')[0] || null,
        first_name: userData.firstName,
        middle_name: userData.secondName ?? null,
        last_name: userData.lastName,
        second_last_name: userData.secondLastName ?? null,
        birth_date: userData.birthDate,
        gender: userData.gender,
        country: resolveCountryName(userData.country),
        state: resolveStateName(userData.country, userData.state),
        city: userData.city,
        occupation: userData.occupation,
      })
      .eq('id', userId);

    await issueOtpFor(userId, userData.email, userData.firstName);

    return { ok: true, message: 'Account created. Check your email to verify your account.' };
  } catch (err) {
    // Si createUser ya pasó, el reintento entra por recoverExistingAccount.
    console.error('[signup] unexpected error:', err);
    return { ok: false, error: 'No pudimos completar el registro. Intenta de nuevo en unos minutos.' };
  }
}

export async function verifyOtpAction(payload: VerifyEmailRequest): Promise<AuthActionResult> {
  try {
    const admin = getServiceClient();
    const codeHash = hashCode(payload.otp);

    const { data: row, error: selectError } = await admin
      .from('otp_codes')
      .select('id, user_id, email, expires_at, consumed_at, attempts')
      .eq('email', payload.email)
      .eq('purpose', 'signup')
      .is('consumed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      return { ok: false, error: selectError.message || 'Error al verificar el código' };
    }
    if (!row) {
      return { ok: false, error: 'No hay un código pendiente para este email' };
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);
      return { ok: false, error: 'El código expiró. Solicita uno nuevo.' };
    }

    if (row.attempts >= MAX_ATTEMPTS) {
      await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);
      return { ok: false, error: 'Demasiados intentos. Solicita un nuevo código.' };
    }

    const { data: match, error: matchError } = await admin
      .from('otp_codes')
      .select('id')
      .eq('id', row.id)
      .eq('code_hash', codeHash)
      .maybeSingle();

    if (matchError) {
      return { ok: false, error: matchError.message || 'Error al verificar el código' };
    }

    if (!match) {
      await admin.from('otp_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
      return { ok: false, error: 'Código inválido' };
    }

    await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);

    const { error: confirmError } = await admin.auth.admin.updateUserById(row.user_id, {
      email_confirm: true,
    });
    if (confirmError) {
      return { ok: false, error: confirmError.message || 'Error al confirmar el email' };
    }

    return { ok: true, message: 'Email verified.' };
  } catch (err) {
    console.error('[verify-otp] unexpected error:', err);
    return { ok: false, error: 'No pudimos verificar el código. Intenta de nuevo.' };
  }
}

export async function resendOtpAction(payload: ResendOtpRequest): Promise<AuthActionResult> {
  try {
    const captcha = await verifyTurnstileToken(payload.captchaToken, {
      remoteIp: await getRemoteIp(),
      expectedAction: 'resend-otp',
    });
    if (!captcha.ok) {
      return { ok: false, error: captcha.reason };
    }

    const admin = getServiceClient();

    const { data: existing, error: existingError } = await admin
      .from('otp_codes')
      .select('user_id')
      .eq('email', payload.email)
      .eq('purpose', 'signup')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingError) {
      return { ok: false, error: existingError.message || 'Error al localizar el usuario' };
    }
    if (!existing) {
      return { ok: false, error: 'No se encontró una cuenta pendiente de verificación para ese email' };
    }

    const { data: userLookup, error: userError } = await admin.auth.admin.getUserById(existing.user_id);
    if (userError || !userLookup?.user) {
      return { ok: false, error: userError?.message || 'No se encontró el usuario' };
    }
    if (userLookup.user.email_confirmed_at) {
      return { ok: false, error: 'Este email ya está verificado' };
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('first_name')
      .eq('id', existing.user_id)
      .maybeSingle();

    await issueOtpFor(existing.user_id, payload.email, profile?.first_name ?? null);

    return { ok: true, message: 'Verification code resent.' };
  } catch (err) {
    console.error('[resend-otp] unexpected error:', err);
    return { ok: false, error: 'No pudimos reenviar el código. Intenta de nuevo.' };
  }
}
