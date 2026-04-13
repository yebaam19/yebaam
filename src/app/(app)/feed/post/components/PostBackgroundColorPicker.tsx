'use client';

import { ChevronDownIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import { BACKGROUND_COLORS } from '../constants/post.constants';

interface PostBackgroundColorPickerProps {
  selectedColor?: string;
  onColorSelect: (color: string | undefined) => void;
  isOpen: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function PostBackgroundColorPicker({
  selectedColor,
  onColorSelect,
  isOpen,
  onToggle,
  disabled = false,
}: PostBackgroundColorPickerProps) {
  return (
    <div className="border-b border-neutral-200 p-3 dark:border-neutral-800">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="flex w-full items-center justify-between text-sm font-semibold text-neutral-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>Color de fondo</span>
        <ChevronDownIcon 
          className={cn(
            "h-4 w-4 transition-transform", 
            isOpen && "rotate-180"
          )} 
        />
      </button>
      
      {isOpen && (
        <div className="mt-3 grid grid-cols-8 gap-2">
          {BACKGROUND_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => onColorSelect(color.value === '#ffffff' ? undefined : color.value)}
              disabled={disabled}
              className={cn(
                "h-10 w-10 rounded-lg border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
                selectedColor === color.value || (!selectedColor && color.value === '#ffffff')
                  ? "border-primary-600 ring-2 ring-primary-200"
                  : "border-neutral-300 dark:border-neutral-700"
              )}
              style={{
                background: color.value.startsWith('linear-gradient') ? color.value : color.value,
              }}
              title={color.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
