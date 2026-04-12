'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  onSubmit?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Input de búsqueda con icono, loading state, clear button
 * Soporta keyboard shortcuts (Ctrl+K, Esc)
 * 
 * @example
 * <SearchInput
 *   value={query}
 *   onChange={setQuery}
 *   onClear={() => setQuery('')}
 *   loading={isSearching}
 * />
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  onSubmit,
  onSearch,
  placeholder = 'Buscar en Yebaam...',
  loading = false,
  autoFocus = false,
  className = '',
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-focus al montar
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Ctrl+K o Cmd+K para focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Esc para limpiar
      if (e.key === 'Escape' && value) {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [value]);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit?.(value.trim());
      onSearch?.(value.trim());
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Search Icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <MagnifyingGlassIcon
          className={cn(
            'h-4 w-4 transition-colors',
            isFocused || value
              ? 'text-primary-600 dark:text-primary-500'
              : 'text-gray-400 dark:text-gray-500'
          )}
        />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-12 pr-12 py-2',
          'bg-gray-100 dark:bg-neutral-800',
          'border-2 border-transparent',
          'text-sm text-gray-900 dark:text-white',
          'placeholder:text-gray-500 dark:placeholder:text-gray-400',
          'transition-all duration-200',
          'focus:outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-neutral-900',
          'hover:bg-gray-200 dark:hover:bg-neutral-700',
          'rounded-full',
          loading && 'pr-20'
        )}
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2">
          <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />
        </div>
      )}

      {/* Clear Button */}
      {value && !loading && (
        <button
          onClick={handleClear}
          className={cn(
            'absolute right-4 top-1/2 -translate-y-1/2',
            'p-1 rounded-full',
            'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
            'hover:bg-gray-200 dark:hover:bg-neutral-700',
            'transition-colors'
          )}
          aria-label="Limpiar búsqueda"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}

      {/* Keyboard shortcut hint (when not focused and empty) */}
      {!isFocused && !value && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      )}
    </div>
  );
}
