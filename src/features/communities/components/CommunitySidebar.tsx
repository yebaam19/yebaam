'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import {
  UserGroupIcon,
  ShieldCheckIcon,
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

interface SidebarItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** When true, render a small "Próximamente" pill next to the label. */
  comingSoon?: boolean;
}

function buildItems(slug: string): SidebarItem[] {
  const base = `/feed/comunidades/${slug}`;
  return [
    { href: `${base}/miembros`, label: 'Miembros y Seguidores', icon: UserGroupIcon },
    { href: `${base}/reglas`, label: 'Reglas y Denuncias', icon: ShieldCheckIcon },
    { href: `${base}/chat`, label: 'Chat Publico', icon: ChatBubbleLeftRightIcon },
    { href: `${base}/foros`, label: 'Foros', icon: ChatBubbleBottomCenterTextIcon },
    { href: `${base}/clasificados`, label: 'Clasificados', icon: TagIcon, comingSoon: true },
    { href: `${base}/promociones`, label: 'Promociones', icon: MegaphoneIcon, comingSoon: true },
    { href: `${base}/enlaces`, label: 'Enlaces a Páginas', icon: LinkIcon },
    { href: `${base}/eventos`, label: 'Eventos', icon: CalendarDaysIcon, comingSoon: true },
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
  const items = buildItems(slug);

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Secciones de la comunidad" className="flex flex-col gap-1.5">
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
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700/60',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.comingSoon && (
                <span className="shrink-0 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-[10px] font-medium px-2 py-0.5">
                  Pronto
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {isOwner && communityId && communityName && (
        <div className="mt-1 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
            Solo el propietario
          </p>
          <CommunityOwnerMenu communityId={communityId} communityName={communityName} />
        </div>
      )}
    </div>
  );
}
