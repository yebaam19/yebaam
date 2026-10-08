'use client';

import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { planDragType } from '../../utils/plan-drag';

export function PlanOrderControls({ item, kind, disabled, onUp, onDown }: {
  item: { id: string; version: number; title: string }; kind: 'axis' | 'point'; disabled: boolean;
  onUp?: () => void; onDown?: () => void;
}) {
  const t = useTranslations('communities.plans');
  const button = 'flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-30 dark:hover:bg-gray-700';
  return <div className="flex shrink-0 items-center text-gray-600 dark:text-gray-300">
    <button type="button" className={`${button} cursor-grab`} draggable={!disabled} disabled={disabled}
      aria-label={t('dragNamed', { title: item.title })} title={t('dragHint')}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(planDragType(kind), JSON.stringify({ id: item.id, version: item.version }));
      }}>
      <GripVertical size={18} aria-hidden="true" />
    </button>
    <button type="button" className={button} disabled={disabled || !onUp} onClick={onUp}
      aria-label={t('upNamed', { title: item.title })}><ArrowUp size={16} aria-hidden="true" /></button>
    <button type="button" className={button} disabled={disabled || !onDown} onClick={onDown}
      aria-label={t('downNamed', { title: item.title })}><ArrowDown size={16} aria-hidden="true" /></button>
  </div>;
}
