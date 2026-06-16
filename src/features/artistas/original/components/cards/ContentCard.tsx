import { Link } from "react-router-dom";
import { CalendarDays, ArrowRight } from "lucide-react";
import { formatDate } from "../../lib/formatters";

export function ContentCard({
  to,
  title,
  description,
  image,
  date,
  badge
}: {
  to: string;
  title: string;
  description?: string | null;
  image?: string | null;
  date?: string | null;
  badge?: string;
}) {
  return (
    <Link
      to={to}
      className="group flex overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2"
    >
      {/* Thumbnail */}
      <div className="relative h-full w-24 shrink-0 overflow-hidden sm:w-32">
        {image ? (
          <img src={image} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-brand-hero" />
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div>
          {badge && (
            <span className="mb-1.5 inline-block text-xs font-semibold text-brand-muted uppercase tracking-wide">{badge}</span>
          )}
          <h3 className="line-clamp-2 text-sm font-black text-brand-ink leading-snug transition-colors group-hover:text-brand-greenDark">
            {title}
          </h3>
          {description && (
            <p className="mt-1.5 line-clamp-2 text-xs text-brand-muted leading-relaxed">{description}</p>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          {date && (
            <span className="flex items-center gap-1 text-xs text-brand-muted">
              <CalendarDays size={11} /> {formatDate(date)}
            </span>
          )}
          <ArrowRight size={14} className="ml-auto text-brand-greenDark opacity-0 transition group-hover:opacity-100" />
        </div>
      </div>
    </Link>
  );
}
