'use client';

import { cn } from '@/lib/utils';
import { BACKGROUND_COLORS } from '../constants/post.constants';

interface PostContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder: string;
  backgroundColor?: string;
  error?: string;
  disabled?: boolean;
}

export default function PostContentEditor({
  content,
  onChange,
  placeholder,
  backgroundColor,
  error,
  disabled = false,
}: PostContentEditorProps) {
  const textColor = backgroundColor 
    ? BACKGROUND_COLORS.find(c => c.value === backgroundColor)?.textColor || '#000'
    : undefined;

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={backgroundColor ? 4 : 6}
        disabled={disabled}
        style={
          backgroundColor 
            ? {
                background: backgroundColor.startsWith('linear-gradient') 
                  ? backgroundColor 
                  : backgroundColor,
                color: textColor,
              }
            : undefined
        }
        className={cn(
          'w-full resize-none border-0 outline-none focus:outline-none focus:ring-0',
          backgroundColor 
            ? "rounded-lg p-6 text-center text-xl font-semibold"
            : "bg-transparent text-lg text-neutral-900 placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500",
          error && 'text-red-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
