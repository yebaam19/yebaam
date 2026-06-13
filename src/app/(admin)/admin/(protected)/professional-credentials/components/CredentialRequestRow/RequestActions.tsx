'use client';

type Status = 'pending' | 'review_needed' | 'approved' | 'rejected';

interface Props {
  status: Status;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onPreserve: () => void;
  onRevoke: () => void;
}

export default function RequestActions({
  status,
  busy,
  onApprove,
  onReject,
  onPreserve,
  onRevoke,
}: Props) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:w-44">
      {status === 'pending' && (
        <>
          <button
            type="button"
            onClick={onApprove}
            disabled={busy}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
          >
            {busy ? '...' : 'Aprobar'}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={busy}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-neutral-400"
          >
            Rechazar
          </button>
        </>
      )}
      {status === 'review_needed' && (
        <>
          <button
            type="button"
            onClick={onPreserve}
            disabled={busy}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:bg-neutral-400"
          >
            {busy ? '...' : 'Preservar'}
          </button>
          <button
            type="button"
            onClick={onRevoke}
            disabled={busy}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-neutral-400"
          >
            Revocar
          </button>
        </>
      )}
    </div>
  );
}
