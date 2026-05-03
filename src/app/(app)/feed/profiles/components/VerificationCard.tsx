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

export function VerificationCard() {
    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-200 bg-linear-to-r from-primary-50 to-primary-100/60 px-6 py-4 dark:border-neutral-800 dark:from-primary-900/30 dark:to-primary-900/10">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-primary-700 dark:text-primary-400">
                    <NewspaperIcon className="h-5 w-5" />
                    ¿Por qué verificar mi perfil?
                </h3>
            </div>

            <div className="bg-white p-6 dark:bg-neutral-900">
                <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                        <h4 className="font-semibold text-primary-700 dark:text-primary-400">
                            Beneficios de la verificación
                        </h4>
                        <ul className="space-y-2">
                            {verificationBenefits.map((benefit) => (
                                <li key={benefit} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-semibold text-primary-700 dark:text-primary-400">
                            Proceso simple y rápido
                        </h4>
                        <ul className="space-y-2">
                            {verificationSteps.map((step, index) => (
                                <li key={step} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/50 dark:text-primary-400">
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
