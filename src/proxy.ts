import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/middleware';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/forgot-password',
  '/auth/callback',
  // Public chat: guests and authenticated users can enter. Identity (profile /
  // nickname / guest) is resolved inside the page via ChatEntryGate.
  '/feed/chat-publico',
];

// Subset of PUBLIC_ROUTES that authenticated users should also be able to use
// (i.e. do NOT bounce them to /feed the way /login does).
const AUTH_ALLOWED_PUBLIC_ROUTES = ['/feed/chat-publico'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, supabaseResponse } = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const hasSession = Boolean(user);

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!hasSession && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && user) {
    const [{ data: adminRow }, { data: forumRoleRow }] = await Promise.all([
      supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('forum_global_roles').select('role').eq('user_id', user.id).maybeSingle(),
    ]);
    const isPlatformAdmin = Boolean(adminRow);
    const hasForumAccess = isPlatformAdmin || Boolean(forumRoleRow);

    const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

    if (isPlatformAdmin && !isAdminRoute && !isPublicRoute) {
      return NextResponse.redirect(new URL('/admin/foros', request.url));
    }

    if (isPlatformAdmin && isPublicRoute && pathname !== '/') {
      return NextResponse.redirect(new URL('/admin/foros', request.url));
    }

    if (!hasForumAccess && isAdminRoute) {
      return NextResponse.redirect(new URL('/feed', request.url));
    }
  }

  const isAuthAllowedPublic = AUTH_ALLOWED_PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  if (hasSession && isPublicRoute && pathname !== '/' && !isAuthAllowedPublic) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const safeRedirect =
      redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
        ? redirectParam
        : '/feed';
    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.svg).*)',
  ],
};
