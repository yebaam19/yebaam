import type {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
  RefObject,
} from 'react';

interface MessageTextAreaProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  disabled: boolean;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
  labels: { placeholder: string; ariaLabel: string };
}

/** Auto-resizing message textarea. Resize logic lives in the parent via its ref. */
export function MessageTextArea({
  textareaRef,
  value,
  disabled,
  onChange,
  onKeyDown,
  onPaste,
  labels,
}: MessageTextAreaProps) {
  return (
    <div className="min-w-0 flex-1 pb-px">
      <textarea
        ref={textareaRef}
        value={value}
        rows={1}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        placeholder={labels.placeholder}
        disabled={disabled}
        aria-label={labels.ariaLabel}
        className="max-h-[120px] w-full resize-none rounded-[20px] border-0 bg-white px-3 py-2 text-sm leading-[1.36] wrap-break-word text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-blue-500/35 disabled:opacity-60 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
      />
    </div>
  );
}
