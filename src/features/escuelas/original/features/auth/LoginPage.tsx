import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import type { AuthUser } from '../../types';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as { from?: Location })?.from?.pathname ?? '/admin';

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; data: { token: string; user: AuthUser } }>(
        '/auth/login',
        { email, password },
      );
      login(res.data.data.token, res.data.data.user);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Correo o contraseña incorrectos. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f3fcf3] px-5 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006b2d]">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#151d18]">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-[#5f6d61]">Inicia sesión en tu panel de administración</p>
        </div>

        <div className="rounded-2xl border border-[#dfeadf] bg-white p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#253429]">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@escuela.com"
                className="mt-1.5 w-full rounded-xl border border-[#dce8dc] bg-[#f9fdf9] px-4 py-2.5 text-sm text-[#151d18] placeholder:text-[#9aab9c] transition focus:border-[#006b2d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006b2d]/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#253429]">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-[#dce8dc] bg-[#f9fdf9] px-4 py-2.5 text-sm text-[#151d18] placeholder:text-[#9aab9c] transition focus:border-[#006b2d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006b2d]/20"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3" role="alert">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              className="w-full justify-center"
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#5f6d61]">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-[#006b2d] hover:underline">
              Registra tu escuela
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
