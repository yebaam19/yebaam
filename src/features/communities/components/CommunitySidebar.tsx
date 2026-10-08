'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleBottomCenterTextIcon,
  TagIcon,
  MegaphoneIcon,
  LinkIcon,
  CalendarDaysIcon,
} from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import type { ComponentType, SVGProps } from 'react';
import { CommunityOwnerMenu } from './CommunityOwnerMenu';

type SidebarItemKey =
  | 'members'
  | 'rules'
  | 'chat'
  | 'forums'
  | 'classifieds'
  | 'promotions'
  | 'links'
  | 'events';

interface SidebarItem {
  href: string;
  labelKey: SidebarItemKey;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** When true, render a small "Próximamente" pill next to the label. */
  comingSoon?: boolean;
}

function buildItems(slug: string): SidebarItem[] {
  const base = `/feed/comunidades/${slug}`;
  return [
    { href: `${base}/miembros`, labelKey: 'members', icon: UserGroupIcon },
    { href: `${base}/chat`, labelKey: 'chat', icon: ChatBubbleLeftRightIcon },
    { href: `${base}/foros`, labelKey: 'forums', icon: ChatBubbleBottomCenterTextIcon },
    { href: `${base}/clasificados`, labelKey: 'classifieds', icon: TagIcon, comingSoon: true },
    { href: `${base}/promociones`, labelKey: 'promotions', icon: MegaphoneIcon, comingSoon: true },
    { href: `${base}/enlaces`, labelKey: 'links', icon: LinkIcon },
    { href: `${base}/eventos`, labelKey: 'events', icon: CalendarDaysIcon, comingSoon: true },
  ];
}

interface CommunitySidebarProps {
  slug: string;
  /**
   * When the viewer is the community owner we render the management entry
   * (delete community, etc.) under the section nav. Defaults to false so guest
   * /member views are unaffected.
   */
  isOwner?: boolean;
  /** Required to power the owner-only management actions. */
  communityId?: string;
  communityName?: string;
}

export function CommunitySidebar({
  slug,
  isOwner = false,
  communityId,
  communityName,
}: CommunitySidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('communities');
  const items = buildItems(slug);

  const navigation = <nav aria-label={t('sidebar.ariaLabel')} className="flex flex-col gap-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                'group flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary-800 bg-secondary-100 text-primary-800 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700/60',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{t(`sidebar.items.${item.labelKey}`)}</span>
              {item.comingSoon && (
                <span className="shrink-0 rounded-full bg-secondary-100 dark:bg-primary-900/30 text-secondary-900 dark:text-secondary-300 text-[10px] font-medium px-2 py-0.5">
                  {t('sidebar.comingSoon')}
                </span>
              )}
            </Link>
          );
        })}
      </nav>;
  return (
    <div className="flex flex-col gap-3">
      <div className="hidden lg:block">{navigation}</div>
      <details className="lg:hidden">
        <summary className="mb-3 cursor-pointer rounded-lg bg-white px-4 py-3 text-sm font-medium dark:bg-neutral-800">{t('sidebar.ariaLabel')}</summary>
        {navigation}
      </details>
      {isOwner && communityId && communityName && (
        <div className="mt-1 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
            {t('sidebar.ownerOnly')}
          </p>
          <CommunityOwnerMenu communityId={communityId} communityName={communityName} />
        </div>
      )}
    </div>
  );
}
