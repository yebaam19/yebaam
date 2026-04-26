'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { reviewVerificationRequestAction } from '@/features/verification/actions/admin-review.actions';

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

const SLOT_LABELS = ['Perfil', 'Portada', 'Adicional 1', 'Adicional 2', 'Adicional 3'];

interface Props {
  row: Row;
  idDocumentUrl: string | null;
  photoUrls: { slot: number; url: string }[];
}

const REJECTION_PRESETS = [
  'El documento de identidad no es legible',
  'Las fotos no muestran claramente al titular del documento',
  'La información personal no coincide con el documento',
  'El documento ha expirado',
];

export default function VerificationRow({ row, idDocumentUrl, photoUrls }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const p = row.profiles;
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.username || row.user_id;

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

  const handleConfirmReject = (reason: string) => {
    startTransition(async () => {
      try {
        await reviewVerificationRequestAction({
          requestId: row.id,
          decision: 'rejected',
          rejectionReason: reason,
        });
        toast.success('Solicitud rechazada');
        setRejectOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  };

  const sortedPhotos = [...photoUrls].sort((a, b) => a.slot - b.slot);

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
            {p?.username && <span className="ml-2 text-sm text-neutral-500">@{p.username}</span>}
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
          {row.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={busy}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
              >
                {busy ? '...' : 'Aprobar'}
              </button>
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                disabled={busy}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-neutral-400"
              >
                Rechazar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Evidence: ID document + 5 verification photos as inline thumbnails. */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Thumb
          label="Documento de identidad"
          url={idDocumentUrl}
          highlight
          onOpen={() => idDocumentUrl && setLightbox(idDocumentUrl)}
        />
        {[1, 2, 3, 4, 5].map((slot) => {
          const photo = sortedPhotos.find((x) => x.slot === slot);
          return (
            <Thumb
              key={slot}
              label={SLOT_LABELS[slot - 1]}
              url={photo?.url ?? null}
              onOpen={() => photo && setLightbox(photo.url)}
            />
          );
        })}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Vista ampliada"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/20"
          >
            Cerrar
          </button>
        </div>
      )}

      <RejectionDialog
        open={rejectOpen}
        busy={busy}
        userName={fullName}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleConfirmReject}
      />
    </li>
  );
}

function RejectionDialog({
  open,
  busy,
  userName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  busy: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-800">
              <div className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-700">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Rechazar solicitud de {userName}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  El motivo será visible para el usuario y podrá corregir y reenviar su solicitud.
                </p>
              </div>

              <div className="space-y-4 px-6 py-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                    Motivos comunes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REJECTION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReason(preset)}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-red-900/20"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="rejection-reason"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
                  >
                    Motivo del rechazo
                  </label>
                  <textarea
                    id="rejection-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Explica al usuario qué debe corregir para que su verificación pueda ser aprobada."
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
                    <span>El usuario podrá corregir y reenviar.</span>
                    <span>{reason.length}/500</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 bg-neutral-50 px-6 py-3 dark:border-neutral-700 dark:bg-neutral-800/60">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100 disabled:opacity-50 dark:bg-neutral-700 dark:text-neutral-200 dark:ring-neutral-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => trimmed && onConfirm(trimmed)}
                  disabled={busy || trimmed.length < 4}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-neutral-400"
                >
                  {busy ? 'Rechazando…' : 'Confirmar rechazo'}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

function Thumb({
  label,
  url,
  highlight,
  onOpen,
}: {
  label: string;
  url: string | null;
  highlight?: boolean;
  onOpen: () => void;
}) {
  const ringCls = highlight
    ? 'ring-2 ring-amber-400 dark:ring-amber-500'
    : 'ring-1 ring-neutral-200 dark:ring-neutral-700';
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onOpen}
        disabled={!url}
        className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-neutral-100 ${ringCls} dark:bg-neutral-700 ${url ? 'cursor-zoom-in hover:opacity-90' : 'cursor-not-allowed opacity-50'}`}
      >
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-neutral-500">Sin archivo</span>
        )}
      </button>
      <span className="text-center text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
        {label}
      </span>
    </div>
  );
}
