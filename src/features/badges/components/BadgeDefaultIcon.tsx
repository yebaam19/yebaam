interface Props {
  slug?: string
  category: string
  className: string
}

/** Default icon set for `BadgeArt` — a curated SVG picked by slug (seeded
 *  badges) or category: verification → check, study → cap, sports → trophy,
 *  recognition → sparkle, pioneer → star, authentication → shield, fallback
 *  → stylized `</>`. */
export function BadgeDefaultIcon({ slug, category, className }: Props) {
  if (slug === 'verificado' || category === 'verification') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.42.005l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.79 2.79 6.795-6.889a1 1 0 0 1 1.415-.006Z"
          clipRule="evenodd"
        />
      </svg>
    )
  }
  if (slug === 'pionero' || category === 'pioneer') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 2.75 14.39 8 20 8.81l-4 3.92.94 5.49L12 15.77l-4.94 2.45L8 12.73l-4-3.92L9.61 8 12 2.75Z" />
      </svg>
    )
  }
  if (category === 'engineering') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5-4 4.5 4 4.5M17.25 7.5l4 4.5-4 4.5M14 4 10 20" />
      </svg>
    )
  }
  if (category === 'study') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    )
  }
  if (category === 'sports') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
      </svg>
    )
  }
  if (category === 'recognition') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
      </svg>
    )
  }
  if (category === 'authentication') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
          clipRule="evenodd"
        />
      </svg>
    )
  }
  // Engineer-y fallback: stylized angle brackets `</>`
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5-4 4.5 4 4.5M17.25 7.5l4 4.5-4 4.5M14 4 10 20" />
    </svg>
  )
}
