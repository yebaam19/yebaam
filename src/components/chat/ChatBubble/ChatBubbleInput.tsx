'use client';

import {
  FaceSmileIcon,
  PaperAirplaneIcon,
  CameraIcon,
  PhotoIcon,
  PlusIcon,
  HandThumbUpIcon,
} from '@/components/icons/heroicons-shim';
  FormEvent,
  KeyboardEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

interface ChatBubbleInputProps {
  onSendMessage: (message: string) => Promise<boolean>;
  onTypingChange: (value: string, prevValue: string) => void;
  onStopTyping: () => void;
}

/** Auto-resize helper for multiline textarea. */
function useAutoResizeTextArea(value: string, maxPx: number, minRows = 1) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = 'auto';
    const lh = Number.parseFloat(getComputedStyle(ta).lineHeight) || 18;
    const minH = minRows * lh + 14;
    ta.style.height = `${Math.min(Math.max(ta.scrollHeight, minH), maxPx)}px`;
  }, [value, maxPx, minRows]);

  return ref;
}

export function ChatBubbleInput({
  onSendMessage,
  onTypingChange,
  onStopTyping,
}: ChatBubbleInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useAutoResizeTextArea(message, 120, 1);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const prevValue = message;
    setMessage(newValue);
    onTypingChange(newValue, prevValue);
  };

  const sendText = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    onStopTyping();
    setMessage('');
    const ok = await onSendMessage(trimmed);
    if (!ok) setMessage(trimmed);
    setIsSending(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await sendText(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendText(message);
    }
  };

  const stubSoon = useCallback(() => toast.info('Pronto'), []);

  const trimmedEmpty = message.trim() === '';

  const handleThumb = async () => {
    if (isSending || !trimmedEmpty) return;
    setIsSending(true);
    onStopTyping();
    await onSendMessage('👍');
    setIsSending(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-neutral-200 bg-[#f0f2f5] px-2 py-2 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-end gap-1.5">
        <div className="flex shrink-0 items-center gap-0.5 pb-1">
          <button
            type="button"
            onClick={stubSoon}
            className="rounded-full p-1.5 text-[#0084ff] transition-colors hover:bg-black/5 dark:text-blue-400 dark:hover:bg-white/10"
            title="Más"
          >
            <PlusIcon className="h-7 w-7" aria-hidden />
          </button>
          <button
            type="button"
            onClick={stubSoon}
            className="rounded-full p-1.5 text-[#0084ff] transition-colors hover:bg-black/5 dark:text-blue-400 dark:hover:bg-white/10"
            title="Foto desde cámara"
          >
            <CameraIcon className="h-6 w-6" aria-hidden />
          </button>
          <button
            type="button"
            onClick={stubSoon}
            className="rounded-full p-1.5 text-[#0084ff] transition-colors hover:bg-black/5 dark:text-blue-400 dark:hover:bg-white/10"
            title="Adjuntar"
          >
            <PhotoIcon className="h-6 w-6" aria-hidden />
          </button>
        </div>

        <div className="min-w-0 flex-1 pb-px">
          <textarea
            ref={textareaRef}
            value={message}
            rows={1}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Aa"
            disabled={isSending}
            aria-label="Escribe un mensaje"
            className="max-h-[120px] w-full resize-none rounded-[20px] border-0 bg-white px-3 py-2 text-sm leading-[1.36] wrap-break-word text-neutral-900 shadow-sm outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-blue-500/35 disabled:opacity-60 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500"
          />
        </div>

        <div className="flex shrink-0 items-center gap-0 pb-2">
          <button
            type="button"
            onClick={stubSoon}
            className="rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            title="Emoji"
          >
            <FaceSmileIcon className="h-6 w-6 text-[#0084ff] dark:text-blue-400" />
          </button>

          {trimmedEmpty ? (
            <button
              type="button"
              onClick={() => void handleThumb()}
              disabled={isSending}
              className="rounded-full p-2 transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
              title="Enviar Me gusta"
            >
              <HandThumbUpIcon className="h-7 w-7 text-[#0084ff] dark:text-blue-400" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSending}
              className="rounded-full bg-[#0084ff] p-2 text-white shadow-sm transition-colors hover:bg-[#1877f2] disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
              title="Enviar"
            >
              <PaperAirplaneIcon className="h-5 w-5 rtl:rotate-180" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
