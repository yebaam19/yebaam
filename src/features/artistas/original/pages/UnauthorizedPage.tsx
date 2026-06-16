import { Link } from "react-router-dom";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const roleHome: Record<string, string> = {
  FOLLOWER:       "/me",
  ARTIST:         "/artist/dashboard",
  MANAGER:        "/manager/dashboard",
  PLATFORM_ADMIN: "/admin/dashboard"
};

const actionLinkBase =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2";
const primaryActionLink = `${actionLinkBase} bg-brand-greenDark text-white shadow-green hover:bg-brand-greenDeep`;
const ghostActionLink = `${actionLinkBase} bg-transparent text-brand-ink hover:bg-brand-mintLight`;

export function UnauthorizedPage() {
  const { user } = useAuth();
  const destination = user ? roleHome[user.role] ?? "/" : "/";

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500" aria-hidden="true">
          <ShieldAlert size={40} />
        </div>

        {/* Text */}
        <h1 className="text-3xl font-black text-brand-ink">Acceso no autorizado</h1>
        <p className="mt-3 text-brand-muted leading-relaxed">
          Este espacio no está disponible para tu rol actual. Te llevamos a un espacio adecuado para tu cuenta.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link to={destination} className={primaryActionLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              Ir a mi panel
            </Link>
          ) : (
            <Link to="/login" className={primaryActionLink}>Ingresar</Link>
          )}
          <Link to="/" className={ghostActionLink}>
            <Home size={16} aria-hidden="true" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
