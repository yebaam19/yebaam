'use client';

import { GlobeAltIcon, UsersIcon, BookOpenIcon, ArrowRightIcon } from '@/components/icons/heroicons-shim';
import { BackgroundPattern } from '@/components/BackgroundPattern';

const benefits = [
    { icon: GlobeAltIcon, text: 'Presencia digital' },
    { icon: UsersIcon, text: 'Comunidad' },
    { icon: BookOpenIcon, text: 'Conocimiento' },
];

export function ProfileBenefits() {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 via-primary-600 to-primary-800 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
            <BackgroundPattern opacity={0.08} color="white" />
            <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary-400/25 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl space-y-2.5">
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Tus Espacios Digitales
                    </h1>
                    <p className="text-sm text-white/85 sm:text-base">
                        Crea, comparte y conecta a través de diferentes espacios diseñados para ti.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {benefits.map((b) => (
                            <span
                                key={b.text}
                                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                            >
                                <b.icon className="h-3.5 w-3.5" />
                                {b.text}
                            </span>
                        ))}
                    </div>
                </div>

                <a
                    href="#explora-espacios"
                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 sm:self-auto"
                >
                    Explorar espacios
                    <ArrowRightIcon className="h-4 w-4" />
                </a>
            </div>
        </div>
    );
}
