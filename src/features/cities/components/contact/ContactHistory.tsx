import { getTranslations } from 'next-intl/server';
import type { ContactMessage } from '@/features/cities/server/contact.server';

interface ContactHistoryProps {
  messages: ContactMessage[];
}

function statusClasses(status: ContactMessage['status']): string {
  switch (status) {
    case 'new':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'read':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
    case 'resolved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
  }
}

/**
 * RSC list of the calling user's prior messages for the city. RLS bounds
 * the read upstream — this component just renders what comes in. Status
 * pills tell the user where their message sits on the admin side.
 */
export async function ContactHistory({ messages }: ContactHistoryProps) {
  const t = await getTranslations('cities.contact.history');

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-300">
        {t('title')}
      </h3>
      {messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
          {t('empty')}
        </div>
      ) : (
        <ol className="space-y-2">
          {messages.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {m.subject && (
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {m.subject}
                    </p>
                  )}
                  <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600 dark:text-neutral-400">
                    {m.body}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClasses(m.status)}`}
                >
                  {t(`status.${m.status}`)}
                </span>
              </div>
              <time
                dateTime={m.createdAt}
                className="mt-1.5 block text-[10px] uppercase tracking-wide text-neutral-400"
              >
                {new Date(m.createdAt).toLocaleDateString()}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
