'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FlagIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';
import { updateCommunity } from '@/features/communities/actions/communities.actions';
import type {
  Community,
  CommunityRule,
} from '@/features/communities/types/community.types';

interface CommunityRulesPanelProps {
  community: Community;
  isOwner?: boolean;
}

interface DraftRule {
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

        {!isEditing && (
          <>
            {sortedRules.length > 0 ? (
              <ol className="space-y-3">
                {sortedRules.map((rule, idx) => (
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
            ) : (
              <p className="text-sm italic text-gray-500 dark:text-gray-400">
                {isOwner
                  ? t('admin.rules.emptyOwner')
                  : t('admin.rules.emptyMember')}
              </p>
            )}
          </>
        )}

        {isEditing && (
          <div className="space-y-4">
            {drafts.length === 0 && (
              <p className="text-sm italic text-gray-500 dark:text-gray-400">
                {t('admin.rules.editorEmpty')}
              </p>
            )}
            {drafts.map((draft, idx) => (
              <div
                key={draft.key}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t('admin.rules.ruleLabel', { n: idx + 1 })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(idx, -1)}
                      disabled={idx === 0 || isPending}
                      className="rounded-md p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
                      aria-label={t('admin.rules.moveUpAria')}
                    >
                      <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 1)}
                      disabled={idx === drafts.length - 1 || isPending}
                      className="rounded-md p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-700"
                      aria-label={t('admin.rules.moveDownAria')}
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(draft.key)}
                      disabled={isPending}
                      className="rounded-md p-1 text-red-500 hover:bg-red-50 disabled:opacity-30 dark:hover:bg-red-900/30"
                      aria-label={t('admin.rules.removeAria')}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => handleField(draft.key, 'title', e.target.value)}
                  placeholder={t('admin.rules.titlePlaceholder')}
                  disabled={isPending}
                  maxLength={MAX_TITLE}
                  className="mb-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <textarea
                  value={draft.description}
                  onChange={(e) => handleField(draft.key, 'description', e.target.value)}
                  placeholder={t('admin.rules.descriptionPlaceholder')}
                  rows={2}
                  disabled={isPending}
                  maxLength={MAX_DESCRIPTION}
                  className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddRule}
              disabled={isPending || drafts.length >= MAX_RULES}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-blue-400 dark:hover:text-blue-400"
            >
              <PlusIcon className="h-4 w-4" />
              {t('admin.rules.addRule')}
            </button>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700/60"
              >
                <XMarkIcon className="h-4 w-4" />
                {t('admin.rules.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? t('admin.rules.saving') : t('admin.rules.save')}
              </button>
            </div>
          </div>
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
