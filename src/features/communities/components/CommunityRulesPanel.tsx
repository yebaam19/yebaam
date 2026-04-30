import { ShieldCheckIcon, FlagIcon } from '@/components/icons/heroicons-shim';
import type { Community } from '@/features/communities/types/community.types';

interface CommunityRulesPanelProps {
  community: Community;
}

export function CommunityRulesPanel({ community: c }: CommunityRulesPanelProps) {
  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Reglas de la comunidad
          </h2>
        </div>
        {c.rules && c.rules.length > 0 ? (
          <ol className="space-y-3">
            {c.rules.map((rule) => (
              <li key={rule.id} className="flex gap-3">
                <span className="font-semibold text-gray-900 dark:text-white shrink-0">
                  {rule.order}.
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{rule.title}</p>
                  {rule.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Esta comunidad aún no ha publicado reglas.
          </p>
        )}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <FlagIcon className="h-5 w-5 text-red-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Denuncias</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          ¿Viste algo que rompe las reglas? Pronto podrás reportar contenido directamente desde aquí.
        </p>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-not-allowed"
        >
          <FlagIcon className="h-4 w-4" />
          Reportar contenido
        </button>
        <span className="ml-2 inline-block rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-[10px] font-medium px-2 py-0.5">
          Próximamente
        </span>
      </section>
    </div>
  );
}
