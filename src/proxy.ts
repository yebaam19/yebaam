import { NextResponse, type NextRequest } from 'next/server';
import {
  createClient,
  isAnonymousSessionError,
  isInvalidRefreshTokenError,
} from '@/utils/supabase/middleware';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  // Public chat: guests and authenticated users can enter. Identity (profile /
  // nickname / guest) is resolved inside the page via ChatEntryGate.
  '/feed/chat-publico',
  // Verification certificate: the artifact a QR code points to. Has to be
  // viewable by anyone (potential employer, friend) without an account.
  '/verification/certificate',
  // Music archive: público abierto by design. /musica/subir adds its own
  // server-side auth check inside the page component.
  '/musica',
];

// Subset of PUBLIC_ROUTES that authenticated users (including admins) should
// also be able to use without being bounced to /feed or /admin/foros.
const AUTH_ALLOWED_PUBLIC_ROUTES = [
  '/feed/chat-publico',
  '/verification/certificate',
  '/musica',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const client = createClient(request);
  const { supabase, clearAuthCookies } = client;

  // `getUser()` can throw (or return an AuthApiError) when the stored refresh
  // token is stale — common in dev after swapping Supabase projects or when
  // a user was signed out elsewhere. Treat that as "anonymous" and expire the
  // bad cookies so the browser stops resending them.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isInvalidRefreshTokenError(error)) {
        clearAuthCookies();
      } else if (isAnonymousSessionError(error)) {
        // Normal case: no cookies → no user. Not an error, do not log.
      } else if (error.status && error.status !== 401) {
        // Genuine unexpected failure — surface it but don't crash the request.
        console.warn('[proxy] supabase.auth.getUser error:', error.message);
      }
    } else {
      user = data.user;
    }
  } catch (err) {
    if (isInvalidRefreshTokenError(err)) {
      clearAuthCookies();
    } else if (isAnonymousSessionError(err)) {
      // Normal case: no cookies → no user. Not an error, do not log.
    } else {
      console.warn('[proxy] supabase.auth.getUser threw:', err);
    }
  }

  const hasSession = Boolean(user);

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!hasSession && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthAllowedPublic = AUTH_ALLOWED_PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  if (hasSession && user) {
    const [{ data: adminRow }, { data: forumRoleRow }] = await Promise.all([
      supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('forum_global_roles').select('role').eq('user_id', user.id).maybeSingle(),
    ]);
    const isPlatformAdmin = Boolean(adminRow);
    const hasForumAccess = isPlatformAdmin || Boolean(forumRoleRow);

    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

    if (isPlatformAdmin && !isAdminRoute && !isPublicRoute && !isAuthAllowedPublic) {
      return NextResponse.redirect(new URL('/admin/foros', request.url));
    }

    if (isPlatformAdmin && isPublicRoute && pathname !== '/' && !isAuthAllowedPublic) {
      return NextResponse.redirect(new URL('/admin/foros', request.url));
    }

    if (!hasForumAccess && isAdminRoute) {
      return NextResponse.redirect(new URL('/feed', request.url));
    }
  }

  if (hasSession && isPublicRoute && pathname !== '/' && !isAuthAllowedPublic) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const safeRedirect =
      redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
        ? redirectParam
        : '/feed';
    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  return client.supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.svg).*)',
  ],
};
