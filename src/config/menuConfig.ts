import { principalMenu } from './menu-principal';
import { secondaryMenu } from './menu-secondary';
import type { ComponentType } from 'react';
import type { FeatureFlag } from './features-flag';
import { isFeatureEnabled } from './features-flag';

/** Icon component rendered in the sidebar; heroicons-shim wrappers accept only `className`. */
export type MenuIcon = ComponentType<{ className?: string }>;

/** A menu item as authored below, before `{basePath}`/`{badge*}` resolution. */
interface MenuItemConfig {
  icon: MenuIcon;
  labelKey: string;
  href: string;
  badge?: string;
  badgeKey?: string;
  badgeHideOnMobile?: boolean;
  featureFlag?: FeatureFlag;
}

export interface MenuSectionConfig {
  sectionKey: string;
  items: MenuItemConfig[];
}

export const menuConfig: Record<string, MenuSectionConfig[]> = {
  USER: [...principalMenu, ...secondaryMenu],
};

/** A menu item after its href/badge placeholders have been resolved for a user. */
export interface ResolvedMenuItem {
  icon: MenuIcon;
  labelKey: string;
  href: string;
  badge?: string;
  badgeKey?: string;
  /** Always present (defaulted to false) once the menu has been resolved. */
  badgeHideOnMobile: boolean;
}

/** A menu section whose items have been resolved. */
export interface ResolvedMenuSection {
  sectionKey: string;
  items: ResolvedMenuItem[];
}

/**
 * Helper para obtener el menú con rutas dinámicas según el usuario.
 * Devuelve `labelKey` y `badgeKey` (resolverlos con `useTranslations('nav')` en el render).
 */
export function getMenuForUser(
  userType: string,
  basePath: string,
  badges?: {
    notifications?: string;
    friendRequests?: string;
    messages?: string;
    groupInvites?: string;
  },
  username?: string
): ResolvedMenuSection[] {
  const normalizedUserType = String(userType).toUpperCase();
  const menu = menuConfig[normalizedUserType] || [];

  const result = menu
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => {
          if (item.featureFlag) {
            return isFeatureEnabled(item.featureFlag);
          }
          return true;
        })
        .map((item) => {
          const href = item.href.replace('{basePath}', basePath).replace('{username}', username || '');

          // Resolver placeholders dinámicos de badges (números/contadores).
          // Los badges traducibles llegan como `badgeKey` y se resuelven en el render.
          let badge = item.badge;
          if (badge) {
            if (badge === '{badgeFriendRequests}' && badges?.friendRequests) {
              badge = badges.friendRequests;
            } else if (badge === '{badgeMessages}' && badges?.messages) {
              badge = badges.messages;
            } else if (badge === '{badgeGroupInvites}' && badges?.groupInvites) {
              badge = badges.groupInvites;
            } else if (typeof badge === 'string' && badge.startsWith('{')) {
              badge = undefined;
            }
          }
          if (!badge || badge === '0') {
            badge = undefined;
          }

          return {
            ...item,
            href,
            badge,
            badgeHideOnMobile: item.badgeHideOnMobile || false,
          };
        }),
    }))
    .filter((section) => section.items.length > 0);

  return result;
}
