'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Theme, type EmojiClickData } from 'emoji-picker-react';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ChatEmojiPopoverProps {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export default function ChatEmojiPopover({ open, onClose, onSelect }: ChatEmojiPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-12 left-0 z-50 shadow-xl rounded-lg overflow-hidden"
    >
      <EmojiPicker
        theme={Theme.AUTO}
        onEmojiClick={(data: EmojiClickData) => onSelect(data.emoji)}
        lazyLoadEmojis
        width={320}
        height={400}
      />
    </div>
  );
}
