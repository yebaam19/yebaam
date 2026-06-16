import { Upload } from "lucide-react";
import type { InputHTMLAttributes } from "react";

type FileUploaderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  hint?: string;
};

export function FileUploader({ label = "Seleccionar archivo", hint, className = "", ...props }: FileUploaderProps) {
  return (
    <label className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-border bg-brand-bgGreen/40 px-6 py-10 transition hover:border-brand-greenDark hover:bg-brand-mintLight/60 focus-within:border-brand-greenDark focus-within:ring-2 focus-within:ring-brand-greenDark/15 ${className}`}>
      <Upload size={28} className="mb-3 text-brand-greenDark" />
      <p className="font-semibold text-brand-ink">{label}</p>
      {hint ? <p className="mt-1 text-xs text-brand-muted">{hint}</p> : null}
      <input type="file" className="sr-only" {...props} />
    </label>
  );
}
