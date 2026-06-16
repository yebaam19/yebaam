import { Link } from "react-router-dom";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import type { Opportunity } from "../../types";
import { formatDate } from "../../lib/formatters";
import { Badge } from "../ui/Badge";
import { StatusBadge } from "../ui/StatusBadge";

const OPP_TYPE_MAP: Record<string, string> = {
  CASTING: "Casting", AUDITION: "Audición", COLLABORATION: "Colaboración",
  JOB: "Empleo", FESTIVAL: "Festival", EXHIBITION: "Exhibición",
  CONTEST: "Concurso", CULTURAL_CALL: "Convocatoria", BRAND_CAMPAIGN: "Campaña de marca", OTHER: "Otra"
};

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="group rounded-2xl border border-brand-border bg-white shadow-card transition duration-200 hover:shadow-hover hover:-translate-y-0.5 overflow-hidden">
      {/* Orange accent top bar */}
      <div className="h-1 bg-gradient-to-r from-brand-orange to-brand-gold" />
      <div className="p-5">
        {/* Badges */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Badge variant="orange">{OPP_TYPE_MAP[opportunity.type] ?? opportunity.type}</Badge>
          {opportunity.isFeatured && <Badge variant="gold">Destacada</Badge>}
          <StatusBadge status={opportunity.status} />
        </div>

        {/* Title */}
        <Link
          to={`/opportunities/${opportunity.slug}`}
          className="text-base font-black text-brand-ink leading-snug hover:text-brand-greenDark transition-colors line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
        >
          {opportunity.title}
        </Link>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-sm text-brand-muted leading-relaxed">
          {opportunity.description}
        </p>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-brand-muted">
          {opportunity.city && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-brand-orange" />
              {opportunity.city}
            </span>
          )}
          {opportunity.deadline && (
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} className="text-brand-orange" />
              Cierra {formatDate(opportunity.deadline)}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/opportunities/${opportunity.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-bold text-brand-greenDark transition hover:gap-2.5 hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
        >
          Ver oportunidad <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
