import { NextResponse, type NextRequest } from 'next/server';
import {
  createClient,
  isAnonymousSessionError,
  isInvalidRefreshTokenError,
  redirectWithCookies,
} from '@/utils/supabase/middleware';
import { MUSIC_CLUB_ENABLED } from '@/features/music-archive/config';
import { sanitizeRedirectPath } from '@/lib/auth/safe-redirect';
import { hasAdminViewParam } from '@/lib/auth/admin-view';

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
  // Cities Portal: public read by design (PDF spec, see foamy-singing-lemur).
  // Writes (follow, post, complaint) gate at the server-action layer via
  // requireUserId(); guests can browse the portal without an account.
  '/cities',
  // Badges catalog: public by design (PDF spec, badges-e-insignias). Anyone
  // can see what recognitions exist. Requesting requires auth, gated at the
  // server-action layer (requestBadge).
  '/insignias',
  // Professional services directory: public read by design (PDF spec — the
  // discovery flow starts in the public city portal directory). Creating a
  // service requires a verified professional profile, gated in the UI.
  '/professional-services',
  // Secondary platforms migrated into this app: ComídasYebaam, PerfilArtístico,
  // YebaamEscuelas. Public listing and detail pages; writes gate at the
  // server-action layer via requireSession().
  '/negocios',
  '/artistas',
  '/escuelas',
  '/programas',
  '/oportunidades',
  '/promociones',
  // Legal / normativa pages (Términos, Normas Comunitarias, Reglamento). Public
  // by design — must be readable by anyone (incl. from the signup consent links)
  // without an account, like a platform's Terms/Privacy pages.
  '/normativa',
];

// Subset of PUBLIC_ROUTES that authenticated users (including admins) should
// also be able to use without being bounced to /feed or /admin/foros.
const AUTH_ALLOWED_PUBLIC_ROUTES = [
  '/feed/chat-publico',
  '/verification/certificate',
  '/musica',
  '/cities',
  '/insignias',
  '/professional-services',
  '/negocios',
  '/artistas',
  '/escuelas',
  '/programas',
  '/oportunidades',
  '/promociones',
  '/normativa',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Music archive kill switch — when disabled, the whole module is hidden.
  // We rewrite to a synthetic 404 path so Next's not-found UI renders.
  if (
    !MUSIC_CLUB_ENABLED &&
    (pathname === '/musica' ||
      pathname.startsWith('/musica/') ||
      pathname === '/admin/music' ||
      pathname.startsWith('/admin/music/'))
  ) {
    return NextResponse.rewrite(new URL('/_not-found', request.url));
  }

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

  // `/` is a pure redirect target: signed-in users go to their feed, everyone
  // else to login. Handle it here, before any page renders, so we never
  // server-render the authenticated app-shell layout (Header, sidebars, music
  // players, i18n catalog) just to throw it away on redirect. That discarded
  // shell render — not the auth lookup — was the dominant Active CPU cost on
  // `/` (Vercel Observability showed `/` burning ~6x the CPU/request of
  // `/login`, which sits under the much lighter (auth) layout). Doing it here
  // also skips the two admin-role queries below for this path.
  if (pathname === '/') {
    return redirectWithCookies(new URL(hasSession ? '/feed' : '/login', request.url), client);
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!hasSession && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return redirectWithCookies(loginUrl, client);
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

    // Explicit "ver como público" link from the admin panel (e.g. the user
    // detail's "Ver perfil público"). Without this the corral below would bounce
    // the admin straight back into /admin, so the profile never rendered.
    const isAdminView = isPlatformAdmin && hasAdminViewParam(request.nextUrl.searchParams);

    if (isPlatformAdmin && !isAdminView && !isAdminRoute && !isPublicRoute && !isAuthAllowedPublic) {
      return redirectWithCookies(new URL('/admin/foros', request.url), client);
    }

    if (isPlatformAdmin && !isAdminView && isPublicRoute && pathname !== '/' && !isAuthAllowedPublic) {
      return redirectWithCookies(new URL('/admin/foros', request.url), client);
    }

    if (!hasForumAccess && isAdminRoute) {
      return redirectWithCookies(new URL('/feed', request.url), client);
    }
  }

  if (hasSession && isPublicRoute && pathname !== '/' && !isAuthAllowedPublic) {
    const safeRedirect = sanitizeRedirectPath(request.nextUrl.searchParams.get('redirect'));
    return redirectWithCookies(new URL(safeRedirect, request.url), client);
  }

  return client.supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|monitoring|_next/static|_next/image|favicon.ico|icon.png|opengraph-image|twitter-image|apple-icon|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.svg).*)',
  ],
};
