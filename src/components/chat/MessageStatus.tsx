interface MessageStatusProps {
  status: string;
  variant?: 'bubble' | 'chat';
}

export default function MessageStatus({ status, variant = 'bubble' }: MessageStatusProps) {
  const getStatusIcon = () => {
    if (variant === 'chat') {
      // Estilos para ChatBubble (con ml-1 y colores primary)
      switch (status) {
        case 'read':
          return (
            <span className="text-xs text-primary-100 font-bold ml-1" title="Leído">
              ✓✓
            </span>
          );
        case 'delivered':
          return (
            <span className="text-xs text-primary-200 font-bold ml-1" title="Entregado">
              ✓
            </span>
          );
        case 'sent':
          return (
            <span className="text-xs text-primary-300 font-bold ml-1" title="Enviado">
              ✓
            </span>
          );
        default:
          return null;
      }
    }

    // Estilos para MessageBubble (default)
    switch (status) {
      case 'read':
        return (
          <span className="text-xs text-blue-500 font-bold" title="Leído">
            ✓✓
          </span>
        );
      case 'delivered':
        return (
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-bold" title="Entregado">
            ✓✓
          </span>
        );
      case 'sent':
        return (
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-bold" title="Enviado">
            ✓
          </span>
        );
      default:
        return null;
    }
  };

  return <div className="px-1">{getStatusIcon()}</div>;
}
