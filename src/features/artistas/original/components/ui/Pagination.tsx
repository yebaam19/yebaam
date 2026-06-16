import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "../../types";

type PaginationProps = {
  meta: PaginationMeta;
  onPage: (page: number) => void;
};

export function Pagination({ meta, onPage }: PaginationProps) {
  if (meta.totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => i + 1);

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Paginación">
      <button
        type="button"
        onClick={() => onPage(meta.page - 1)}
        disabled={meta.page <= 1}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-muted transition hover:border-brand-greenDark hover:text-brand-greenDark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
        aria-label="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPage(page)}
          aria-label={`Ir a la página ${page}`}
          aria-current={page === meta.page ? "page" : undefined}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark ${
            page === meta.page
              ? "border-brand-greenDark bg-brand-greenDark text-white shadow-green"
              : "border-brand-border bg-white text-brand-muted hover:border-brand-greenDark hover:text-brand-greenDark"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPage(meta.page + 1)}
        disabled={meta.page >= meta.totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-muted transition hover:border-brand-greenDark hover:text-brand-greenDark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
        aria-label="Página siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
