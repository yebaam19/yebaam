interface RoleColumn {
  title: string;
  badgeColor: string;
  capabilities: Array<{ label: string; can: boolean }>;
}

const COLUMNS: RoleColumn[] = [
  {
    title: 'Owner',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    capabilities: [
      { label: 'Editar información de la familia', can: true },
      { label: 'Cambiar permisos generales', can: true },
      { label: 'Promover / expulsar miembros', can: true },
      { label: 'Restringir vistas por persona', can: true },
      { label: 'Transferir propiedad', can: true },
      { label: 'Eliminar la familia', can: true },
      { label: 'Agregar/editar/borrar personas, eventos, fotos, etc.', can: true },
    ],
  },
  {
    title: 'Admin',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    capabilities: [
      { label: 'Editar información de la familia', can: true },
      { label: 'Cambiar permisos generales', can: true },
      { label: 'Invitar / expulsar miembros', can: true },
      { label: 'Restringir vistas por persona', can: true },
      { label: 'Transferir propiedad', can: false },
      { label: 'Eliminar la familia', can: false },
      { label: 'Agregar/editar/borrar personas, eventos, fotos, etc.', can: true },
    ],
  },
  {
    title: 'Member',
    badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    capabilities: [
      { label: 'Editar información de la familia', can: false },
      { label: 'Cambiar permisos generales', can: false },
      { label: 'Invitar / expulsar miembros', can: false },
      { label: 'Restringir vistas por persona', can: false },
      { label: 'Transferir propiedad', can: false },
      { label: 'Eliminar la familia', can: false },
      { label: 'Agregar contenido (sujeto a toggles)', can: true },
    ],
  },
];

export function RoleMatrixCard() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        Resumen de qué puede hacer cada rol. Los toggles de "Permisos generales" pueden restringir aún más a los miembros.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <div
            key={col.title}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${col.badgeColor}`}
            >
              {col.title}
            </span>
            <ul className="mt-3 space-y-1.5 text-xs">
              {col.capabilities.map((cap) => (
                <li key={cap.label} className="flex items-start gap-1.5">
                  <span className={cap.can ? 'text-emerald-600' : 'text-rose-500'} aria-hidden>
                    {cap.can ? '✓' : '✗'}
                  </span>
                  <span className={cap.can ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 line-through dark:text-zinc-600'}>
                    {cap.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
