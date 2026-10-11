import type { PageMessage } from '../../interfaces/page-message.interface';
import { formatDistanceToNow } from 'date-fns';
import { useDateFnsLocale } from '@/lib/utils/date-fns-locale';

export function PageMessageList({ messages }: { messages: PageMessage[] }) {
  const dateLocale = useDateFnsLocale();
  return <>
            {messages.map((msg) => {
              const isFromPage = msg.senderType === 'page';
              const timeAgo = formatDistanceToNow(new Date(msg.createdAt), {
                addSuffix: true,
                locale: dateLocale,
              });

              return (
                <div
                  key={msg.id}
                  className={`flex ${isFromPage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isFromPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span
                        className={`text-xs ${
                          isFromPage ? 'text-blue-100' : 'text-neutral-500'
                        }`}
                      >
                        {timeAgo}
                      </span>
                      {isFromPage && (
                        <span className="text-xs">
                          {msg.isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
  </>;
}
