import Link from 'next/link';
import type { Route } from 'next';
import { getTranslations } from 'next-intl/server';
import {
  ChatBubbleLeftIcon,
  PencilIcon,
  PhoneIcon,
} from '@/components/icons/heroicons-shim';

interface Props {
  name: string;
  ownerId: string;
  phone: string | null;
  whatsapp: string | null;
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
 * Wireframe [Contacto]: internal chat deep-link (auto-creates the direct
 * conversation, same as profile MessageButton) plus WhatsApp/phone when the
 * entrepreneur shared a number. Pure links — no client JS needed.
 */
export async function ContactActions({
  name,
  ownerId,
  phone,
  whatsapp,
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

  const waNumber = (whatsapp ?? phone ?? '').replace(/\D/g, '');
  const chatHref = viewerId
    ? (`/chat/${ownerId}` as Route)
    : (`/login?redirect=${encodeURIComponent(loginRedirect)}` as Route);

  return (
    <>
      <Link href={chatHref} className={PRIMARY}>
        <ChatBubbleLeftIcon className="h-4 w-4" />
        {t('contact')}
      </Link>
      {waNumber && (
        <a
          href={`https://wa.me/${waNumber}?text=${encodeURIComponent(t('whatsappMessage', { name }))}`}
          target="_blank"
          rel="noreferrer"
          className={SECONDARY}
        >
          {t('whatsapp')}
        </a>
      )}
      {phone && (
        <a href={`tel:${phone}`} className={SECONDARY}>
          <PhoneIcon className="h-4 w-4" />
          {t('call')}
        </a>
      )}
    </>
  );
}
