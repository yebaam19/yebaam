import { NextResponse, NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get('accessToken')?.value;
  const isAuthenticated = !!accessToken;
  
  const publicRoutes = [
    '/',
    '/login',
    '/signup', 
    '/verify-email',
    '/forgot-password',
  ];

  const excludedPaths = [
    '/api',
    '/_next',
    '/favicon.ico',
    '/icon.svg',
  ];

  // Verificar si es una ruta excluida (estáticos, API, etc.)
  const isExcludedPath = excludedPaths.some((path) => pathname.startsWith(path));
  if (isExcludedPath) {
    console.log('Ruta excluida (estáticos)');
    return NextResponse.next();
  }
  
  const isPublicRoute = publicRoutes.some((path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname === path || pathname.startsWith(path + '/');
  });
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/feed', req.url));
  }
  
  if (!isAuthenticated && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    // Guardar la URL destino para redirigir después del login
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg (favicons)
     * - *.png, *.jpg, *.svg (images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
