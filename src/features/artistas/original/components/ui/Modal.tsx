import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const titleId = "modal-title";
  const panelRef = useRef<HTMLDivElement>(null);

  /* Lock scroll and trap focus */
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";

    /* Move focus into the modal */
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    /* Trap Tab / Shift+Tab */
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative w-full ${sizeClasses[size]} rounded-2xl bg-white shadow-hover animate-fade-in`}
      >
        {title ? (
          <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
            <h2 id={titleId} className="text-lg font-black text-brand-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-brand-muted transition hover:bg-brand-bgGreen hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        ) : null}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
