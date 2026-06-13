import {
  REACTION_CONFIGS,
  ReactionType,
  type ReactionCounts,
} from '../../interfaces/reaction.interfaces';

type TabKey = 'all' | ReactionType;

const REACTION_ORDER: ReactionType[] = [
  ReactionType.LIKE,
  ReactionType.LOVE,
  ReactionType.HAHA,
  ReactionType.WOW,
  ReactionType.SAD,
  ReactionType.ANGRY,
];

interface ReactionTabsProps {
  activeTab: TabKey;
  counts: ReactionCounts;
  total: number;
  onSelect: (tab: TabKey) => void;
}

export function ReactionTabs({ activeTab, counts, total, onSelect }: ReactionTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800 px-2">
      <TabButton
        active={activeTab === 'all'}
        onClick={() => onSelect('all')}
        label="Todas"
        count={total}
      />
      {REACTION_ORDER.map((type) => {
        const c = counts[type] ?? 0;
        if (c === 0) return null;
        const config = REACTION_CONFIGS[type];
        return (
          <TabButton
            key={type}
            active={activeTab === type}
            onClick={() => onSelect(type)}
            label={config.emoji}
            count={c}
            title={config.label}
          />
        );
      })}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  title?: string;
}

function TabButton({ active, onClick, label, count, title }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={[
        'shrink-0 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors',
        active
          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1.5">
        <span>{label}</span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">{count}</span>
      </span>
    </button>
  );
}
