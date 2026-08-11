import Link from 'next/link';
import {
  UMBRAL_GATE_BODY,
  UMBRAL_GATE_LOGIN_CTA,
  UMBRAL_GATE_SIGNUP_CTA,
  UMBRAL_GATE_TITLE,
  UMBRAL_PATH,
} from '../../constants';

/**
 * Shown when an anonymous visitor tries to pronounce a clave. The redirect
 * param rides the whole signup → verify-email → login chain, so after
 * creating a profile the visitor lands back at this exact door.
 */
export function UmbralGate({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="animate-fade-in flex flex-col items-center gap-7 text-center">
      <h2 className="max-w-md text-2xl leading-snug text-neutral-100 sm:text-3xl">
        {UMBRAL_GATE_TITLE}
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-neutral-400">{UMBRAL_GATE_BODY}</p>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <Link
          href={{ pathname: '/signup', query: { redirect: UMBRAL_PATH } }}
          className="rounded-full border border-emerald-900 px-9 py-2.5 text-xs tracking-[0.35em] text-emerald-200 uppercase transition-all duration-500 hover:border-emerald-700 hover:shadow-[0_0_28px_-8px_rgba(34,165,76,0.5)]"
        >
          {UMBRAL_GATE_SIGNUP_CTA}
        </Link>
        <Link
          href={{ pathname: '/login', query: { redirect: UMBRAL_PATH } }}
          className="text-xs tracking-[0.3em] text-neutral-500 uppercase underline-offset-4 transition-colors hover:text-neutral-300 hover:underline"
        >
          {UMBRAL_GATE_LOGIN_CTA}
        </Link>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="text-[10px] tracking-[0.4em] text-neutral-600 uppercase transition-colors hover:text-neutral-400"
      >
        No todavía
      </button>
    </div>
  );
}
