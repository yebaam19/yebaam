import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";

const actionLinkBase =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2";
const primaryActionLink = `${actionLinkBase} bg-brand-greenDark text-white shadow-green hover:bg-brand-greenDeep`;
const secondaryActionLink = `${actionLinkBase} border border-brand-green/30 bg-brand-mintLight text-brand-dark hover:bg-[#d4f1de]`;

export function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-md text-center">
        {/* Large 404 */}
        <div className="mb-4 text-8xl font-black text-brand-mintLight" aria-hidden="true">404</div>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-mintLight text-brand-greenDark" aria-hidden="true">
          <Compass size={32} />
        </div>

        {/* Text */}
        <h1 className="text-2xl font-black text-brand-ink">Página no encontrada</h1>
        <p className="mt-3 text-brand-muted leading-relaxed">
          Esta página no existe en PerfilArtístico o fue removida. Explora el directorio de artistas o vuelve al inicio.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className={primaryActionLink}>
            <Home size={16} aria-hidden="true" />
            Ir al inicio
          </Link>
          <Link to="/artists" className={secondaryActionLink}>
            <Compass size={16} aria-hidden="true" />
            Explorar artistas
          </Link>
        </div>
      </div>
    </div>
  );
}
