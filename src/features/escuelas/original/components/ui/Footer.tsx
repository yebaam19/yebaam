import { Link } from 'react-router-dom';

const LINKS = {
  plataforma: [
    { label: 'Explorar escuelas', to: '/schools' },
    { label: 'Ver cursos',        to: '/programs' },
    { label: 'Campañas',          to: '/campaigns' },
    { label: 'Eventos',           to: '/events' },
  ],
  escuelas: [
    { label: 'Registrar mi escuela', to: '/register' },
    { label: 'Acceso al panel',      to: '/login' },
  ],
  soporte: [
    { label: 'Sobre nosotros',  href: '#' },
    { label: 'Términos de uso', href: '#' },
    { label: 'Privacidad',      href: '#' },
    { label: 'Ayuda',           href: '#' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#dfeadf] bg-white">
      <div className="mx-auto max-w-[1440px] px-5 py-12 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="#006b2d" />
                <path d="M8 22V12l8-4 8 4v10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 22v-5h6v5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="16" cy="14" r="2" fill="#fff" />
              </svg>
              <span className="text-base font-black text-[#151d18]">
                YEBAAM <span className="font-medium text-[#5f6d61]">Escuelas</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#5f6d61]">
              El directorio de referencia para descubrir escuelas de música, danza, teatro, artes visuales y más.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#7a887b]">Plataforma</h3>
            <ul className="mt-4 space-y-2.5">
              {LINKS.plataforma.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-[#5f6d61] transition hover:text-[#006b2d]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Escuelas */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#7a887b]">Para escuelas</h3>
            <ul className="mt-4 space-y-2.5">
              {LINKS.escuelas.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-[#5f6d61] transition hover:text-[#006b2d]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#7a887b]">Soporte</h3>
            <ul className="mt-4 space-y-2.5">
              {LINKS.soporte.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-[#5f6d61] transition hover:text-[#006b2d]">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[#dfeadf] pt-6 sm:flex-row">
          <p className="text-xs text-[#7a887b]">© {year} YEBAAM Escuelas. Todos los derechos reservados.</p>
          <p className="text-xs text-[#7a887b]">Hecho con amor para la comunidad educativa artística.</p>
        </div>
      </div>
    </footer>
  );
}
