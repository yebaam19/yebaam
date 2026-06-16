import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { YebaamLogo } from "../components/brand/YebaamLogo";

const redirects = {
  PLATFORM_ADMIN: "/admin/dashboard",
  ARTIST: "/artist/dashboard",
  MANAGER: "/manager/dashboard",
  FOLLOWER: "/me"
} as const;

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      const state = location.state as { from?: { pathname?: string } } | null;
      navigate(state?.from?.pathname ?? redirects[user.role], { replace: true });
    } catch {
      showToast("Credenciales inválidas. Verifica tu email y contraseña.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-brand-bg">

      {/* LEFT panel — brand */}
      <div className="relative hidden overflow-hidden bg-brand-hero p-12 lg:flex lg:w-1/2 lg:items-center lg:justify-center" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(22,164,76,0.18),transparent_38%,rgba(236,132,55,0.16))]" />
        <div className="relative max-w-md text-white">
          <div className="mb-8 flex items-center gap-2.5">
            <YebaamLogo title="" className="h-10 w-[158px] text-white" />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-brand-mintLight">PerfilArtístico</span>
          </div>
          <h2 className="text-4xl font-black leading-tight">Entra a tu espacio artístico</h2>
          <p className="mt-5 text-lg text-white/70 leading-relaxed">
            Explora, conecta y construye vínculos reales alrededor de tu talento.
          </p>
          <ul className="mt-8 space-y-3" aria-label="Beneficios de la plataforma">
            {[
              "Artistas con perfil profesional verificado",
              "Managers que gestionan talento creativo",
              "Comunidad cultural activa",
              "Oportunidades reales para tu carrera"
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-green shrink-0" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* RIGHT panel — form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden" aria-hidden="true">
            <YebaamLogo title="" className="h-9 w-[142px] text-brand-greenDark" />
            <span className="rounded-full bg-brand-mintLight px-3 py-1 text-xs font-black text-brand-greenDark">PerfilArtístico</span>
          </div>

          <h1 className="text-2xl font-black text-brand-ink">Entra a tu espacio artístico</h1>
          <p className="mt-2 text-sm text-brand-muted">Accede a tu panel artístico o de gestión.</p>

          <form onSubmit={submit} className="mt-8 space-y-4" aria-label="Formulario de inicio de sesión" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-brand-ink mb-1.5">
                Correo electrónico
              </label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-brand-ink mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  aria-required="true"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-brand-muted transition hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
                  aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPwd ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              icon={<LogIn size={18} aria-hidden="true" />}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-muted">
            ¿Sin cuenta?{" "}
            <Link to="/register" className="font-bold text-brand-dark underline decoration-brand-green underline-offset-2 hover:text-brand-greenDark">
              Crear perfil artístico
            </Link>
          </p>

          {/* Demo hint */}
          <div className="mt-8 rounded-xl border border-brand-border bg-brand-bgGreen p-4" role="note" aria-label="Cuentas de demostración">
            <p className="text-xs font-semibold text-brand-ink mb-2">Cuentas demo disponibles:</p>
            <ul className="space-y-1 text-xs text-brand-muted font-mono">
              <li>platform@perfilartistico.com</li>
              <li>artist@perfilartistico.com</li>
              <li>manager@perfilartistico.com</li>
              <li className="text-brand-muted font-semibold">Contraseña: Password123!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
