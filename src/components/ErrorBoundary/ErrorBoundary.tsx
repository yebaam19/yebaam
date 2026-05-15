'use client';

import * as Sentry from '@sentry/nextjs';
import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@/components/icons/heroicons-shim';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

const CHUNK_RELOAD_KEY = 'yebaam_chunk_reload_attempts';
const MAX_CHUNK_RELOAD_ATTEMPTS = 2;

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    /Failed to load chunk|Loading chunk \d+ failed/i.test(error.message)
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });

    if (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'development' &&
      isChunkLoadError(error)
    ) {
      const attempts = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');
      if (attempts < MAX_CHUNK_RELOAD_ATTEMPTS) {
        window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(attempts + 1));
        window.location.reload();
        return;
      }
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 text-center">
              {/* Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                ¡Oops! Algo salió mal
              </h1>

              {/* Description */}
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Ha ocurrido un error inesperado. No te preocupes, estamos trabajando para solucionarlo.
              </p>

              {process.env.NODE_ENV === 'development' &&
                this.state.error &&
                isChunkLoadError(this.state.error) && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 text-left">
                    En desarrollo, un fallo al cargar un fragmento de JavaScript suele deberse a Turbopack
                    regenerando archivos. Prueba recargar, usar{' '}
                    <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
                      pnpm dev:webpack
                    </code>{' '}
                    o borrar la carpeta{' '}
                    <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs dark:bg-neutral-800">
                      .next
                    </code>{' '}
                    y reiniciar el servidor.
                  </p>
                )}

              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg text-left">
                  <p className="text-xs font-mono text-red-800 dark:text-red-300 break-all">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-700 dark:text-red-400 cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-40 text-red-600 dark:text-red-400">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Intentar de nuevo
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  Recargar página
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
