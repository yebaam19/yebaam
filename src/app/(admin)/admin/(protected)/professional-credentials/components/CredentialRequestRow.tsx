'use client';

import { Fragment, useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import {
  reviewCredentialRequestAction,
  decideMaterialEditReviewAction,
} from '@/features/professional-profile/server/credentials-admin.actions';
import {
  categoryLabel,
  distinctionLabel,
  studyTypeLabel,
} from '@/features/professional-profile/lib/credentials';
import type {
  StudyType,
  TitleCategory,
  TitleDistinction,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import MaterialEditDiff from './MaterialEditDiff';

type Status = 'pending' | 'review_needed' | 'approved' | 'rejected';

interface RequestRow {
  id: string;
  user_id: string;
  target_kind: 'title' | 'study';
  title_id: string | null;
  study_id: string | null;
  evidence_cf_image_id: string;
  submitted_snapshot: Record<string, unknown>;
  status: Status;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
}

interface ProfileRow {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

interface TargetTitleRow {
  id: string;
  name: string;
  category: string | null;
  distinction: string | null;
  institution: string | null;
  year: number | null;
  focuses: string[] | null;
  credential_status: string;
}

interface TargetStudyRow {
  id: string;
  name: string;
  study_type: string | null;
  institution: string | null;
  year: number | null;
  focuses: string[] | null;
  credential_status: string;
}

interface Props {
  request: RequestRow;
  profile: ProfileRow | null;
  title: TargetTitleRow | null;
  study: TargetStudyRow | null;
  evidenceUrl: string;
}

const REJECTION_PRESETS = [
  'El diploma no es legible',
  'El diploma no corresponde al titular',
  'La información no coincide con el documento',
  'No se reconoce la institución emisora',
];

export default function CredentialRequestRow({ request, profile, title, study, evidenceUrl }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.username ||
    request.user_id;

  const composedTarget = (() => {
    if (title) {
      const cat = categoryLabel((title.category as TitleCategory | null) ?? null);
      const dist = distinctionLabel((title.distinction as TitleDistinction | null) ?? null);
      const head = cat ? `${cat} en ${title.name}` : title.name;
      const parts = [head];
      if (dist) parts.push(dist);
      if (title.institution) parts.push(title.institution);
      if (title.year != null) parts.push(String(title.year));
      return parts.join(', ');
    }
    if (study) {
      const t = studyTypeLabel((study.study_type as StudyType | null) ?? null);
      const head = t ? `${t}: ${study.name}` : study.name;
      const parts = [head];
      if (study.institution) parts.push(study.institution);
      if (study.year != null) parts.push(String(study.year));
      return parts.join(', ');
    }
    return '(elemento no encontrado)';
  })();

  const focuses = title?.focuses ?? study?.focuses ?? [];
  const currentRecord = (title ?? study) as unknown as Record<string, unknown> | null;

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await reviewCredentialRequestAction({ requestId: request.id, decision: 'approve' });
        toast.success('Credencial aprobada');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  };

  const handleConfirmReject = (reason: string, notes: string) => {
    startTransition(async () => {
      try {
        await reviewCredentialRequestAction({
          requestId: request.id,
          decision: 'reject',
          rejectionReason: reason,
          notes: notes || null,
        });
        toast.success('Credencial rechazada');
        setRejectOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  };

  const handlePreserve = () => {
    startTransition(async () => {
      try {
        await decideMaterialEditReviewAction({ requestId: request.id, decision: 'preserve' });
        toast.success('Verificación preservada');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  };

  const handleRevoke = () => {
    startTransition(async () => {
      try {
        await decideMaterialEditReviewAction({ requestId: request.id, decision: 'revoke' });
        toast.success('Verificación revocada');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  };

  return (
    <li className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-3">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-neutral-200" />
          )}
          <div className="flex-1">
            <Link
              href={profile?.username ? `/${profile.username}` : '#'}
              className="font-semibold text-neutral-900 hover:underline dark:text-neutral-100"
            >
              {fullName}
            </Link>
            {profile?.username && (
              <span className="ml-2 text-sm text-neutral-500">@{profile.username}</span>
            )}
            <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
              {request.target_kind === 'title' ? 'Título' : 'Estudio'}
            </p>
            <p className="mt-1 text-sm text-neutral-800 dark:text-neutral-200">{composedTarget}</p>
            {focuses.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {focuses.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-neutral-600 sm:grid-cols-2 dark:text-neutral-400">
              <div>
                <dt className="inline font-medium">Enviada:</dt>{' '}
                <dd className="inline">{new Date(request.submitted_at).toLocaleString('es-ES')}</dd>
              </div>
              {request.reviewed_at && (
                <div>
                  <dt className="inline font-medium">Revisada:</dt>{' '}
                  <dd className="inline">{new Date(request.reviewed_at).toLocaleString('es-ES')}</dd>
                </div>
              )}
              {request.rejection_reason && (
                <div className="sm:col-span-2">
                  <dt className="inline font-medium text-red-600">Motivo rechazo:</dt>{' '}
                  <dd className="inline">{request.rejection_reason}</dd>
                </div>
              )}
              {request.admin_notes && (
                <div className="sm:col-span-2">
                  <dt className="inline font-medium">Notas:</dt>{' '}
                  <dd className="inline">{request.admin_notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:w-44">
          {request.status === 'pending' && (
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
          {request.status === 'review_needed' && (
            <>
              <button
                type="button"
                onClick={handlePreserve}
                disabled={busy}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
              >
                {busy ? '...' : 'Preservar'}
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={busy}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-neutral-400"
              >
                Revocar
              </button>
            </>
          )}
        </div>
      </div>

      {request.status === 'review_needed' && (
        <MaterialEditDiff
          kind={request.target_kind}
          snapshot={request.submitted_snapshot}
          current={currentRecord}
        />
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => evidenceUrl && setLightbox(evidenceUrl)}
            disabled={!evidenceUrl}
            className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-md bg-neutral-100 ring-2 ring-amber-400 dark:bg-neutral-700 dark:ring-amber-500 ${evidenceUrl ? 'cursor-zoom-in hover:opacity-90' : 'cursor-not-allowed opacity-50'}`}
          >
            {evidenceUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={evidenceUrl} alt="Diploma" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] text-neutral-500">Sin archivo</span>
            )}
          </button>
          <span className="text-center text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
            Diploma / evidencia
          </span>
        </div>
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
  onConfirm: (reason: string, notes: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
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
                  Rechazar credencial de {userName}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  El motivo será visible para el usuario y podrá corregir y reenviar.
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
                    htmlFor="cred-rejection-reason"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
                  >
                    Motivo del rechazo
                  </label>
                  <textarea
                    id="cred-rejection-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cred-admin-notes"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
                  >
                    Notas internas (opcional)
                  </label>
                  <textarea
                    id="cred-admin-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    maxLength={2000}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                  />
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
                  onClick={() => trimmed && onConfirm(trimmed, notes.trim())}
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
