import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import type { AuthUser } from '../../types';

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function RegisterPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName]       = useState('');
  const [lastName, setLastName]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
  const [error, setError]               = useState<string | null>(null);
  const [isSubmitting, setSubmitting]   = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  function validate(): string | null {
    if (!firstName.trim()) return 'Ingresa tu nombre.';
    if (!lastName.trim())  return 'Ingresa tu apellido.';
    if (!validateEmail(email)) return 'El correo electrónico no es válido.';
    if (password.length < 8)   return 'La contraseña debe tener al menos 8 caracteres.';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden.';
    return null;
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) { setError(err); return; }

    setSubmitting(true);
    try {
      const res = await api.post<{ ok: boolean; data: { token: string; user: AuthUser } }>(
        '/auth/register',
        { firstName, lastName, email, password },
      );
      login(res.data.data.token, res.data.data.user);
      navigate('/admin', { replace: true });
    } catch (ex: unknown) {
      setError((ex as { message?: string })?.message ?? 'No se pudo crear la cuenta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full rounded-xl border border-[#dce8dc] bg-[#f9fdf9] px-4 py-2.5 text-sm text-[#151d18] placeholder:text-[#9aab9c] transition focus:border-[#006b2d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006b2d]/20';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f3fcf3] px-5 py-12">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006b2d]">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#151d18]">Registra tu escuela</h1>
          <p className="mt-1 text-sm text-[#5f6d61]">Crea tu cuenta y comienza a publicar tus programas</p>
        </div>

        <div className="rounded-2xl border border-[#dfeadf] bg-white p-8 shadow-sm">
          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-[#253429]">Nombre</label>
                <input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  placeholder="Ana"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-[#253429]">Apellido</label>
                <input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  placeholder="García"
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#253429]">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@escuela.com"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#253429]">
                Contraseña
                <span className="ml-1 text-xs font-normal text-[#7a887b]">(mínimo 8 caracteres)</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#253429]">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={`mt-1.5 ${inputClass}`}
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
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#5f6d61]">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-[#006b2d] hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
