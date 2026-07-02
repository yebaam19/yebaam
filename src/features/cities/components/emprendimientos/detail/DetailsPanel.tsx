import { getTranslations } from 'next-intl/server';
import {
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  TagIcon,
  UserIcon,
} from '@/components/icons/heroicons-shim';
import { EMPRENDIMIENTO_CATEGORY_EMOJI } from '@/features/cities/data/emprendimientos';
import type { EmprendimientoDetail } from '@/features/cities/server/emprendimientos.server';

interface Props {
  item: EmprendimientoDetail;
}

interface RowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}

function Row({ icon: Icon, label, children }: RowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {label}
        </dt>
        <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{children}</dd>
      </div>
    </div>
  );
}

/**
 * Wireframe "Detalles del emprendimiento": nombre del emprendedor, lugar,
 * dirección, tipo de venta, contacto. The contact row is actionable —
 * WhatsApp / llamar live here so the hero keeps exactly the two buttons of
 * the client's mockup.
 */
export async function DetailsPanel({ item }: Props) {
  const t = await getTranslations('cities.emprendimientos');
  const contact = item.whatsapp ?? item.phone;
  const waNumber = (contact ?? '').replace(/\D/g, '');

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {t('detail.detailsTitle')}
      </h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {item.shortDescription}
      </p>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <Row icon={UserIcon} label={t('detail.ownerLabel')}>
          {item.ownerName}
        </Row>
        <Row icon={TagIcon} label={t('detail.categoryLabel')}>
          <span aria-hidden="true">{EMPRENDIMIENTO_CATEGORY_EMOJI[item.category]}</span>{' '}
          {t(`categories.${item.category}`)}
        </Row>
        {item.zone && (
          <Row icon={MapPinIcon} label={t('detail.zoneLabel')}>
            {item.zone}
          </Row>
        )}
        {item.address && (
          <Row icon={HomeIcon} label={t('detail.addressLabel')}>
            {item.address}
          </Row>
        )}
        {contact && (
          <Row icon={PhoneIcon} label={t('detail.contactLabel')}>
            <span className="flex flex-wrap items-center gap-2">
              <span>{contact}</span>
              {waNumber && (
                <a
                  href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                    t('detail.whatsappMessage', { name: item.name }),
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
                >
                  {t('detail.whatsapp')}
                </a>
              )}
              <a
                href={`tel:${contact}`}
                className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
              >
                {t('detail.call')}
              </a>
            </span>
          </Row>
        )}
      </dl>
    </div>
  );
}
