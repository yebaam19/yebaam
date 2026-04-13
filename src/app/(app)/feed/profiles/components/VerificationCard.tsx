'use client';

import { NewspaperIcon, CheckCircleIcon } from '@/components/icons/heroicons-shim';

const verificationBenefits = [
    'Crea y gestiona tus propios espacios',
    'Acceso a herramientas de creación avanzadas',
    'Mayor visibilidad en la plataforma',
    'Construye una reputación sólida',
];

const verificationSteps = [
    'Verifica tu correo electrónico',
    'Confirma tus datos básicos',
    'Verificación instantánea',
    'Soporte prioritario',
];

/**
 * Card informativa sobre los beneficios de verificar el perfil
 */
export function VerificationCard() {
    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-primary-50 dark:bg-primary-900/20 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary-700 dark:text-primary-400">
                    <NewspaperIcon className="h-5 w-5" />
                    ¿Por qué verificar mi perfil?
                </h3>
            </div>

            {/* Content */}
            <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50">
                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Beneficios */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-primary-700 dark:text-primary-400">
                            Beneficios de la verificación
                        </h4>
                        <ul className="space-y-2">
                            {verificationBenefits.map((benefit) => (
                                <li key={benefit} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                    <CheckCircleIcon className="h-4 w-4 mt-0.5 text-primary-500 shrink-0" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pasos */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-primary-700 dark:text-primary-400">
                            Proceso simple y rápido
                        </h4>
                        <ul className="space-y-2">
                            {verificationSteps.map((step, index) => (
                                <li key={step} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-xs font-medium text-primary-700 dark:text-primary-400 shrink-0">
                                        {index + 1}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
