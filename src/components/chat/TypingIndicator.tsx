import Avatar from '@/ui/Avatar';

interface TypingIndicatorProps {
  contactName: string;
  contactAvatar: string;
}

export default function TypingIndicator({ contactName, contactAvatar }: TypingIndicatorProps) {
  return (
    <div className="flex items-start gap-2 animate-fade-in">
      <Avatar
        src={contactAvatar}
        alt={contactName}
        className="h-8 w-8"
      />
      <div className="rounded-2xl bg-neutral-200 dark:bg-neutral-700 px-4 py-3 max-w-xs">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-neutral-500 dark:bg-neutral-400 animate-typing-dot animation-delay-0"></span>
          <span className="h-2 w-2 rounded-full bg-neutral-500 dark:bg-neutral-400 animate-typing-dot animation-delay-200"></span>
          <span className="h-2 w-2 rounded-full bg-neutral-500 dark:bg-neutral-400 animate-typing-dot animation-delay-400"></span>
        </div>
      </div>
    </div>
  );
}
