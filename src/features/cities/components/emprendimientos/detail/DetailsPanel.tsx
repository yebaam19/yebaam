import { getTranslations } from 'next-intl/server';
import {
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  TagIcon,
  UserIcon,
} from '@/components/icons/heroicons-shim';
import type { EmprendimientoDetail } from '@/features/cities/server/emprendimientos.server';

interface Props {
  item: EmprendimientoDetail;
}

interface RowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

function Row({ icon: Icon, label, value }: RowProps) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {label}
        </dt>
        <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{value}</dd>
      </div>
    </div>
  );
}

/** Wireframe "Detalles del emprendimiento": nombre del emprendedor, lugar,
 *  dirección, tipo de venta, contacto — as a compact definition list. */
export async function DetailsPanel({ item }: Props) {
  const t = await getTranslations('cities.emprendimientos');
  const contact = item.whatsapp ?? item.phone;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {t('detail.detailsTitle')}
      </h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {item.shortDescription}
      </p>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        <Row icon={UserIcon} label={t('detail.ownerLabel')} value={item.ownerName} />
        <Row
          icon={TagIcon}
          label={t('detail.categoryLabel')}
          value={t(`categories.${item.category}`)}
        />
        {item.zone && <Row icon={MapPinIcon} label={t('detail.zoneLabel')} value={item.zone} />}
        {item.address && (
          <Row icon={HomeIcon} label={t('detail.addressLabel')} value={item.address} />
        )}
        {contact && <Row icon={PhoneIcon} label={t('detail.contactLabel')} value={contact} />}
      </dl>
    </div>
  );
}
