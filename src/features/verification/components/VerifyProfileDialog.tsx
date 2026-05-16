'use client';

import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { supabase } from '@/utils/supabase/client';
import { uploadService } from '@/lib/service/upload.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import {
  acceptVerificationTermsAction,
  savePhotoSlotAction,
  saveRequiredInfoAction,
  submitVerificationRequestAction,
} from '../actions/verification.actions';
import {
  getOwnIdDocumentUrlAction,
  getOwnVerificationPhotoUrlsAction,
} from '../actions/signed-urls.actions';

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

interface PendingDocSnapshot {
  url: string;
}

export default function VerifyProfileDialog({ open, onClose, ownerUserId }: Props) {
  const t = useTranslations('verification');
  const SLOT_LABELS = [
    t('photos.slot1'),
    t('photos.slot2'),
    t('photos.slot3'),
    t('photos.slot4'),
    t('photos.slot5'),
  ];
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);
  /** Map slot number → signed delivery URL (minted server-side, expires in ~15 min). */
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({});
  const [pendingDoc, setPendingDoc] = useState<PendingDocSnapshot | null>(null);
  const [latestRejectionReason, setLatestRejectionReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const [{ data: p }, photoRows, idDocUrl, { data: rejected }] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'first_name, last_name, birth_date, birth_place, residence_country, residence_state, residence_city, study_place, work_place, terms_accepted_at, is_verified, verification_status',
        )
        .eq('id', ownerUserId)
        .maybeSingle(),
      getOwnVerificationPhotoUrlsAction().catch(() => [] as { slot: number; url: string }[]),
      getOwnIdDocumentUrlAction().catch(() => null),
      supabase
        .from('verification_requests')
        .select('rejection_reason, status, reviewed_at')
        .eq('user_id', ownerUserId)
        .eq('status', 'rejected')
        .order('reviewed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setProfile((p as ProfileSnapshot) ?? null);
    const map: Record<number, string> = {};
    photoRows.forEach((row) => {
      map[row.slot] = row.url;
    });
    setPhotoUrls(map);
    setPendingDoc(idDocUrl ? { url: idDocUrl } : null);
    setLatestRejectionReason((rejected as { rejection_reason: string | null } | null)?.rejection_reason ?? null);
  }, [ownerUserId]);

  useEffect(() => {
    if (open) {
      setTab(0);
      void refresh();
    }
  }, [open, refresh]);

  const photoCount = Object.keys(photoUrls).length;

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
  const alreadyPending = profile?.verification_status === 'pending';
  const wasRejected = profile?.verification_status === 'rejected';

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
            <DialogPanel className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-neutral-700">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('dialog.title')}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <span aria-hidden>×</span>
                </button>
              </div>

              <div className="max-h-[calc(90vh-4rem)] overflow-y-auto px-4 py-4 sm:px-6">
                <Tabs selectedIndex={tab} onChange={setTab}>
                  <TabsList>
                    <TabsTrigger>{t('dialog.tabInfo', { check: requiredFilled ? ' ✓' : '' })}</TabsTrigger>
                    <TabsTrigger>{t('dialog.tabPhotos', { current: photoCount })}</TabsTrigger>
                    <TabsTrigger>{t('dialog.tabTerms', { check: profile?.terms_accepted_at ? ' ✓' : '' })}</TabsTrigger>
                    <TabsTrigger>{t('dialog.tabDocument')}</TabsTrigger>
                  </TabsList>

                  <TabsContent>
                    <RequiredInfoTab
                      profile={profile}
                      onSaved={async () => {
                        toast.success(t('dialog.savedToast'));
                        await refresh();
                        setTab(1);
                      }}
                    />
                  </TabsContent>

                  <TabsContent>
                    <PhotosTab
                      photoUrls={photoUrls}
                      slotLabels={SLOT_LABELS}
                      onUploaded={async () => {
                        await refresh();
                      }}
                    />
                  </TabsContent>

                  <TabsContent>
                    <TermsTab
                      accepted={Boolean(profile?.terms_accepted_at)}
                      onAccepted={async () => {
                        toast.success(t('dialog.termsAcceptedToast'));
                        await refresh();
                        setTab(3);
                      }}
                    />
                  </TabsContent>

                  <TabsContent>
                    <IdDocumentTab
                      canSubmit={canSubmit}
                      alreadyPending={alreadyPending}
                      wasRejected={wasRejected}
                      rejectionReason={latestRejectionReason}
                      pendingDocUrl={pendingDoc?.url ?? null}
                      submitting={submitting}
                      onSubmit={async (cfImageId, mimeType) => {
                        try {
                          setSubmitting(true);
                          await submitVerificationRequestAction({ cfImageId, mimeType });
                          toast.success(t('dialog.submittedToast'));
                          await refresh();
                          onClose();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : t('dialog.submitErrorToast'));
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </DialogPanel>
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
  const t = useTranslations('verification.requiredInfo');
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
      toast.error(err instanceof Error ? err.message : t('saveErrorToast'));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-2">
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        {t('intro')}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={inputCls} placeholder={t('firstName')} value={form.firstName} onChange={onChange('firstName')} required />
        <input className={inputCls} placeholder={t('lastName')} value={form.lastName} onChange={onChange('lastName')} required />
        <input className={inputCls} type="date" value={form.birthDate} onChange={onChange('birthDate')} required />
        <input className={inputCls} placeholder={t('birthPlace')} value={form.birthPlace} onChange={onChange('birthPlace')} required />
        <input className={inputCls} placeholder={t('residenceCountry')} value={form.residenceCountry} onChange={onChange('residenceCountry')} required />
        <input className={inputCls} placeholder={t('residenceState')} value={form.residenceState} onChange={onChange('residenceState')} required />
        <input className={inputCls} placeholder={t('residenceCity')} value={form.residenceCity} onChange={onChange('residenceCity')} required />
        <input className={inputCls} placeholder={t('studyPlace')} value={form.studyPlace} onChange={onChange('studyPlace')} required />
        <input className={inputCls} placeholder={t('workPlace')} value={form.workPlace} onChange={onChange('workPlace')} required />
      </div>
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
        >
          {busy ? t('saving') : t('saveContinue')}
        </button>
      </div>
    </form>
  );
}

function PhotosTab({
  photoUrls,
  slotLabels,
  onUploaded,
}: {
  photoUrls: Record<number, string>;
  slotLabels: string[];
  onUploaded: () => Promise<void>;
}) {
  const t = useTranslations('verification.photos');
  const [busySlot, setBusySlot] = useState<number | null>(null);

  const handlePick = (slot: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(t('onlyImages'));
      return;
    }
    try {
      setBusySlot(slot);
      const { id } = await uploadService.uploadImage(file, undefined, {
        metadata: { kind: 'verification_photo', slot: String(slot) },
        requireSignedURLs: true,
      });
      await savePhotoSlotAction({ slot, cfImageId: id });
      await onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('uploadErrorToast'));
    } finally {
      setBusySlot(null);
    }
  };

  return (
    <div className="space-y-3 py-2">
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        {t('intro')}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[1, 2, 3, 4, 5].map((slot) => {
          const url = photoUrls[slot] ?? null;
          return (
            <label
              key={slot}
              className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-600 hover:border-emerald-500 dark:border-neutral-600 dark:bg-neutral-700"
            >
              {url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={url} alt={slotLabels[slot - 1]} className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 px-2 text-center">
                  <span className="font-semibold">{slotLabels[slot - 1]}</span>
                  <span className="text-[10px]">{t('tapToUpload')}</span>
                </div>
              )}
              {busySlot === slot && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                  {t('uploading')}
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
  const t = useTranslations('verification.terms');
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-3 py-2">
      <div className="max-h-48 overflow-y-auto rounded border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 dark:border-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-200">
        {t('body')}
      </div>
      {accepted ? (
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {t('accepted')}
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
            {t('acceptLabel')}
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
              toast.error(e instanceof Error ? e.message : t('errorToast'));
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
        >
          {accepted ? t('alreadyAccepted') : busy ? t('saving') : t('acceptContinue')}
        </button>
      </div>
    </div>
  );
}

function IdDocumentTab({
  canSubmit,
  alreadyPending,
  wasRejected,
  rejectionReason,
  pendingDocUrl,
  submitting,
  onSubmit,
}: {
  canSubmit: boolean;
  alreadyPending: boolean;
  wasRejected: boolean;
  rejectionReason: string | null;
  pendingDocUrl: string | null;
  submitting: boolean;
  onSubmit: (cfImageId: string, mimeType: string) => Promise<void>;
}) {
  const t = useTranslations('verification.document');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error(t('onlyImagesToast'));
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error(t('tooLargeToast'));
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setUploading(true);
      // Upload to Cloudflare Images. Privacy is enforced at the DB layer:
      // `id_documents` RLS restricts SELECT to platform_admins + owner, so the
      // unguessable CF image id is only ever visible to those roles.
      const { id } = await uploadService.uploadImage(file, undefined, {
        metadata: { kind: 'id_document' },
        requireSignedURLs: true,
      });
      await onSubmit(id, file.type);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('uploadErrorToast'));
    } finally {
      setUploading(false);
    }
  };

  if (alreadyPending) {
    const docUrl = pendingDocUrl;
    return (
      <div className="space-y-3 py-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          <p className="font-semibold">{t('pendingTitle')}</p>
          <p className="mt-1 text-xs">
            {t('pendingBody')}
          </p>
        </div>

        {docUrl && (
          <div>
            <p className="mb-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {t('submittedDocLabel')}
            </p>
            <a href={docUrl} target="_blank" rel="noopener" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={docUrl}
                alt={t('sentDocAlt')}
                className="max-h-64 w-full rounded-md border border-neutral-200 object-contain dark:border-neutral-700"
              />
            </a>
            <p className="mt-1 text-[10px] text-neutral-500">{t('openFullSize')}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      {wasRejected && rejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-800 dark:bg-red-900/20">
          <p className="font-semibold text-red-900 dark:text-red-200">
            {t('rejectedTitle')}
          </p>
          <p className="mt-1 text-xs text-red-800 dark:text-red-300">
            <span className="font-medium">{t('rejectedReason')}</span> {rejectionReason}
          </p>
          <p className="mt-2 text-xs text-red-800 dark:text-red-300">
            {t('rejectedHint')}
          </p>
        </div>
      )}
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        {t('intro')}
      </p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-neutral-300 bg-neutral-50 hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-neutral-600 dark:bg-neutral-700/40 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = '';
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        {previewUrl ? (
          <div className="flex w-full flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={t('previewAlt')}
              className="max-h-48 w-auto rounded-md border border-neutral-200 object-contain dark:border-neutral-600"
            />
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              <span className="font-semibold">{file?.name}</span>
              {file ? ` · ${t('fileSize', { size: (file.size / 1024 / 1024).toFixed(2) })}` : ''}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFile(null);
              }}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              {t('removeFile')}
            </button>
          </div>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-10 w-10 text-emerald-600 dark:text-emerald-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              {t('dropPromptStart')}
              <span className="text-emerald-600 underline dark:text-emerald-400">{t('dropPromptLink')}</span>
            </p>
            <p className="text-[11px] text-neutral-500">{t('fileTypes')}</p>
          </>
        )}
      </label>

      {!canSubmit && (
        <p className="text-xs text-yellow-700 dark:text-yellow-400">
          {t('stepsHint')}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!file || !canSubmit || uploading || submitting}
          onClick={handleSubmit}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
        >
          {uploading || submitting
            ? t('submitting')
            : wasRejected
            ? t('resubmit')
            : t('submit')}
        </button>
      </div>
    </div>
  );
}
