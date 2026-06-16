import Button from '../../../components/ui/Button'
import SearchBar from '../../../components/shared/SearchBar'
import { buildVisualImageDataUrl } from '../../../lib/visualImage'

export interface HeroSectionProps {
  search: string
  onSearchChange: (value: string) => void
  onSearchSubmit?: () => void
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
}

export default function HeroSection({
  search,
  onSearchChange,
  onSearchSubmit,
  onPrimaryAction,
  onSecondaryAction,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-orange-200 blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-amber-200 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-rose-100 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-3 inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
            Descubre qué pedir
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Encuentra comida que sí se te antoje.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Explora negocios locales, revisa cartas, compara ofertas, mira fotos reales
            y decide con menos vueltas.
          </p>

          <div className="mt-8 max-w-2xl">
            <SearchBar
              value={search}
              onChange={onSearchChange}
              onSearch={onSearchSubmit}
              placeholder="Busca hamburguesas, pizzas, perros, combos o negocios"
              buttonLabel="Explorar"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={onPrimaryAction}>
              Ver negocios destacados
            </Button>
            <Button variant="outline" size="lg" onClick={onSecondaryAction}>
              Publicar mi negocio
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-500">
            <div>
              <span className="block text-xl font-bold text-slate-900">+120</span>
              negocios activos
            </div>
            <div>
              <span className="block text-xl font-bold text-slate-900">+850</span>
              platos visibles
            </div>
            <div>
              <span className="block text-xl font-bold text-slate-900">+2.4K</span>
              acciones directas
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl shadow-lg">
                <img
                  src={buildVisualImageDataUrl('Hamburguesas', 'Negocios y platos')}
                  alt="Hamburguesas"
                  className="h-64 w-full object-cover"
                />
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-md ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">Decisión más fácil</p>
                <p className="mt-1 text-sm text-slate-500">
                  Fotos, precio, reputación y contacto en una experiencia clara.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-lg">
                <p className="text-sm font-medium text-orange-300">Ofertas activas</p>
                <p className="mt-2 text-2xl font-bold">Combos y descuentos</p>
                <p className="mt-2 text-sm text-slate-300">
                  Encuentra oportunidades reales sin navegar de más.
                </p>
              </div>

              <div className="overflow-hidden rounded-3xl shadow-lg">
                <img
                  src={buildVisualImageDataUrl('Pizzas', 'Platos populares')}
                  alt="Pizzas"
                  className="h-72 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
