import { useTranslations } from 'next-intl';
import type { CommunityRule } from '@/features/communities/types/community.types';

interface RulesListProps {
  rules: CommunityRule[];
  isOwner: boolean;
}

export function RulesList({ rules, isOwner }: RulesListProps) {
  const t = useTranslations('communities');

  if (rules.length === 0) {
    return (
      <p className="text-sm italic text-gray-500 dark:text-gray-400">
        {isOwner
          ? t('admin.rules.emptyOwner')
          : t('admin.rules.emptyMember')}
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {rules.map((rule, idx) => (
        <li key={rule.id ?? `${rule.title}-${idx}`} className="flex gap-3">
          <span className="shrink-0 font-semibold text-gray-900 dark:text-white">
            {idx + 1}.
          </span>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{rule.title}</p>
            {rule.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {rule.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
