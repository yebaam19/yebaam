'use client';

import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { useTranslations } from 'next-intl';
import { FaceSmileIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { FEELINGS, ACTIVITIES } from '../constants/post.constants';
import type { PostFeeling } from '../interfaces/post.interfaces';

interface PostFeelingSelectorProps {
  onSelect: (feeling: PostFeeling) => void;
  disabled?: boolean;
}

export default function PostFeelingSelector({ onSelect, disabled = false }: PostFeelingSelectorProps) {
  const t = useTranslations('feed');
  return (
    <Menu as="div" className="relative">
      <MenuButton
        disabled={disabled}
        className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('feelingPicker.title')}
      >
        <FaceSmileIcon className="h-6 w-6 text-yellow-600" />
      </MenuButton>

      <MenuItems className="absolute bottom-full left-0 mb-2 w-80 rounded-lg bg-white shadow-xl ring-1 ring-black/5 dark:bg-neutral-800 focus:outline-none z-50">
        <div className="p-2">
          {/* Feelings Section */}
          <div className="mb-2 px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {t('feelingPicker.feelingsHeading')}
          </div>
          <div className="max-h-48 overflow-y-auto">
            {FEELINGS.map((feeling) => {
              const label = t(`feelings.${feeling.id}`);
              return (
                <MenuItem key={feeling.type}>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={() =>
                        onSelect({
                          type: feeling.type,
                          label,
                          emoji: feeling.emoji,
                          prefix: feeling.prefix,
                        })
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        focus && "bg-neutral-100 dark:bg-neutral-700"
                      )}
                    >
                      <span className="text-2xl">{feeling.emoji}</span>
                      <span className="text-neutral-900 dark:text-white">{label}</span>
                    </button>
                  )}
                </MenuItem>
              );
            })}
          </div>

          {/* Activities Section */}
          <div className="mb-2 mt-4 px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {t('feelingPicker.activitiesHeading')}
          </div>
          <div className="max-h-48 overflow-y-auto">
            {ACTIVITIES.map((activity) => {
              const label = t(`activities.${activity.id}`);
              return (
                <MenuItem key={activity.type}>
                  {({ focus }) => (
                    <button
                      type="button"
                      onClick={() =>
                        onSelect({
                          type: activity.type,
                          label,
                          emoji: activity.emoji,
                          prefix: activity.prefix,
                        })
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm",
                        focus && "bg-neutral-100 dark:bg-neutral-700"
                      )}
                    >
                      <span className="text-2xl">{activity.emoji}</span>
                      <span className="text-neutral-900 dark:text-white">{label}</span>
                    </button>
                  )}
                </MenuItem>
              );
            })}
          </div>
        </div>
      </MenuItems>
    </Menu>
  );
}
