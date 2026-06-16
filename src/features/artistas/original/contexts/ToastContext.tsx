import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type Toast = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

type ToastContextValue = {
  showToast: (message: string, type?: Toast["type"]) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className={`flex items-start justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-card animate-slide-up ${
              toast.type === "error"
                ? "border-red-200 text-red-700"
                : toast.type === "success"
                  ? "border-brand-green/40 text-brand-dark"
                  : "border-brand-border text-brand-ink"
            }`}
          >
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded-lg p-1 text-brand-muted transition hover:bg-brand-bgGreen hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider");
  return context;
}
