'use client';

/**
 * ClubsHero Component
 *
 * Hero section for the Clubes page. Title + subtitle on the left,
 * pill-shaped white "Crear un club" CTA (dark label) + community trust pill on the
 * right, three frosted feature cards below. Background uses /topblog.png with
 * a dark emerald veil so the art reads like the product mock.
 */

import { useTranslations } from 'next-intl';
import {
    ShieldCheckIcon,
    UsersIcon,
    SparklesIcon,
    PlusIcon,
} from '@/components/icons/heroicons-shim';

import { cn } from '@/lib/utils';

interface ClubsHeroProps {
    className?: string;
    onCreateClick?: () => void;
    showCreateButton?: boolean;
}

export function ClubsHero({ className, onCreateClick, showCreateButton = true }: ClubsHeroProps) {
    const t = useTranslations('clubes');
    return (
        <section
            className={cn(
                'relative overflow-hidden rounded-2xl px-6 py-8 md:px-10 md:py-10',
                className,
            )}
        >
            {/* Background artwork */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-right-top bg-no-repeat"
                style={{ backgroundImage: "url('/topblog.png')" }}
                aria-hidden
            />
            {/* Veil — keeps overall green uniform; right side just slightly lighter so the filigree reads */}
            <div
                className="pointer-events-none absolute inset-0 z-[1] bg-linear-to-r from-emerald-950/90 via-emerald-900/80 to-emerald-800/60"
                aria-hidden
            />
            <HeroDecor />

            <div className="relative z-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                            {t('hero.title')}
                        </h1>
                        <p className="mt-3 text-base leading-relaxed text-white/95 md:text-lg">
                            {t('hero.subtitle1')}
                        </p>
                        <p className="text-base leading-relaxed text-white/95 md:text-lg">
                            {t('hero.subtitle2')}
                        </p>
                    </div>

                    {showCreateButton && onCreateClick && (
                        <div className="flex flex-col items-start gap-4 lg:items-end">
                            <button
                                onClick={onCreateClick}
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-md transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                <PlusIcon className="h-5 w-5 shrink-0 text-neutral-900" />
                                {t('hero.createCta')}
                            </button>
                            <CommunityTrustPill text={t('hero.trustPill')} />
                        </div>
                    )}
                </div>

                <div className="mt-6 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                    <FeatureCard
                        icon={<ShieldCheckIcon className="h-4 w-4" aria-hidden />}
                        title={t('hero.features.themes.title')}
                        description={t('hero.features.themes.description')}
                    />
                    <FeatureCard
                        icon={<UsersIcon className="h-4 w-4" aria-hidden />}
                        title={t('hero.features.events.title')}
                        description={t('hero.features.events.description')}
                    />
                    <FeatureCard
                        icon={<SparklesIcon className="h-4 w-4" aria-hidden />}
                        title={t('hero.features.connections.title')}
                        description={t('hero.features.connections.description')}
                    />
                </div>
            </div>
        </section>
    );
}

function HeroDecor() {
    return (
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden">
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
        </div>
    );
}

function CommunityTrustPill({ text }: { text: string }) {
    const seedAvatars = [
        { tone: 'from-amber-200 via-rose-300 to-rose-400' },
        { tone: 'from-orange-200 via-amber-300 to-amber-500' },
        { tone: 'from-rose-200 via-pink-300 to-fuchsia-400' },
    ];

    return (
        <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
                {seedAvatars.map((avatar, i) => (
                    <span
                        key={i}
                        className={cn(
                            'relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-gradient-to-br shadow-md',
                            avatar.tone,
                        )}
                        aria-hidden="true"
                    >
                        {/* Faux face silhouette */}
                        <span className="absolute top-1.5 h-3 w-3 rounded-full bg-white/30" />
                        <span className="absolute -bottom-2 h-5 w-7 rounded-t-full bg-white/25" />
                    </span>
                ))}
            </div>
            <p className="max-w-48 text-xs font-medium leading-tight text-white/90">
                {text}
            </p>
        </div>
    );
}

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="relative flex h-full min-h-0 flex-col rounded-xl border border-emerald-300/15 bg-emerald-900/35 p-4">
            <div className="mb-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
                {icon}
            </div>
            <h3 className="mb-1 text-sm font-semibold leading-snug tracking-tight text-white">
                {title}
            </h3>
            <p className="text-xs leading-snug text-white/80">{description}</p>
        </div>
    );
}
