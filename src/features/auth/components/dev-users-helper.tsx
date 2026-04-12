/**
 * DevUsersHelper
 * 
 * Componente de ayuda para desarrollo/QA.
 * Muestra usuarios de prueba disponibles para login rápido.
 * 
 * Solo se muestra en entornos de desarrollo y QA.
 */

'use client';

import { useState } from 'react';

interface TestUser {
  email: string;
  password: string;
  label: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'user@example.com',
    password: 'SecurePass123',
    label: 'Usuario de prueba',
  },
  {
    email: 'user1@example.com',
    password: 'SecurePass123',
    label: 'Usuario de prueba 1',
  },
  {
    email: 'user2@example.com',
    password: 'SecurePass123',
    label: 'Usuario de prueba 2',
  },
];

interface DevUsersHelperProps {
  onSelectUser?: (email: string, password: string) => void;
}

export function DevUsersHelper({ onSelectUser }: DevUsersHelperProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Solo mostrar en desarrollo o QA, NUNCA en producción
  const isDev = process.env.NODE_ENV === 'development';
  const isQA = process.env.NEXT_PUBLIC_ENV === 'qa';
  const isProduction = process.env.NODE_ENV === 'production';

  // Ocultar completamente en producción, incluso si es localhost
  if (isProduction || (!isDev && !isQA)) {
    return null;
  }

  const handleSelectUser = (user: TestUser) => {
    onSelectUser?.(user.email, user.password);
    setIsOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-amber-600 transition-colors"
        title="Usuarios de prueba (Solo en dev/qa)"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span className="hidden sm:inline">Usuarios de prueba</span>
      </button>

      {/* Panel de usuarios */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 rounded-lg bg-white dark:bg-neutral-800 shadow-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {/* Header */}
          <div className="bg-amber-500 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Usuarios de Prueba</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-amber-600 rounded p-1 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs mt-1 text-amber-100">
              {isDev ? ' Desarrollo' : 'QA'}
            </p>
          </div>

          {/* Lista de usuarios */}
          <div className="max-h-96 overflow-y-auto">
            {TEST_USERS.map((user, index) => (
              <div
                key={index}
                className="border-b border-neutral-200 dark:border-neutral-700 last:border-b-0 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {user.label}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Botón de login rápido */}
                  {onSelectUser && (
                    <button
                      onClick={() => handleSelectUser(user)}
                      className="flex-1 rounded bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
                    >
                      Usar este usuario
                    </button>
                  )}

                  {/* Botón copiar email */}
                  <button
                    onClick={() => copyToClipboard(user.email)}
                    className="rounded bg-neutral-200 dark:bg-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
                    title="Copiar email"
                  >

                  </button>

                  {/* Botón copiar contraseña */}
                  <button
                    onClick={() => copyToClipboard(user.password)}
                    className="rounded bg-neutral-200 dark:bg-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors"
                    title="Copiar contraseña"
                  >

                  </button>
                </div>

                {/* Info de credenciales */}
                <details className="mt-2">
                  <summary className="text-xs text-neutral-500 dark:text-neutral-400 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300">
                    Ver credenciales
                  </summary>
                  <div className="mt-2 rounded bg-neutral-100 dark:bg-neutral-900 p-2 text-xs font-mono">
                    <div className="mb-1">
                      <span className="text-neutral-500 dark:text-neutral-400">Email:</span>{' '}
                      <span className="text-neutral-900 dark:text-neutral-100">{user.email}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">Pass:</span>{' '}
                      <span className="text-neutral-900 dark:text-neutral-100">{user.password}</span>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="bg-neutral-50 dark:bg-neutral-900 px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400">
            Haz clic en &quot;Usar este usuario&quot; para login rápido
          </div>
        </div>
      )}
    </div>
  );
}
