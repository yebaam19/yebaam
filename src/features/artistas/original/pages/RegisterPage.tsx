import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Star, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { YebaamLogo } from "../components/brand/YebaamLogo";

export function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "ARTIST" as "FOLLOWER" | "ARTIST"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await register(form);
      showToast("¡Cuenta creada correctamente. Bienvenido/a!", "success");
      navigate(user.role === "ARTIST" ? "/artist/profile" : "/me", { replace: true });
    } catch {
      showToast("No se pudo crear la cuenta. Intenta nuevamente.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] bg-brand-bg">

      {/* LEFT — brand */}
      <div className="relative hidden overflow-hidden bg-brand-hero p-12 lg:flex lg:w-2/5 lg:items-center lg:justify-center" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(22,164,76,0.20),transparent_40%,rgba(247,170,0,0.14))]" />
        <div className="relative max-w-sm text-white">
          <div className="mb-8 flex items-center gap-2.5">
            <YebaamLogo title="" className="h-10 w-[158px] text-white" />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-brand-mintLight">PerfilArtístico</span>
          </div>
          <h2 className="text-3xl font-black leading-tight">Crea tu presencia artística profesional</h2>
          <p className="mt-4 text-white/70 leading-relaxed">
            Muestra tu talento, conecta con oportunidades y construye tu marca personal dentro de la comunidad creativa.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4">
              <Star size={18} className="mt-0.5 text-brand-gold shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">Artista</p>
                <p className="text-xs text-white/60 mt-0.5">Perfil profesional, portafolio, servicios, experiencia y acceso a oportunidades culturales.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4">
              <Users size={18} className="mt-0.5 text-brand-mint shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold">Seguidor</p>
                <p className="text-xs text-white/60 mt-0.5">Explora artistas, guarda favoritos y sigue el ecosistema creativo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden" aria-hidden="true">
            <YebaamLogo title="" className="h-9 w-[142px] text-brand-greenDark" />
            <span className="rounded-full bg-brand-mintLight px-3 py-1 text-xs font-black text-brand-greenDark">PerfilArtístico</span>
          </div>

          <h1 className="text-2xl font-black text-brand-ink">Crear cuenta</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Registro de artistas y seguidores. Managers y admins se gestionan internamente.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4" aria-label="Formulario de registro" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-firstName" className="block text-sm font-semibold text-brand-ink mb-1.5">
                  Nombre
                </label>
                <Input
                  id="reg-firstName"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  required
                  aria-required="true"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label htmlFor="reg-lastName" className="block text-sm font-semibold text-brand-ink mb-1.5">
                  Apellido
                </label>
                <Input
                  id="reg-lastName"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  required
                  aria-required="true"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-semibold text-brand-ink mb-1.5">
                Correo electrónico
              </label>
              <Input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                aria-required="true"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-brand-ink mb-1.5">
                Contraseña
              </label>
              <Input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                aria-required="true"
                minLength={8}
                autoComplete="new-password"
                aria-describedby="reg-password-hint"
              />
              <p id="reg-password-hint" className="mt-1 text-xs text-brand-muted">
                Mínimo 8 caracteres con letras y números.
              </p>
            </div>

            <div>
              <label htmlFor="reg-role" className="block text-sm font-semibold text-brand-ink mb-1.5">
                Tipo de cuenta
              </label>
              <Select
                id="reg-role"
                value={form.role}
                onChange={(e) => set("role", e.target.value as "FOLLOWER" | "ARTIST")}
                aria-describedby="reg-role-hint"
              >
                <option value="ARTIST">Artista — perfil profesional y portafolio</option>
                <option value="FOLLOWER">Seguidor — explorar y guardar artistas</option>
              </Select>
              <p id="reg-role-hint" className="sr-only">Selecciona el tipo de cuenta que deseas crear.</p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              icon={<UserPlus size={18} aria-hidden="true" />}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Creando cuenta…" : "Crear mi cuenta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-brand-muted">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-bold text-brand-dark underline decoration-brand-green underline-offset-2 hover:text-brand-greenDark">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
