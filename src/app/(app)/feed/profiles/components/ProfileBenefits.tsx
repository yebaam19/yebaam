'use client';

import { GlobeAltIcon, UsersIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { BackgroundPattern } from '@/components/BackgroundPattern';

const benefits = [
    {
        icon: GlobeAltIcon,
        text: 'Construye tu presencia digital',
    },
    {
        icon: UsersIcon,
        text: 'Conecta con tu comunidad',
    },
    {
        icon: BookOpenIcon,
        text: 'Comparte tu conocimiento',
    },
];

/**
 * Hero section con beneficios de los espacios digitales
 */
export function ProfileBenefits() {
    return (
        <div className="relative overflow-hidden bg-linear-to-br from-primary-600 to-primary-700 rounded-xl p-8 md:p-12 text-white">
            {/* Background Pattern */}
            <BackgroundPattern opacity={0.1} color="white" />

            <div className="relative z-10 text-center space-y-4 mb-8">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                    Tus Espacios Digitales
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                    Crea, comparte y conecta a través de diferentes espacios diseñados para ti
                </p>
            </div>

            <div className="relative z-10 grid gap-4 sm:grid-cols-3 bg-white/15 backdrop-blur-sm rounded-lg p-4">
                {benefits.map((benefit) => (
                    <div key={benefit.text} className="flex items-center gap-3 text-white">
                        <div className="rounded-full bg-white/20 p-2.5 shrink-0">
                            <benefit.icon className="h-5 w-5" />
                        </div>
                        <p className="text-sm md:text-base font-medium">{benefit.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
