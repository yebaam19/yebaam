// Decorative SVG primitives shared across the certificate regions.
// All purely presentational (server components, no interactivity).

export function Diamond() {
  return (
    <svg viewBox="0 0 14 14" className="h-3 w-3 text-[#c8a86a]" aria-hidden>
      <rect x="3" y="3" width="8" height="8" transform="rotate(45 7 7)" fill="currentColor" />
    </svg>
  );
}

export function Guilloche() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1400 1000">
        <defs>
          <pattern id="weave" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 0 7 L 14 7 M 7 0 L 7 14" stroke="#0f3d2a" strokeWidth="0.3" opacity="0.05" />
          </pattern>
          <pattern id="diagonal" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="20" stroke="#0f3d2a" strokeWidth="0.3" opacity="0.04" />
          </pattern>
        </defs>
        <rect width="1400" height="1000" fill="url(#weave)" />
        <rect width="1400" height="1000" fill="url(#diagonal)" />
        <g stroke="#0f3d2a" strokeWidth="0.4" fill="none" opacity="0.08">
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={`l${i}`} cx="-60" cy="500" r={140 + i * 18} />
          ))}
        </g>
        <g stroke="#0f3d2a" strokeWidth="0.4" fill="none" opacity="0.08">
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={`r${i}`} cx="1460" cy="500" r={140 + i * 18} />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function IdCardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="9" cy="12" r="2" />
      <line x1="14" y1="10" x2="18" y2="10" />
      <line x1="14" y1="13" x2="18" y2="13" />
      <line x1="6" y1="16" x2="13" y2="16" />
    </svg>
  );
}

export function CalendarLineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
      <line x1="8" y1="3" x2="8" y2="6" />
      <line x1="16" y1="3" x2="16" y2="6" />
    </svg>
  );
}

export function ShieldLineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5" aria-hidden>
      <path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function LockMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden>
      <path
        fillRule="evenodd"
        d="M12 1.5A4.5 4.5 0 0 0 7.5 6v3h-1A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9h-1V6A4.5 4.5 0 0 0 12 1.5Zm-3 7.5V6a3 3 0 1 1 6 0v3H9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
