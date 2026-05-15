import { createClient } from '@/utils/supabase/client';
import { parseISODate } from '@/lib/utils/date';
import {
  signupWithOtpAction,
  verifyOtpAction,
  resendOtpAction,
} from '../actions/otp-signup.actions';
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
  authUser: { id: string; email?: string | null; email_confirmed_at?: string | null },
  profile: Partial<ProfileRow> | null,
): AuthUser {
  const birth = parseISODate(profile?.birth_date);
  const email = authUser.email ?? '';
  const usernameFallback = email.split('@')[0] || 'user';
  return {
    id: authUser.id,
    email,
    username: profile?.username ?? usernameFallback,
    status: 'ACTIVE',
    emailVerified: Boolean(authUser.email_confirmed_at),
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
    birthDay: birth ? String(birth.getDate()) : undefined,
    birthMonth: birth ? String(birth.getMonth() + 1) : undefined,
    birthYear: birth ? String(birth.getFullYear()) : undefined,
    gender: profile?.gender ?? undefined,
    residenceCountry: profile?.country ?? undefined,
    residenceState: profile?.state ?? undefined,
    residenceCity: profile?.city ?? undefined,
  };
}

async function fetchProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<Partial<ProfileRow> | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return (data as Partial<ProfileRow>) ?? null;
}

export class AuthService {
  private get supabase() {
    return createClient();
  }

  async login(credentials: LoginDTO): Promise<AuthResponseDTO> {
    if (!credentials.email) {
      throw new Error('Email is required to sign in');
    }
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
      options: credentials.captchaToken ? { captchaToken: credentials.captchaToken } : undefined,
    });
    if (error || !data?.user || !data.session) {
      throw new Error(error?.message || 'Error al iniciar sesión');
    }

    const profile = await fetchProfile(this.supabase, data.user.id);
    const user = mapProfileToAuthUser(
      { id: data.user.id, email: data.user.email, email_confirmed_at: data.user.email_confirmed_at },
      profile,
    );

    return {
      accessToken: data.session.access_token ?? '',
      refreshToken: data.session.refresh_token ?? '',
      user,
    };
  }

  async register(userData: RegisterDTO): Promise<MessageResponse> {
    return signupWithOtpAction(userData);
  }

  async verifyEmail(verifyData: VerifyEmailRequest): Promise<MessageResponse> {
    return verifyOtpAction(verifyData);
  }

  async resendOtp(resendData: ResendOtpRequest): Promise<MessageResponse> {
    return resendOtpAction(resendData);
  }

  async loginWithGoogle(redirectTo?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const finalDestination = redirectTo ?? '/feed';
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(finalDestination)}`;
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
    if (error) throw new Error(error.message || 'Error al iniciar sesión con Google');
  }

  async logout(): Promise<void> {
    // Cap signOut so a hung network call can't freeze the UI.
    const signOut = this.supabase.auth.signOut().catch(() => undefined);
    const timeout = new Promise((resolve) => setTimeout(resolve, 1500));
    await Promise.race([signOut, timeout]);
  }

  async refreshToken(): Promise<string> {
    const { data } = await this.supabase.auth.refreshSession();
    return data.session?.access_token ?? '';
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') return null;
    const { data } = await this.supabase.auth.getUser();
    const user = data?.user;
    if (!user) return null;
    const profile = await fetchProfile(this.supabase, user.id);
    return mapProfileToAuthUser(
      { id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at },
      profile,
    );
  }

  isAuthenticated(): boolean {
    // Session presence is the source of truth. `getUser()` would be async;
    // this is a cheap sync check using Supabase's in-memory session cache.
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem('sb-auth-token');
      return Boolean(raw);
    } catch {
      return false;
    }
  }

  /**
   * Kept for API parity with the old Supabase-backed service. Supabase's
   * `@supabase/ssr` package syncs the session cookie automatically, so
   * there's nothing to mark here.
   */
  markSessionHint(): void {
    // no-op
  }

  /**
   * After a Google OAuth round trip, Supabase's detectSessionInUrl hook
   * consumes the code and populates the session. Read it back and hydrate
   * the AuthUser for the store.
   */
  async completeOAuthLogin(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') return null;
    const { data } = await this.supabase.auth.getUser();
    if (!data?.user) return null;
    const profile = await fetchProfile(this.supabase, data.user.id);
    return mapProfileToAuthUser(
      { id: data.user.id, email: data.user.email, email_confirmed_at: data.user.email_confirmed_at },
      profile,
    );
  }
}

export const authService = new AuthService();
