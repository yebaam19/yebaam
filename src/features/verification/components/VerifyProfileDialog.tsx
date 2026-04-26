'use client';

import { Dialog, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/utils/supabase/client';
import { uploadService } from '@/lib/service/upload.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import {
  acceptVerificationTermsAction,
  savePhotoSlotAction,
  saveRequiredInfoAction,
  submitVerificationRequestAction,
} from '../actions/verification.actions';

interface Props {
  open: boolean;
  onClose: () => void;
  ownerUserId: string;
}

interface ProfileSnapshot {
  first_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  birth_place: string | null;
  residence_country: string | null;
  residence_state: string | null;
  residence_city: string | null;
  study_place: string | null;
  work_place: string | null;
  terms_accepted_at: string | null;
  is_verified: boolean | null;
  verification_status: string | null;
}

const SLOT_LABELS = ['Foto de perfil', 'Foto de portada', 'Foto adicional 1', 'Foto adicional 2', 'Foto adicional 3'];

export default function VerifyProfileDialog({ open, onClose, ownerUserId }: Props) {
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);
  const [photos, setPhotos] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const [{ data: p }, { data: ph }] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'first_name, last_name, birth_date, birth_place, residence_country, residence_state, residence_city, study_place, work_place, terms_accepted_at, is_verified, verification_status',
        )
        .eq('id', ownerUserId)
        .maybeSingle(),
      supabase.from('verification_photos').select('slot, cf_image_id').eq('user_id', ownerUserId),
    ]);
    setProfile((p as ProfileSnapshot) ?? null);
    const map: Record<number, string> = {};
    (ph ?? []).forEach((row: { slot: number; cf_image_id: string }) => {
      map[row.slot] = row.cf_image_id;
    });
    setPhotos(map);
  }, [ownerUserId]);

  useEffect(() => {
    if (open) {
      setTab(0);
      void refresh();
    }
  }, [open, refresh]);

  const photoCount = Object.keys(photos).length;
  const hash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;

  const requiredFilled = useMemo(() => {
    if (!profile) return false;
    return Boolean(
      profile.first_name &&
        profile.last_name &&
        profile.birth_date &&
        profile.birth_place &&
        profile.residence_country &&
        profile.residence_state &&
        profile.residence_city &&
        profile.study_place &&
        profile.work_place,
    );
  }, [profile]);

  const canSubmit =
    requiredFilled && photoCount >= 5 && Boolean(profile?.terms_accepted_at) && !profile?.is_verified;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-2 text-center md:px-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-neutral-900/60" />
          </TransitionChild>
          <span className="inline-block h-screen align-middle" aria-hidden>&#8203;</span>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="my-6 inline-block w-full max-w-2xl transform overflow-hidden rounded-2xl border border-black/5 bg-white text-left align-middle shadow-xl transition-all dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-700">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Autenticación de perfil
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <span aria-hidden>×</span>
                </button>
              </div>

              <div className="max-h-[75vh] overflow-y-auto px-4 py-4 sm:px-6">
                <Tabs selectedIndex={tab} onChange={setTab}>
                  <TabsList>
                    <TabsTrigger>{`1. Información${requiredFilled ? ' ✓' : ''}`}</TabsTrigger>
                    <TabsTrigger>{`2. Fotos (${photoCount}/5)`}</TabsTrigger>
                    <TabsTrigger>{`3. Términos${profile?.terms_accepted_at ? ' ✓' : ''}`}</TabsTrigger>
                    <TabsTrigger>4. Documento</TabsTrigger>
                  </TabsList>

                  <TabsContent>
                    <RequiredInfoTab
                      profile={profile}
                      onSaved={async () => {
                        toast.success('Información guardada');
                        await refresh();
                        setTab(1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent>
                    <PhotosTab
                      photos={photos}
                      hash={hash}
                      onUploaded={async () => {
                        await refresh();
                      }}
                    />
                  </TabsContent>

                  <TabsContent>
                    <TermsTab
                      accepted={Boolean(profile?.terms_accepted_at)}
                      onAccepted={async () => {
                        toast.success('Términos aceptados');
                        await refresh();
                        setTab(3);
                      }}
                    />
                  </TabsContent>

                  <TabsContent>
                    <IdDocumentTab
                      canSubmit={canSubmit}
                      submitting={submitting}
                      onSubmit={async (cfImageId, mimeType) => {
                        try {
                          setSubmitting(true);
                          await submitVerificationRequestAction({ cfImageId, mimeType });
                          toast.success('Solicitud enviada para revisión');
                          await refresh();
                          onClose();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Error al enviar la solicitud');
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

function RequiredInfoTab({
  profile,
  onSaved,
}: {
  profile: ProfileSnapshot | null;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    residenceCountry: '',
    residenceState: '',
    residenceCity: '',
    studyPlace: '',
    workPlace: '',
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName: profile.first_name ?? '',
      lastName: profile.last_name ?? '',
      birthDate: profile.birth_date ?? '',
      birthPlace: profile.birth_place ?? '',
      residenceCountry: profile.residence_country ?? '',
      residenceState: profile.residence_state ?? '',
      residenceCity: profile.residence_city ?? '',
      studyPlace: profile.study_place ?? '',
      workPlace: profile.work_place ?? '',
    });
  }, [profile]);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      await saveRequiredInfoAction(form);
      await onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-2">
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        Toda la información es obligatoria. Puedes ocultarla del público en ajustes — el administrador la verá para verificar.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={inputCls} placeholder="Nombre real" value={form.firstName} onChange={onChange('firstName')} required />
        <input className={inputCls} placeholder="Apellidos" value={form.lastName} onChange={onChange('lastName')} required />
        <input className={inputCls} type="date" value={form.birthDate} onChange={onChange('birthDate')} required />
        <input className={inputCls} placeholder="Lugar de nacimiento" value={form.birthPlace} onChange={onChange('birthPlace')} required />
        <input className={inputCls} placeholder="País de residencia" value={form.residenceCountry} onChange={onChange('residenceCountry')} required />
        <input className={inputCls} placeholder="Estado/Provincia" value={form.residenceState} onChange={onChange('residenceState')} required />
        <input className={inputCls} placeholder="Ciudad" value={form.residenceCity} onChange={onChange('residenceCity')} required />
        <input className={inputCls} placeholder="Lugar de estudio" value={form.studyPlace} onChange={onChange('studyPlace')} required />
        <input className={inputCls} placeholder="Lugar de trabajo" value={form.workPlace} onChange={onChange('workPlace')} required />
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
        >
          {busy ? 'Guardando…' : 'Guardar y continuar'}
        </button>
      </div>
    </form>
  );
}

function PhotosTab({
  photos,
  hash,
  onUploaded,
}: {
  photos: Record<number, string>;
  hash?: string;
  onUploaded: () => Promise<void>;
}) {
  const [busySlot, setBusySlot] = useState<number | null>(null);

  const handlePick = (slot: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    try {
      setBusySlot(slot);
      const { id } = await uploadService.uploadImage(file);
      await savePhotoSlotAction({ slot, cfImageId: id });
      await onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setBusySlot(null);
    }
  };

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        Sube 5 fotos. La primera será tu foto de perfil; la segunda, tu portada.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[1, 2, 3, 4, 5].map((slot) => {
          const id = photos[slot];
          const url = id && hash ? `https://imagedelivery.net/${hash}/${id}/public` : null;
          return (
            <label
              key={slot}
              className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-600 hover:border-emerald-500 dark:border-neutral-600 dark:bg-neutral-700"
            >
              {url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt={SLOT_LABELS[slot - 1]} className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 px-2 text-center">
                  <span className="font-semibold">{SLOT_LABELS[slot - 1]}</span>
                  <span className="text-[10px]">Toca para subir</span>
                </div>
              )}
              {busySlot === slot && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                  Subiendo…
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePick(slot)} />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function TermsTab({ accepted, onAccepted }: { accepted: boolean; onAccepted: () => Promise<void> }) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3 py-2">
      <div className="max-h-48 overflow-y-auto rounded border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 dark:border-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-200">
        Al solicitar la autenticación, aceptas que (1) la información proporcionada es real y verificable,
        (2) tu documento de identidad será revisado por administradores con propósito de verificación
        únicamente, (3) la plataforma podrá revocar tu autenticación si se detectan datos falsos. Lee los
        términos completos en /terms y la política de datos en /privacy.
      </div>
      {accepted ? (
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Has aceptado los términos.
        </p>
      ) : (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-neutral-700 dark:text-neutral-300">
            He leído y acepto los términos adicionales para la autenticación.
          </span>
        </label>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!checked || busy || accepted}
          onClick={async () => {
            try {
              setBusy(true);
              await acceptVerificationTermsAction();
              await onAccepted();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Error');
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
        >
          {accepted ? 'Aceptado' : busy ? 'Guardando…' : 'Aceptar y continuar'}
        </button>
      </div>
    </div>
  );
}

function IdDocumentTab({
  canSubmit,
  submitting,
  onSubmit,
}: {
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: (cfImageId: string, mimeType: string) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setUploading(true);
      // Upload to Cloudflare Images. Privacy is enforced at the DB layer:
      // `id_documents` RLS restricts SELECT to platform_admins, so the
      // unguessable CF image id is only ever visible to admins.
      const { id } = await uploadService.uploadImage(file, undefined, {
        metadata: { kind: 'id_document' },
      });
      await onSubmit(id, file.type);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al subir documento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        Sube tu cédula o documento de identidad. Solo el administrador podrá visualizarlo, mediante un enlace
        firmado de corta duración. Aceptamos imágenes (JPG/PNG/HEIC).
      </p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 dark:text-neutral-300"
      />
      {!canSubmit && (
        <p className="text-xs text-yellow-700 dark:text-yellow-400">
          Completa los pasos 1, 2 y 3 antes de enviar tu solicitud.
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!file || !canSubmit || uploading || submitting}
          onClick={handleSubmit}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
        >
          {uploading || submitting ? 'Enviando…' : 'Enviar para revisión'}
        </button>
      </div>
    </div>
  );
}
