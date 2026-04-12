/**
 * ClubsHero Component
 *
 * Hero section para la página de clubes.
 * Sección de bienvenida con información sobre clubes y botón de creación.
 */

import { ShieldCheckIcon, UsersIcon, SparklesIcon, PlusIcon } from '@heroicons/react/24/outline';

import { BackgroundPattern } from '@/components/BackgroundPattern';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ClubsHeroProps {
    className?: string;
    onCreateClick?: () => void;
    showCreateButton?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClubsHero({ className, onCreateClick, showCreateButton }: ClubsHeroProps) {
    return (
        <section
            className={cn(
                'relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 px-6 py-8 md:px-12 md:py-10',
                className
            )}
        >
            {/* Background Pattern */}
            <BackgroundPattern opacity={0.1} color="white" />

            {/* Content */}
            <div className="relative z-10">
                <div className="mx-auto max-w-3xl text-center">
                    <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">Clubes</h1>
                    <p className="mt-3 text-base text-emerald-100 md:text-lg">
                        Descubre y únete a comunidades apasionadas sobre los temas que te interesan.
                        Conecta con personas afines y comparte experiencias únicas.
                    </p>

                    {/* Create Button */}
                    {showCreateButton && onCreateClick && (
                        <button
                            onClick={onCreateClick}
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-emerald-700 shadow-lg transition-all hover:bg-emerald-50 hover:shadow-xl"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Crear mi club
                        </button>
                    )}
                </div>

                {/* Feature Cards */}
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <FeatureCard
                        icon={<ShieldCheckIcon className="h-6 w-6" />}
                        title="Comunidades Temáticas"
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

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm">
            <div className="mb-3 inline-flex rounded-lg bg-white/20 p-2 text-white">{icon}</div>
            <h3 className="mb-2 font-semibold text-white">{title}</h3>
            <p className="text-sm text-emerald-100">{description}</p>
        </div>
    );
}
