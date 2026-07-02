import { getTranslations } from 'next-intl/server';
import { VerifiedEntrepreneurBadge } from '../VerifiedEntrepreneurBadge';

interface Props {
  ownerName: string;
  ownerPhotoUrl?: string;
  cityName: string;
  verified: boolean;
}

/** Wireframe "Foto de emprendedor" column — big square portrait + name. */
export async function EntrepreneurCard({ ownerName, ownerPhotoUrl, cityName, verified }: Props) {
  const t = await getTranslations('cities.emprendimientos.detail');
  const initials = ownerName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="self-start rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm md:sticky md:top-24 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-900">
        {ownerPhotoUrl ? (
          <img src={ownerPhotoUrl} alt={ownerName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-700 text-4xl font-black text-white">
            {initials || '?'}
          </div>
        )}
      </div>
      <p className="mt-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
        {ownerName}
      </p>
      {verified && (
        <div className="mt-1.5 flex justify-center">
          <VerifiedEntrepreneurBadge variant="pill" />
        </div>
      )}
      <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        {t('memberOf', { city: cityName })}
      </p>
    </div>
  );
}
