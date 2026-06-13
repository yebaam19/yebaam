'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  FlagIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
} from '@/components/icons/heroicons-shim';
import { updateCommunity } from '@/features/communities/actions/update.actions';
import type {
  Community,
  CommunityRule,
} from '@/features/communities/types/community.types';
import { RulesList } from './CommunityRulesPanel/RulesList';
import { RulesEditor } from './CommunityRulesPanel/RulesEditor';

interface CommunityRulesPanelProps {
  community: Community;
  isOwner?: boolean;
}

export interface DraftRule {
  // Local-only key for React; server reassigns ids based on order.
  key: string;
  title: string;
  description: string;
}

const MAX_RULES = 30;
const MAX_TITLE = 120;
const MAX_DESCRIPTION = 600;

function toDrafts(rules: CommunityRule[] | undefined): DraftRule[] {
  if (!rules || rules.length === 0) return [];
  return [...rules]
    .sort((a, b) => a.order - b.order)
    .map((r, idx) => ({
      key: `${r.id ?? 'rule'}-${idx}`,
      title: r.title,
      description: r.description ?? '',
    }));
}

export function CommunityRulesPanel({
  community: c,
  isOwner = false,
}: CommunityRulesPanelProps) {
  const router = useRouter();
  const t = useTranslations('communities');
  const [isEditing, setIsEditing] = useState(false);
  const [drafts, setDrafts] = useState<DraftRule[]>(() => toDrafts(c.rules));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedRules = (c.rules ?? []).slice().sort((a, b) => a.order - b.order);

  const handleAddRule = () => {
    if (drafts.length >= MAX_RULES) {
      setError(t('admin.rules.errorMax', { max: MAX_RULES }));
      return;
    }
    setError(null);
    setDrafts((prev) => [
      ...prev,
      { key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: '', description: '' },
    ]);
  };

  const handleRemoveRule = (key: string) => {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    setDrafts((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleField = (key: string, field: 'title' | 'description', value: string) => {
    const cap = field === 'title' ? MAX_TITLE : MAX_DESCRIPTION;
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, [field]: value.slice(0, cap) } : d)),
    );
  };

  const handleStartEditing = () => {
    setError(null);
    setDrafts(toDrafts(c.rules));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setError(null);
    setDrafts(toDrafts(c.rules));
    setIsEditing(false);
  };

  const handleSave = () => {
    setError(null);
    const cleaned = drafts
      .map((d) => ({ title: d.title.trim(), description: d.description.trim() }))
      .filter((d) => d.title.length > 0);

    if (cleaned.some((d) => d.title.length === 0)) {
      setError(t('admin.rules.errorTitleRequired'));
      return;
    }

    startTransition(async () => {
      const result = await updateCommunity({
        id: c.id,
        rules: cleaned.map((d, idx) => ({
          title: d.title,
          description: d.description,
          order: idx + 1,
        })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('admin.rules.title')}
            </h2>
          </div>
          {isOwner && !isEditing && (
            <button
              type="button"
              onClick={handleStartEditing}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <PencilSquareIcon className="h-4 w-4" />
              {sortedRules.length > 0 ? t('admin.rules.editRules') : t('admin.rules.addRules')}
            </button>
          )}
        </div>

        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        )}

        {!isEditing && <RulesList rules={sortedRules} isOwner={isOwner} />}

        {isEditing && (
          <RulesEditor
            drafts={drafts}
            isPending={isPending}
            maxRules={MAX_RULES}
            maxTitle={MAX_TITLE}
            maxDescription={MAX_DESCRIPTION}
            onField={handleField}
            onMove={handleMove}
            onRemove={handleRemoveRule}
            onAdd={handleAddRule}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        )}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <FlagIcon className="h-5 w-5 text-red-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('admin.rules.reportsTitle')}</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('admin.rules.reportsDescription')}
        </p>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-not-allowed"
        >
          <FlagIcon className="h-4 w-4" />
          {t('admin.rules.reportContent')}
        </button>
        <span className="ml-2 inline-block rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-[10px] font-medium px-2 py-0.5">
          {t('comingSoon.badge')}
        </span>
      </section>
    </div>
  );
}
