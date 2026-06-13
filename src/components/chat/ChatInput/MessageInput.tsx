import type {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  RefObject,
} from 'react';

interface MessageInputProps {
  textInputRef: RefObject<HTMLInputElement | null>;
  value: string;
  disabled: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

/** Single-line message text input. */
export function MessageInput({
  textInputRef,
  value,
  disabled,
  onChange,
  onPaste,
  onKeyDown,
}: MessageInputProps) {
  return (
    <div className="flex-1 relative">
      <input
        ref={textInputRef}
        type="text"
        value={value}
        onChange={onChange}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
        placeholder="Aa"
        disabled={disabled}
        className="w-full rounded-full bg-neutral-100 dark:bg-neutral-800 px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
