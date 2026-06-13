'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { reviewVerificationRequestAction } from '@/features/verification/actions/admin-review.actions';
import { useTranslations } from 'next-intl';
import { VerificationProfile } from './VerificationRow/VerificationProfile';
import { VerificationActions } from './VerificationRow/VerificationActions';
import { EvidenceGrid } from './VerificationRow/EvidenceGrid';
import { Lightbox } from './VerificationRow/Lightbox';
import { RejectionDialog } from './VerificationRow/RejectionDialog';

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

interface Props {
  row: Row;
  idDocumentUrl: string | null;
  photoUrls: { slot: number; url: string }[];
}

export default function VerificationRow({ row, idDocumentUrl, photoUrls }: Props) {
  const t = useTranslations('admin.verifications');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const p = row.profiles;
  const fullName = [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.username || row.user_id;

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await reviewVerificationRequestAction({ requestId: row.id, decision: 'approved' });
        toast.success(t('successApproved'));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t('genericError'));
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
        toast.success(t('successRejected'));
        setRejectOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t('genericError'));
      }
    });
  };

  return (
    <li className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <VerificationProfile
          profile={p}
          fullName={fullName}
          submittedAt={row.submitted_at}
          reviewedAt={row.reviewed_at}
          rejectionReason={row.rejection_reason}
        />
        <VerificationActions
          pending={row.status === 'pending'}
          busy={busy}
          onApprove={handleApprove}
          onReject={() => setRejectOpen(true)}
        />
      </div>

      {/* Evidence: ID document + 5 verification photos as inline thumbnails. */}
      <EvidenceGrid idDocumentUrl={idDocumentUrl} photoUrls={photoUrls} onOpen={setLightbox} />

      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}

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
