import {
  FaBullhorn,
  FaHouse,
  FaLeaf,
  FaRightToBracket,
  FaShop,
  FaUserPlus,
  FaUtensils,
  FaWhatsapp,
} from 'react-icons/fa6'
import BrandLogo from './BrandLogo'

export interface FooterLinkGroup {
  title: string
  links: Array<{
    label: string
    href: string
  }>
}

export interface FooterProps {
  brandName?: string
  description?: string
  linkGroups?: FooterLinkGroup[]
  bottomText?: string
}

export default function Footer({
  description = 'Encuentra negocios locales, mira su carta, compara ofertas y decide dónde pedir con información clara desde el primer vistazo.',
  linkGroups = [
    {
      title: 'Plataforma',
      links: [
        { label: 'Inicio', href: '#' },
        { label: 'Negocios', href: '#negocios' },
        { label: 'Ofertas', href: '#promociones' },
      ],
    },
    {
      title: 'Cuenta',
      links: [
        { label: 'Iniciar sesión', href: '#login' },
        { label: 'Crear cuenta', href: '#register' },
        { label: 'WhatsApp', href: '#contacto' },
      ],
    },
    {
      title: 'Negocios',
      links: [
        { label: 'Publicar mi negocio', href: '#publicar' },
        { label: 'Panel administrativo', href: '#admin' },
      ],
    },
  ],
  bottomText = `© ${new Date().getFullYear()} Yebaam. Todos los derechos reservados.`,
}: FooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <div className="mb-4">
            <BrandLogo variant="white" className="h-14 w-auto" />
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
                <FaLeaf />
                Directorio gastronómico
              </span>
            </div>
          </div>

          <p className="max-w-md text-sm leading-6 text-slate-400">{description}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
                {group.title}
              </h4>

              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                    >
                      {link.label === 'Inicio' && <FaHouse className="text-xs" />}
                      {link.label === 'Negocios' && <FaShop className="text-xs" />}
                      {link.label === 'Ofertas' && <FaBullhorn className="text-xs" />}
                      {link.label === 'Iniciar sesión' && <FaRightToBracket className="text-xs" />}
                      {link.label === 'Crear cuenta' && <FaUserPlus className="text-xs" />}
                      {link.label === 'Panel administrativo' && <FaUtensils className="text-xs" />}
                      {link.label === 'WhatsApp' && <FaWhatsapp className="text-xs" />}
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>{bottomText}</p>
          <p>Hecho para descubrir, elegir y pedir sin dar vueltas.</p>
        </div>
      </div>
    </footer>
  )
}
