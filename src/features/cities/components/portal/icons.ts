/**
 * Icon registry shared by every portal tile and the mobile CityMenu.
 *
 * `portal-sections.ts` declares each tile by string name; this map is the
 * runtime lookup. Keep the keys in lockstep with the `icon` strings in
 * `portal-sections.ts` so referencing an unknown name falls through to the
 * sensible default (a chat bubble) rather than crashing.
 *
 * The file is intentionally framework-agnostic — no `'use client'`, no
 * `'server-only'` — so both server components (CityPortalGrid via
 * DiscoveryTile's icon fallback) and the client island CityMenu can
 * import it.
 */
import {
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  GlobeAmericasIcon,
  HeartIcon,
  HomeIcon,
  MapPinIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PhotoIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
  TrophyIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from '@/components/icons/heroicons-shim';

type IconComponent = React.ComponentType<{ className?: string }>;

export const PORTAL_ICONS: Record<string, IconComponent> = {
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  GlobeAmericasIcon,
  HeartIcon,
  HomeIcon,
  MapPinIcon,
  MegaphoneIcon,
  NewspaperIcon,
  PhotoIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
  TrophyIcon,
  UserGroupIcon,
  VideoCameraIcon,
};

export function getPortalIcon(name: string): IconComponent {
  return PORTAL_ICONS[name] ?? ChatBubbleLeftRightIcon;
}
