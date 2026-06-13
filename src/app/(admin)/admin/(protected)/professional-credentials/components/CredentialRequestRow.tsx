'use client';

import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  reviewCredentialRequestAction,
  decideMaterialEditReviewAction,
} from '@/features/professional-profile/server/credentials-admin.actions';
import MaterialEditDiff from './MaterialEditDiff';
import RequestSummary from './CredentialRequestRow/RequestSummary';
import RequestActions from './CredentialRequestRow/RequestActions';
import EvidenceThumbnail from './CredentialRequestRow/EvidenceThumbnail';
import RejectionDialog from './CredentialRequestRow/RejectionDialog';

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

export default function CredentialRequestRow({ request, profile, title, study, evidenceUrl }: Props) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, startTransition] = useTransition();
  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.username ||
    request.user_id;

  const currentRecord = (title ?? study) as unknown as Record<string, unknown> | null;

  const handleApprove = useCallback(() => {
    startTransition(async () => {
      try {
        await reviewCredentialRequestAction({ requestId: request.id, decision: 'approve' });
        toast.success('Credencial aprobada');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  }, [request.id]);

  const handleConfirmReject = useCallback(
    (reason: string, notes: string) => {
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
    },
    [request.id]
  );

  const handlePreserve = useCallback(() => {
    startTransition(async () => {
      try {
        await decideMaterialEditReviewAction({ requestId: request.id, decision: 'preserve' });
        toast.success('Verificación preservada');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  }, [request.id]);

  const handleRevoke = useCallback(() => {
    startTransition(async () => {
      try {
        await decideMaterialEditReviewAction({ requestId: request.id, decision: 'revoke' });
        toast.success('Verificación revocada');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error');
      }
    });
  }, [request.id]);

  const handleReject = useCallback(() => setRejectOpen(true), []);
  const handleCloseReject = useCallback(() => setRejectOpen(false), []);

  return (
    <li className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <RequestSummary
          request={request}
          profile={profile}
          title={title}
          study={study}
          fullName={fullName}
        />
        <RequestActions
          status={request.status}
          busy={busy}
          onApprove={handleApprove}
          onReject={handleReject}
          onPreserve={handlePreserve}
          onRevoke={handleRevoke}
        />
      </div>

      {request.status === 'review_needed' && (
        <MaterialEditDiff
          kind={request.target_kind}
          snapshot={request.submitted_snapshot}
          current={currentRecord}
        />
      )}

      <EvidenceThumbnail evidenceUrl={evidenceUrl} />

      <RejectionDialog
        open={rejectOpen}
        busy={busy}
        userName={fullName}
        onClose={handleCloseReject}
        onConfirm={handleConfirmReject}
      />
    </li>
  );
}
