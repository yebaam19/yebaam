/** Browser auth needs readable SSR cookies; HTTPS deployments must mark them Secure. */
export const authCookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
};
