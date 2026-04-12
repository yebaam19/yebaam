'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { ProfileFeature } from '../config/features.config';

interface FeatureCardProps {
    feature: ProfileFeature;
    canCreate: boolean;
}

/**
 * Card individual para cada tipo de perfil/espacio
 */
export function FeatureCard({ feature, canCreate }: FeatureCardProps) {
    const IconComponent = feature.icon;
    const isDisabled = feature.disabled || !canCreate;
    const showVerificationOverlay = !canCreate && !feature.disabled;

    return (
        <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            {/* Header con icono y título */}
            <div
                className={cn(
                    'p-5 text-white',
                    feature.bgColor,
                    feature.disabled && 'opacity-75'
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-white/20 p-2.5 shrink-0">
                        <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold leading-tight">{feature.title}</h3>
                </div>
            </div>

            {/* Contenido */}
            <div className="p-5 space-y-4 bg-neutral-50 dark:bg-neutral-800/50 flex-1 flex flex-col">
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed min-h-10">
                    {feature.description}
                </p>

                {/* Lista de beneficios */}
                <ul className="space-y-2.5 flex-1">
                    {feature.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2.5">
                            <CheckCircleIcon className={cn(
                                'h-4 w-4 mt-0.5 shrink-0',
                                feature.iconColor
                            )} />
                            <span className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {benefit}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer con botón */}
            <div className="p-5 pt-0 bg-neutral-50 dark:bg-neutral-800/50">
                {feature.disabled ? (
                    <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                    >
                        {feature.buttonLabel}
                    </button>
                ) : (
                    <Link href={feature.href} className="block">
                        <button
                            className={cn(
                                'w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer',
                                'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
                            )}
                        >
                            {feature.buttonLabel}
                        </button>
                    </Link>
                )}
            </div>

            {/* Overlay de verificación requerida */}
            {showVerificationOverlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm">
                    <div className="mx-4 p-5 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-neutral-800 shadow-lg text-center max-w-xs">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                            <LockClosedIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <h4 className="text-base font-semibold text-red-600 dark:text-red-400 mb-1">
                            Verificación requerida
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                            Verifica tu email para crear espacios
                        </p>
                        <Link href="/settings/account" className="block">
                            <button className="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer">
                                Verificar cuenta
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
