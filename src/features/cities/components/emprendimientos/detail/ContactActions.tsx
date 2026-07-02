import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import { ChatBubbleLeftIcon, PencilIcon } from '@/components/icons/heroicons-shim';

interface Props {
  ownerId: string;
  viewerId: string | null;
  viewerIsOwner: boolean;
  editHref: Route;
  loginRedirect: string;
}

const PRIMARY =
  'inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700';
const SECONDARY =
  'inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white dark:border-neutral-600 dark:bg-neutral-800/95 dark:text-neutral-200 dark:hover:bg-neutral-800';

/**
 * Wireframe [Contacto]: one button that deep-links into the internal chat
 * (auto-creates the direct conversation, same as profile MessageButton).
 * WhatsApp / phone live in the DetailsPanel "Contacto" row, keeping the hero
 * exactly two buttons like the client's mockup. Pure link — no client JS.
 */
export async function ContactActions({
  ownerId,
  viewerId,
  viewerIsOwner,
  editHref,
  loginRedirect,
}: Props) {
  const t = await getTranslations('cities.emprendimientos.detail');

  if (viewerIsOwner) {
    return (
      <Link href={editHref} className={SECONDARY}>
        <PencilIcon className="h-4 w-4" />
        {t('editCta')}
      </Link>
    );
  }

  const chatHref = viewerId
    ? (`/chat/${ownerId}` as Route)
    : (`/login?redirect=${encodeURIComponent(loginRedirect)}` as Route);

  return (
    <Link href={chatHref} className={PRIMARY}>
      <ChatBubbleLeftIcon className="h-4 w-4" />
      {t('contact')}
    </Link>
  );
}
