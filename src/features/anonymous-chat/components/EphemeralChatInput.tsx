'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FaceSmileIcon, PaperAirplaneIcon, PhotoIcon } from '@/components/icons/heroicons-shim';
import ChatEmojiPopover from '@/components/chat/ChatEmojiPopover';
import type { AnonMediaPayload } from '../types';
import { uploadEphemeralImage } from '../lib/uploadEphemeralImage';
import EphemeralCamera from './EphemeralCamera';

interface EphemeralChatInputProps {
  onSend: (content: string) => void;
  onTyping: (typing: boolean) => void;
  /** Sends an ephemeral image (uploaded privately to Cloudflare). */
  onSendMedia?: (media: AnonMediaPayload) => void;
  /** Extra controls (e.g. the camera button) injected by the surface. */
  leading?: React.ReactNode;
}

/**
 * Text composer for an anonymous (ephemeral) conversation. No file attach here —
 * media + camera arrive in later phases via the `leading` slot. Sending just
 * hands the text to the Broadcast hook; nothing is persisted.
 */
export default function EphemeralChatInput({ onSend, onTyping, onSendMedia, leading }: EphemeralChatInputProps) {
  const t = useTranslations('chat.anonymous.window');
  const [message, setMessage] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingOff = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || !onSendMedia) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('invalidImage'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('imageTooLarge'));
      return;
    }
    setIsUploading(true);
    try {
      onSendMedia(await uploadEphemeralImage(file));
    } catch {
      toast.error(t('uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const signalTyping = (value: string) => {
    if (value.length > 0) {
      onTyping(true);
      if (typingOff.current) clearTimeout(typingOff.current);
      typingOff.current = setTimeout(() => onTyping(false), 2000);
    } else {
      if (typingOff.current) clearTimeout(typingOff.current);
      onTyping(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    signalTyping(e.target.value);
  };

  const send = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessage('');
    if (typingOff.current) clearTimeout(typingOff.current);
    onTyping(false);
  };

  const handleEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setMessage((m) => m + emoji);
      setEmojiOpen(false);
      return;
    }
    const start = el.selectionStart ?? message.length;
    const end = el.selectionEnd ?? message.length;
    const next = message.slice(0, start) + emoji + message.slice(end);
    setMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
    setEmojiOpen(false);
  };

  return (
    <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
      <div className="flex items-end gap-2">
        {leading}
        {onSendMedia && (
          <>
            <EphemeralCamera onSendMedia={onSendMedia} disabled={isUploading} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title={t('attachImage')}
              className="rounded-full p-2 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
            >
              <PhotoIcon className="h-5 w-5 text-primary-600" />
            </button>
          </>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            title="Emoji"
            className="rounded-full p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <FaceSmileIcon className="h-5 w-5 text-primary-600" />
          </button>
          <ChatEmojiPopover open={emojiOpen} onClose={() => setEmojiOpen(false)} onSelect={handleEmoji} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t('placeholder')}
          className="min-w-0 flex-1 rounded-full bg-neutral-100 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-neutral-800"
        />

        <button
          type="button"
          onClick={send}
          disabled={!message.trim()}
          className="rounded-full p-2 transition-colors hover:bg-primary-50 disabled:opacity-50 dark:hover:bg-primary-900/30"
          title={t('placeholder')}
        >
          <PaperAirplaneIcon className="h-5 w-5 text-primary-600" />
        </button>
      </div>
    </div>
  );
}
