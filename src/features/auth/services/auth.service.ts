import { insforge } from '@/lib/insforge/client';
import type {
  LoginDTO,
  RegisterDTO,
  AuthResponseDTO,
  AuthUser,
  MessageResponse,
  VerifyEmailRequest,
  ResendOtpRequest,
} from '../interfaces/auth.interfaces';

type ProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  second_last_name: string | null;
  birth_date: string | null;
  gender: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  profile_completed: boolean | null;
  created_at: string;
};

function mapProfileToAuthUser(
  authUser: { id: string; email?: string | null; emailVerified?: boolean },
  profile: Partial<ProfileRow> | null
): AuthUser {
  const birth = profile?.birth_date ? new Date(profile.birth_date) : null;
  const email = authUser.email ?? '';
  const usernameFallback = email.split('@')[0] || 'user';
  return {
    id: authUser.id,
    email,
    username: profile?.username ?? usernameFallback,
    status: 'ACTIVE',
    emailVerified: authUser.emailVerified ?? true,
    profileCompleted: profile?.profile_completed ?? false,
    avatarUrl: profile?.avatar_url ?? undefined,
    avatar: profile?.avatar_url ?? undefined,
    coverPhotoUrl: profile?.cover_photo_url ?? undefined,
    createdAt: profile?.created_at ?? new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    firstName: profile?.first_name ?? undefined,
    secondName: profile?.middle_name ?? undefined,
    lastName: profile?.last_name ?? undefined,
    secondLastName: profile?.second_last_name ?? undefined,
    birthDay: birth ? String(birth.getUTCDate()) : undefined,
    birthMonth: birth ? String(birth.getUTCMonth() + 1) : undefined,
    birthYear: birth ? String(birth.getUTCFullYear()) : undefined,
    gender: profile?.gender ?? undefined,
    residenceCountry: profile?.country ?? undefined,
    residenceState: profile?.state ?? undefined,
    residenceCity: profile?.city ?? undefined,
  };
}

const SESSION_FLAG_KEY = 'yebaam:auth:has-session';

function markHasLocalSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SESSION_FLAG_KEY, '1');
  } catch {
    // ignore — private mode, quota, etc.
  }
}

function clearHasLocalSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(SESSION_FLAG_KEY);
  } catch {
    // ignore
  }
}

function readHasLocalSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SESSION_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function readCurrentAccessToken(): string | null {
  try {
    const headers = insforge.getHttpClient().getHeaders();
    const auth = headers['Authorization'] || headers['authorization'];
    if (!auth) return null;
    return auth.replace(/^Bearer\s+/i, '') || null;
  } catch {
    return null;
  }
}

async function syncSessionCookie(accessToken: string | null | undefined): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (accessToken) {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
    } else {
      await fetch('/api/auth/session', { method: 'DELETE' });
    }
  } catch (err) {
    console.warn('[AuthService] Failed to sync session cookie', err);
  }
}

async function fetchProfile(userId: string): Promise<Partial<ProfileRow> | null> {
  const { data, error } = await insforge.database
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return (data as Partial<ProfileRow>) ?? null;
}

export class AuthService {
  async login(credentials: LoginDTO): Promise<AuthResponseDTO> {
    if (!credentials.email) {
      throw new Error('Email is required to sign in');
    }
    const { data, error } = await insforge.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error || !data) throw new Error(error?.message || 'Error al iniciar sesión');

    markHasLocalSession();
    await syncSessionCookie(data.accessToken);

    const profile = await fetchProfile(data.user.id);
    const user = mapProfileToAuthUser(data.user, profile);

    return {
      accessToken: data.accessToken ?? '',
      refreshToken: data.refreshToken ?? '',
      user,
    };
  }

  async register(userData: RegisterDTO): Promise<MessageResponse> {
    const displayName = [userData.firstName, userData.lastName].filter(Boolean).join(' ');

    const { data, error } = await insforge.auth.signUp({
      email: userData.email,
      password: userData.password,
      name: displayName,
    });
    if (error) throw new Error(error.message || 'Error al registrar usuario');

    if (data?.user?.id) {
      await insforge.database
        .from('profiles')
        .update({
          first_name: userData.firstName,
          middle_name: userData.secondName ?? null,
          last_name: userData.lastName,
          second_last_name: userData.secondLastName ?? null,
          birth_date: userData.birthDate,
          gender: userData.gender,
          country: userData.country,
          state: userData.state,
          city: userData.city,
        })
        .eq('id', data.user.id);
    }

    return {
      message: data?.requireEmailVerification
        ? 'Account created. Check your email to verify your account.'
        : 'Account created.',
    };
  }

  async verifyEmail(verifyData: VerifyEmailRequest): Promise<MessageResponse> {
    const { error } = await insforge.auth.verifyEmail({
      email: verifyData.email,
      otp: verifyData.otp,
    });
    if (error) throw new Error(error.message || 'Error al verificar email');
    return { message: 'Email verified.' };
  }

  async resendOtp(resendData: ResendOtpRequest): Promise<MessageResponse> {
    const { error } = await insforge.auth.resendVerificationEmail({
      email: resendData.email,
    });
    if (error) throw new Error(error.message || 'Error al reenviar código OTP');
    return { message: 'Verification code resent.' };
  }

  async loginWithGoogle(redirectTo?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const finalDestination = redirectTo ?? '/feed';
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(finalDestination)}`;
    const { error } = await insforge.auth.signInWithOAuth({
      provider: 'google',
      redirectTo: callbackUrl,
    });
    if (error) throw new Error(error.message || 'Error al iniciar sesión con Google');
  }

  async logout(): Promise<void> {
    clearHasLocalSession();
    await insforge.auth.signOut();
    await syncSessionCookie(null);
  }

  async refreshToken(): Promise<string> {
    if (!readHasLocalSession()) throw new Error('Session expired');
    const { data, error } = await insforge.auth.getCurrentUser();
    if (error || !data?.user) {
      clearHasLocalSession();
      throw new Error('Session expired');
    }
    return '';
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // Skip the SDK probe (and its /api/auth/refresh 401 in devtools) when
    // there is no local hint of a session. The SDK otherwise tries to
    // refresh on every cold load even before the user has ever logged in.
    if (!readHasLocalSession()) return null;

    const { data, error } = await insforge.auth.getCurrentUser();
    if (error || !data?.user) {
      clearHasLocalSession();
      return null;
    }

    await syncSessionCookie(readCurrentAccessToken());

    const profile = await fetchProfile(data.user.id);
    return mapProfileToAuthUser(data.user, profile);
  }

  isAuthenticated(): boolean {
    return readHasLocalSession();
  }

  /**
   * Mark a local session hint without performing a login. Used by the
   * OAuth callback page: after the SDK finishes the PKCE exchange, we
   * know a session exists even though neither `login()` nor
   * `loginWithPassword()` was called in this browser context.
   */
  markSessionHint(): void {
    markHasLocalSession();
  }
}

export const authService = new AuthService();
