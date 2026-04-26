import { notFound } from 'next/navigation';
import { getServerClient } from '@/utils/supabase/server';
import PrintButton from './PrintButton';

export const metadata = { title: 'Identificación verificada · Yebaam' };

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function CertificatePage({ params }: PageProps) {
  const { code } = await params;
  const sb = await getServerClient();
  const { data } = await sb
    .from('profiles')
    .select(
      'id, username, first_name, last_name, verified_at, pioneer_number, unique_id_code, is_verified',
    )
    .eq('unique_id_code', code)
    .maybeSingle();

  if (!data || !data.is_verified) notFound();

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ') || data.username || '—';
  const verifiedAt = data.verified_at ? new Date(data.verified_at).toLocaleDateString('es-ES') : '—';

  return (
    <div className="mx-auto my-12 max-w-2xl px-4 print:my-0 print:max-w-none">
      <div className="rounded-2xl border-4 border-emerald-600 bg-white p-8 shadow-lg dark:bg-neutral-900 print:border-2 print:shadow-none">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
            Identificación única e inalienable
          </p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">{fullName}</h1>
          {data.username && <p className="text-neutral-500">@{data.username}</p>}
        </div>
        <div className="my-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-xs uppercase text-neutral-500">Código</div>
            <div className="font-mono text-lg font-bold text-emerald-700">{data.unique_id_code}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-neutral-500">Verificado el</div>
            <div className="font-semibold">{verifiedAt}</div>
          </div>
          {data.pioneer_number && (
            <div className="col-span-2 rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
              <div className="text-xs uppercase">Distinción</div>
              <div className="font-bold">Pionero #{data.pioneer_number} · entre los primeros 5,000 usuarios verificados</div>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-neutral-500">
          Esta identificación certifica que el usuario fue autenticado por administradores de Yebaam.
        </p>
        <div className="mt-6 flex justify-center print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
