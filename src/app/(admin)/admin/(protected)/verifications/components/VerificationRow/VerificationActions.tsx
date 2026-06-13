import { useTranslations } from 'next-intl';

interface Props {
  pending: boolean;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}

/** Approve / reject controls for a pending request. The wrapper column always
 *  renders (it reserves the right-hand width in the row layout); the buttons
 *  only show while the request is pending. Controlled by the parent: it owns
 *  the transition state and the server-action calls. */
export function VerificationActions({ pending, busy, onApprove, onReject }: Props) {
  const t = useTranslations('admin.verifications');
  return (
    <div className="flex flex-col items-stretch gap-2 sm:w-44">
      {pending && (
        <>
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
          >
            {busy ? t('approving') : t('approve')}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-neutral-400"
          >
            {t('reject')}
          </button>
        </>
      )}
    </div>
  );
}
