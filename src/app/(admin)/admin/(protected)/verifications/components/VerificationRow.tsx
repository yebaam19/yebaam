'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  getIdDocumentSignedUrlAction,
  reviewVerificationRequestAction,
} from '@/features/verification/actions/admin-review.actions';

interface Row {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  profiles: {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    birth_date: string | null;
    birth_place: string | null;
    residence_country: string | null;
    residence_state: string | null;
    residence_city: string | null;
    study_place: string | null;
    work_place: string | null;
  } | null;
}

export default function VerificationRow({ row }: { row: Row }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const p = row.profiles;
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.username || row.user_id;

  const handleReveal = async () => {
    try {
      const url = await getIdDocumentSignedUrlAction(row.id);
      setSignedUrl(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cargar el documento');
    }
  };

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await reviewVerificationRequestAction({ requestId: row.id, decision: 'approved' });
        toast.success('Solicitud aprobada');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  };

  const handleReject = () => {
    const reason = window.prompt('Motivo del rechazo (visible para el usuario):');
    if (!reason) return;
    startTransition(async () => {
      try {
        await reviewVerificationRequestAction({
          requestId: row.id,
          decision: 'rejected',
          rejectionReason: reason,
        });
        toast.success('Solicitud rechazada');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  };

  return (
    <li className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-3">
          {p?.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-neutral-200" />
          )}
          <div className="flex-1">
            <Link
              href={p?.username ? `/${p.username}` : '#'}
              className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
            >
              {fullName}
            </Link>
            {p?.username && (
              <span className="ml-2 text-sm text-neutral-500">@{p.username}</span>
            )}
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-neutral-600 sm:grid-cols-2 dark:text-neutral-400">
              <div>
                <dt className="inline font-medium">Nacimiento:</dt>{' '}
                <dd className="inline">
                  {p?.birth_date ?? '—'} {p?.birth_place ? `· ${p.birth_place}` : ''}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium">Residencia:</dt>{' '}
                <dd className="inline">
                  {[p?.residence_city, p?.residence_state, p?.residence_country].filter(Boolean).join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="inline font-medium">Estudio:</dt>{' '}
                <dd className="inline">{p?.study_place ?? '—'}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Trabajo:</dt>{' '}
                <dd className="inline">{p?.work_place ?? '—'}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Enviada:</dt>{' '}
                <dd className="inline">{new Date(row.submitted_at).toLocaleString('es-ES')}</dd>
              </div>
              {row.reviewed_at && (
                <div>
                  <dt className="inline font-medium">Revisada:</dt>{' '}
                  <dd className="inline">{new Date(row.reviewed_at).toLocaleString('es-ES')}</dd>
                </div>
              )}
              {row.rejection_reason && (
                <div className="sm:col-span-2">
                  <dt className="inline font-medium text-red-600">Motivo rechazo:</dt>{' '}
                  <dd className="inline">{row.rejection_reason}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:w-44">
          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener"
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-neutral-700"
            >
              Abrir documento
            </a>
          ) : (
            <button
              type="button"
              onClick={handleReveal}
              className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-100"
            >
              Ver documento
            </button>
          )}
          {row.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={busy}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
              >
                Aprobar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={busy}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-neutral-400"
              >
                Rechazar
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
