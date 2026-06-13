'use client';

import { Fragment, useState } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';

const REJECTION_PRESETS = [
  'El diploma no es legible',
  'El diploma no corresponde al titular',
  'La información no coincide con el documento',
  'No se reconoce la institución emisora',
];

export default function RejectionDialog({
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
