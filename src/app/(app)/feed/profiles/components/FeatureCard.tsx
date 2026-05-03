'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    LockClosedIcon,
    ArrowRightIcon,
} from '@/components/icons/heroicons-shim';
import { BackgroundPattern } from '@/components/BackgroundPattern';
import type { ProfileFeature } from '../config/features.config';
import type { Route } from 'next';

interface FeatureCardProps {
    feature: ProfileFeature;
    canCreate: boolean;
}

export function FeatureCard({ feature, canCreate }: FeatureCardProps) {
    const IconComponent = feature.icon;
    const isDisabled = feature.disabled;
    const showVerificationOverlay = !canCreate && !feature.disabled;

    return (
        <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            {/* Cover band */}
            <div className="relative h-28 overflow-hidden">
                <div className={cn('absolute inset-0', feature.bgColor)} />
                <BackgroundPattern opacity={0.12} color="white" />
                <div className="absolute inset-0 bg-linear-to-br from-black/0 via-black/0 to-black/25" />

                {/* Floating icon badge */}
                <div className="absolute -bottom-6 left-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-md dark:border-neutral-700 dark:bg-neutral-900">
                    <IconComponent className={cn('h-7 w-7', feature.iconColor)} />
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-10">
                <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                        {feature.title}
                    </h3>
                    <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {feature.description}
                    </p>
                </div>

                <div className="mt-auto space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                        {feature.benefits.map((benefit) => (
                            <span
                                key={benefit}
                                className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                            >
                                {benefit}
                            </span>
                        ))}
                    </div>

                    {isDisabled ? (
                        <button
                            disabled
                            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                        >
                            {feature.buttonLabel}
                        </button>
                    ) : (
                        <Link
                            href={feature.href as Route}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                        >
                            {feature.buttonLabel}
                            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Verification required overlay */}
            {showVerificationOverlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm dark:bg-neutral-900/95">
                    <div className="mx-4 max-w-xs rounded-2xl border border-red-200 bg-white p-5 text-center shadow-lg dark:border-red-800 dark:bg-neutral-800">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                            <LockClosedIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h4 className="mb-1 text-base font-semibold text-red-600 dark:text-red-400">
                            Verificación requerida
                        </h4>
                        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
                            Verifica tu email para crear espacios
                        </p>
                        <Link
                            href={'/settings/account' as Route}
                            className="inline-flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                        >
                            Verificar cuenta
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
