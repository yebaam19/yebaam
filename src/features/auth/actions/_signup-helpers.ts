import 'server-only';

import { getServiceClient } from '@/utils/supabase/server';
import { sendOtpEmail } from '@/services/email/resend.service';
import { generateCode, hashCode, otpExpiresAt, findUserByEmail } from './_otp-shared';
import State from 'country-state-city/lib/cjs/state';
import Country from 'country-state-city/lib/cjs/country';
import type { AuthActionResult } from '../interfaces/auth.interfaces';

// Non-action helpers for the signup/OTP flow. Kept out of `otp-signup.actions.ts`
// (a `'use server'` module, which may only export async actions) so the action
// file stays focused on its three entry points.

export function resolveCountryName(countryInput: string | undefined | null): string {
  if (!countryInput) return '';
  // Accept either an ISO-2 code (new clients) or a country name (legacy).
  if (countryInput.length === 2) {
    return Country.getCountryByCode(countryInput.toUpperCase())?.name ?? countryInput;
  }
  return countryInput;
}

export function resolveStateName(
  countryInput: string | undefined | null,
  stateInput: string | undefined | null,
): string {
  if (!stateInput) return '';
  if (!countryInput) return stateInput;
  const countryIso =
    countryInput.length === 2
      ? countryInput.toUpperCase()
      : Country.getAllCountries().find((c) => c.name === countryInput)?.isoCode;
  if (!countryIso) return stateInput;
  const match = State.getStateByCodeAndCountry(stateInput, countryIso);
  return match?.name ?? stateInput;
}

export async function issueOtpFor(userId: string, email: string, firstName?: string | null) {
  const admin = getServiceClient();
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = otpExpiresAt();

  await admin
    .from('otp_codes')
    .update({ consumed_at: new Date().toISOString() })
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

export function isEmailExistsError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === 'email_exists' || /already been registered/i.test(error.message ?? '');
}

/**
 * El email ya tiene cuenta: si está sin confirmar (registro a medias),
 * reemite el OTP para que el usuario aterrice en /verify-email; si ya
 * está confirmada, le decimos que inicie sesión.
 */
export async function recoverExistingAccount(email: string): Promise<AuthActionResult> {
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
