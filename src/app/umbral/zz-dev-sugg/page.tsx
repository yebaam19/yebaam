'use client';
// TEMP harness — delete after visual check.
import { notFound } from 'next/navigation';
import { SuggestionsTabView } from '@/app/(app)/feed/friends/tabs/SuggestionsTabView';

const S = [
  { id: '1', username: 'dc6019849', firstName: 'DAVID', lastName: 'CONDE', mutualFriends: 2, reason: 'Usuario sugerido' },
  { id: '2', username: 'steffanycondepena3', firstName: 'Steffany', lastName: 'Conde', mutualFriends: 12, reason: 'Usuario sugerido' },
  { id: '3', username: 'emanuel', firstName: 'Emanuel', lastName: 'Gómez', mutualFriends: 1, reason: 'Usuario sugerido', location: { city: 'Popayán', country: 'Colombia' } },
  { id: '4', username: 'mariaalejandrarodriguezcastillo', firstName: 'María Alejandra', lastName: 'Rodríguez Castillo', mutualFriends: 0, reason: 'Comparte intereses musicales contigo' },
  { id: '5', username: 'jp', firstName: 'Juan', lastName: 'Pérez', mutualFriends: 3, reason: 'Usuario sugerido' },
];

export default function Page() {
  // Dev-only visual harness; /umbral is a public route so never expose it in prod.
  if (process.env.NODE_ENV === 'production') notFound();
  const widths = [318, 544, 611, 704, 800, 992];
  return (
    <div className="space-y-8 bg-neutral-50 p-4">
      {widths.map((w) => (
        <div key={w} data-w={w} style={{ width: w }} className="rounded-xl border border-dashed border-red-400 bg-white p-3 sm:p-6">
          <p className="mb-2 text-xs text-red-500">{w}px</p>
          <SuggestionsTabView isLoading={false} suggestions={S as never} onSendRequest={() => {}} onDismiss={() => {}} />
        </div>
      ))}
    </div>
  );
}
