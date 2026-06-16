import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "No pudimos cargar esta información", description, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-500" aria-hidden="true">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-lg font-bold text-brand-ink">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-brand-muted">{description}</p> : null}
      {onRetry ? (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry}>Intentar nuevamente</Button>
        </div>
      ) : null}
    </div>
  );
}
