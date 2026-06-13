import {
  FaceSmileIcon,
  HandThumbUpIcon,
  PaperAirplaneIcon,
} from '@/components/icons/heroicons-shim';
import ChatEmojiPopover from '../../ChatEmojiPopover';
import VoiceRecorderButton from '../../VoiceRecorderButton';
import type { MessageMedia } from '@/features/chat/types';

interface InputActionsProps {
  emojiOpen: boolean;
  isSending: boolean;
  isUploading: boolean;
  showSendAlternatives: boolean;
  onToggleEmoji: () => void;
  onCloseEmoji: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSendVoice: (media: MessageMedia) => Promise<void>;
  onSendLike: () => void;
  labels: { emoji: string; sendLike: string; send: string };
}

/** Right-side cluster: emoji popover, plus the voice/like vs. send swap. */
export function InputActions({
  emojiOpen,
  isSending,
  isUploading,
  showSendAlternatives,
  onToggleEmoji,
  onCloseEmoji,
  onSelectEmoji,
  onSendVoice,
  onSendLike,
  labels,
}: InputActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-0 pb-2">
      <div className="relative">
        <button
          type="button"
          onClick={onToggleEmoji}
          className="rounded-full p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          title={labels.emoji}
        >
          <FaceSmileIcon className="h-6 w-6 text-[#0084ff] dark:text-blue-400" />
        </button>
        <ChatEmojiPopover
          open={emojiOpen}
          onClose={onCloseEmoji}
          onSelect={onSelectEmoji}
          align="right"
        />
      </div>

      {showSendAlternatives ? (
        <>
          <VoiceRecorderButton
            onSend={onSendVoice}
            disabled={isSending || isUploading}
          />
          <button
            type="button"
            onClick={onSendLike}
            disabled={isSending}
            className="rounded-full p-2 transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
            title={labels.sendLike}
          >
            <HandThumbUpIcon className="h-7 w-7 text-[#0084ff] dark:text-blue-400" aria-hidden />
          </button>
        </>
      ) : (
        <button
          type="submit"
          disabled={isSending || isUploading}
          className="rounded-full bg-[#0084ff] p-2 text-white shadow-sm transition-colors hover:bg-[#1877f2] disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
          title={labels.send}
        >
          <PaperAirplaneIcon className="h-5 w-5 rtl:rotate-180" aria-hidden />
        </button>
      )}
    </div>
  );
}
