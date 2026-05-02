/**
 * ClubsHero Component
 *
 * Hero section for the Clubes page. Title + subtitle on the left, solid
 * white "Crear un club" CTA + community trust pill on the right, three
 * glassmorphic feature highlight cards below. Decorated with a scattered
 * clover-petal motif and a soft emerald glow.
 */

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
    return (
        <section
            className={cn(
                'relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 px-6 py-8 md:px-10 md:py-10',
                className,
            )}
        >
            <HeroDecor />

            <div className="relative z-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                            Clubes
                        </h1>
                        <p className="mt-3 text-base text-emerald-50/90 md:text-lg">
                            Descubre y únete a comunidades apasionadas sobre los temas que te interesan.
                        </p>
                        <p className="text-base text-emerald-50/90 md:text-lg">
                            Conecta con personas afines y comparte experiencias únicas.
                        </p>
                    </div>

                    {showCreateButton && onCreateClick && (
                        <div className="flex flex-col items-start gap-4 md:items-end">
                            <button
                                onClick={onCreateClick}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-white/10"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Crear un club
                            </button>
                            <CommunityTrustPill />
                        </div>
                    )}
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <FeatureCard
                        icon={<ShieldCheckIcon className="h-6 w-6" />}
                        title="Comunidades y Temáticas"
                        description="Únete a grupos organizados por intereses específicos y afiliaciones compartidas."
                    />
                    <FeatureCard
                        icon={<UsersIcon className="h-6 w-6" />}
                        title="Eventos y Actividades"
                        description="Participa en eventos exclusivos y actividades organizadas por los clubes."
                    />
                    <FeatureCard
                        icon={<SparklesIcon className="h-6 w-6" />}
                        title="Conexiones Auténticas"
                        description="Conoce personas que comparten tus mismas pasiones e intereses."
                    />
                </div>
            </div>
        </section>
    );
}

function HeroDecor() {
    return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {/* Soft radial glows */}
            <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-emerald-600/20 blur-3xl" />

            {/* Concentric rings, top right */}
            <svg
                className="absolute -right-12 -top-16 h-72 w-72 text-emerald-300/15"
                viewBox="0 0 200 200"
                fill="none"
                aria-hidden="true"
            >
                <circle cx="170" cy="30" r="100" stroke="currentColor" strokeWidth="1" />
                <circle cx="170" cy="30" r="75" stroke="currentColor" strokeWidth="1" />
                <circle cx="170" cy="30" r="50" stroke="currentColor" strokeWidth="1" />
            </svg>

            {/* Scattered clover petals */}
            <CloverField />
        </div>
    );
}

function CloverField() {
    const petals = [
        { top: '8%', left: '18%', size: 14, opacity: 0.18, rotate: 12 },
        { top: '14%', left: '40%', size: 10, opacity: 0.22, rotate: 35 },
        { top: '6%', left: '60%', size: 16, opacity: 0.15, rotate: -20 },
        { top: '22%', left: '72%', size: 12, opacity: 0.18, rotate: 60 },
        { top: '40%', left: '28%', size: 8, opacity: 0.14, rotate: 0 },
        { top: '64%', left: '8%', size: 12, opacity: 0.16, rotate: 25 },
        { top: '70%', left: '52%', size: 10, opacity: 0.18, rotate: -15 },
        { top: '82%', left: '78%', size: 14, opacity: 0.18, rotate: 45 },
        { top: '36%', left: '90%', size: 9, opacity: 0.16, rotate: 12 },
    ];

    return (
        <>
            {petals.map((p, i) => (
                <svg
                    key={i}
                    className="absolute text-emerald-200"
                    style={{
                        top: p.top,
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        opacity: p.opacity,
                        transform: `rotate(${p.rotate}deg)`,
                    }}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path d="M12 2c1.5 2.5 3 4 5 5-2 1-3.5 2.5-5 5-1.5-2.5-3-4-5-5 2-1 3.5-2.5 5-5z" />
                    <path d="M12 12c1.5 2.5 3 4 5 5-2 1-3.5 2.5-5 5-1.5-2.5-3-4-5-5 2-1 3.5-2.5 5-5z" />
                </svg>
            ))}
        </>
    );
}

function CommunityTrustPill() {
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
                            'relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-800 bg-gradient-to-br shadow-sm',
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
            <p className="text-xs font-medium leading-tight text-emerald-50/90">
                Únete a miles de comunidades
                <br />
                activas en Yebaam
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
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-900/30 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
            <div className="mb-3 inline-flex rounded-xl bg-emerald-500/30 p-2.5 text-white ring-1 ring-emerald-300/30">
                {icon}
            </div>
            <h3 className="mb-2 font-semibold text-white">{title}</h3>
            <p className="text-sm text-emerald-50/80">{description}</p>
        </div>
    );
}
