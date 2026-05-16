import { getTranslations } from 'next-intl/server';

type CapabilityKey =
  | 'editFamilyInfo'
  | 'changeGeneralPermissions'
  | 'promoteRemoveMembers'
  | 'inviteRemoveMembers'
  | 'restrictPerPersonViews'
  | 'transferOwnership'
  | 'deleteFamily'
  | 'manageContent'
  | 'addContentSubjectToToggles';

interface RoleColumn {
  roleKey: 'owner' | 'admin' | 'member';
  badgeColor: string;
  capabilities: Array<{ key: CapabilityKey; can: boolean }>;
}

const COLUMNS: RoleColumn[] = [
  {
    roleKey: 'owner',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    capabilities: [
      { key: 'editFamilyInfo', can: true },
      { key: 'changeGeneralPermissions', can: true },
      { key: 'promoteRemoveMembers', can: true },
      { key: 'restrictPerPersonViews', can: true },
      { key: 'transferOwnership', can: true },
      { key: 'deleteFamily', can: true },
      { key: 'manageContent', can: true },
    ],
  },
  {
    roleKey: 'admin',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    capabilities: [
      { key: 'editFamilyInfo', can: true },
      { key: 'changeGeneralPermissions', can: true },
      { key: 'inviteRemoveMembers', can: true },
      { key: 'restrictPerPersonViews', can: true },
      { key: 'transferOwnership', can: false },
      { key: 'deleteFamily', can: false },
      { key: 'manageContent', can: true },
    ],
  },
  {
    roleKey: 'member',
    badgeColor: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    capabilities: [
      { key: 'editFamilyInfo', can: false },
      { key: 'changeGeneralPermissions', can: false },
      { key: 'inviteRemoveMembers', can: false },
      { key: 'restrictPerPersonViews', can: false },
      { key: 'transferOwnership', can: false },
      { key: 'deleteFamily', can: false },
      { key: 'addContentSubjectToToggles', can: true },
    ],
  },
];

export async function RoleMatrixCard() {
  const t = await getTranslations('familias.permissions.roleMatrix');
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
        {t('intro')}
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => (
          <div
            key={col.roleKey}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40"
          >
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${col.badgeColor}`}
            >
              {t(`roles.${col.roleKey}`)}
            </span>
            <ul className="mt-3 space-y-1.5 text-xs">
              {col.capabilities.map((cap) => (
                <li key={cap.key} className="flex items-start gap-1.5">
                  <span className={cap.can ? 'text-emerald-600' : 'text-rose-500'} aria-hidden>
                    {cap.can ? '✓' : '✗'}
                  </span>
                  <span className={cap.can ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400 line-through dark:text-zinc-600'}>
                    {t(`capabilities.${cap.key}`)}
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
