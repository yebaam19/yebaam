import Avatar from '@/ui/Avatar';

export function TypingIndicator({
  contactAvatar,
  contactName,
  initials,
}: {
  contactAvatar: string;
  contactName: string;
  initials: string;
}) {
  return (
    <div className="mt-2 flex justify-start gap-2">
      <div className="flex w-7 shrink-0 flex-col justify-end pb-5">
        {contactAvatar ? (
          <Avatar
            src={contactAvatar}
            initials={initials}
            alt={contactName}
            className="size-7"
          />
        ) : (
          <Avatar initials={initials} alt={contactName} className="size-7" />
        )}
      </div>
      <div className="rounded-2xl rounded-bl-md bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
        <div className="flex items-center gap-1">
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 dark:bg-neutral-500"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
