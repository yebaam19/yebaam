import { useEffect } from 'react';
import { ChatBubbleInput } from './ChatBubble/ChatBubbleInput';
import type { MessageMedia } from '@/features/chat/types';

interface ChatInputProps {
  onSendMessage: (content?: string, media?: MessageMedia) => Promise<boolean>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  typingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export default function ChatInput({ onSendMessage, onTypingStart, onTypingStop, typingTimeoutRef }: ChatInputProps) {
  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, [typingTimeoutRef]);
  return <ChatBubbleInput onSendMessage={onSendMessage} onStopTyping={onTypingStop}
    onTypingChange={(value, previous) => {
      if (value && !previous) onTypingStart();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (value) typingTimeoutRef.current = setTimeout(onTypingStop, 2000);
      else onTypingStop();
    }} />;
}
