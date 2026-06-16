import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import type { ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

type ToastProps = {
  message: string;
  type?: ToastType;
  onClose?: () => void;
};

const toastStyles: Record<ToastType, { bg: string; icon: ReactNode; text: string }> = {
  success: { bg: "bg-brand-greenDark", icon: <CheckCircle size={18} />, text: "text-white" },
  error:   { bg: "bg-red-600",         icon: <AlertCircle size={18} />, text: "text-white" },
  info:    { bg: "bg-brand-mintLight", icon: <Info size={18} />, text: "text-brand-ink" },
  warning: { bg: "bg-brand-gold",      icon: <AlertCircle size={18} />, text: "text-brand-ink" }
};

export function Toast({ message, type = "info", onClose }: ToastProps) {
  const style = toastStyles[type];
  return (
    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-card ${style.bg} ${style.text}`} role={type === "error" ? "alert" : "status"}>
      {style.icon}
      <span className="flex-1">{message}</span>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
