import {
    ShieldCheckIcon,
    DocumentTextIcon,
    BriefcaseIcon,
    UserGroupIcon,
    BuildingOffice2Icon,
    CakeIcon,
    HomeIcon,
    MusicalNoteIcon,
} from '@/components/icons/heroicons-shim';
import type { ComponentType, SVGProps } from 'react';

/**
 * Visual / structural metadata for each profile/space card.
 * Text (title, description, benefits, buttonLabel) is resolved via next-intl
 * keyed by `id` under the `profiles.features.<id>` namespace.
 */
export interface ProfileFeature {
    id: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    href: string;
    /**
     * When the destination lives outside this app (a separate Vercel project /
     * subdomain like `food.yebaam.com`), set `external: true` so the card
     * renders as a plain `<a>` with the absolute `href`. Otherwise the card
     * uses `next/link` for client-side navigation within this app.
     */
    external?: boolean;
    bgColor: string;
    iconColor: string;
    disabled: boolean;
}

export const PROFILE_FEATURES: ProfileFeature[] = [
    {
        id: 'clubs',
        icon: ShieldCheckIcon,
        href: '/feed/clubs',
        bgColor: 'bg-primary-600',
        iconColor: 'text-primary-600',
        disabled: false,
    },
    {
        id: 'blogs',
        icon: DocumentTextIcon,
        href: '/feed/blogs',
        bgColor: 'bg-secondary-500',
        iconColor: 'text-secondary-600',
        disabled: false,
    },
    {
        id: 'professional-profile',
        icon: BriefcaseIcon,
        href: '/feed/professional-profile',
        bgColor: 'bg-primary-700',
        iconColor: 'text-primary-700',
        disabled: false,
    },
    {
        id: 'music-archive',
        icon: MusicalNoteIcon,
        href: '/musica',
        bgColor: 'bg-amber-600',
        iconColor: 'text-amber-600',
        disabled: false,
    },
    {
        id: 'families',
        icon: HomeIcon,
        href: '/feed/familias',
        bgColor: 'bg-emerald-600',
        iconColor: 'text-emerald-600',
        disabled: false,
    },
    {
        id: 'communities',
        icon: UserGroupIcon,
        href: '/feed/comunidades',
        bgColor: 'bg-secondary-700',
        iconColor: 'text-secondary-700',
        disabled: false,
    },
    {
        id: 'companies',
        icon: BuildingOffice2Icon,
        href: '/feed/grupos',
        bgColor: 'bg-primary-800',
        iconColor: 'text-primary-800',
        disabled: false,
    },
    {
        id: 'food',
        icon: CakeIcon,
        href: 'http://food.yebaam.com/?fbclid=IwY2xjawRk9YVleHRuA2FlbQIxMABicmlkETFGOThUMHJEcEpLUjNlSlRRc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHqaDv09UQU7l43k9NGfHzgQtyEl-9GMczTX4bbl8SQ54bvLzpXvnegcacxqB_aem_gLe6_akUqnvd2jSKiom8dg',
        external: true,
        bgColor: 'bg-amber-500',
        iconColor: 'text-amber-600',
        disabled: false,
    },
];
