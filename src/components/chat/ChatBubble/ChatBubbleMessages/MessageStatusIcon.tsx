export interface MessageStatusLabels {
  read: string;
  delivered: string;
  sent: string;
}

export function MessageStatusIcon({
  status,
  labels,
}: {
  status: string;
  labels: MessageStatusLabels;
}) {
  switch (status) {
    case 'read':
      return (
        <span className="ml-1 text-xs font-bold text-white/80" title={labels.read}>
          ✓✓
        </span>
      );
    case 'delivered':
      return (
        <span className="ml-1 text-xs font-bold text-white/70" title={labels.delivered}>
          ✓
        </span>
      );
    case 'sent':
    case 'sending':
      return (
        <span className="ml-1 text-xs font-bold text-white/60" title={labels.sent}>
          ✓
        </span>
      );
    default:
      return null;
  }
}
