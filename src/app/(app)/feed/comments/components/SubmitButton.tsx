import { ButtonHTMLAttributes } from 'react';
import { PaperAirplaneIcon } from '@/components/icons/heroicons-shim';

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  hasContent?: boolean;
}

/**
 * Botón para enviar comentario
 * Disabled cuando no hay contenido o está cargando
 */
export function SubmitButton({ 
  isLoading = false, 
  hasContent = false,
  disabled,
  className = '',
  ...props 
}: SubmitButtonProps) {
  const isDisabled = disabled || !hasContent || isLoading;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`
        p-2 rounded-full
        transition-all duration-200
        ${
          isDisabled
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'
        }
        ${isLoading ? 'animate-pulse' : ''}
        ${className}
      `}
      {...props}
    >
      <PaperAirplaneIcon className="w-5 h-5" />
    </button>
  );
}
