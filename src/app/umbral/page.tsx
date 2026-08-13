import type { Metadata } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import Link from 'next/link';

import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { CelestialAlphabetLegend, CelestialText } from '@/features/umbral/celestial/CelestialText';
import { ClaveExperience } from '@/features/umbral/components/ClaveExperience';
import { UmbralGate } from '@/features/umbral/components/clave/UmbralGate';
import { ShareLink } from '@/features/umbral/components/ShareLink';
import {
  UMBRAL_HEADING,
  UMBRAL_META_DESCRIPTION,
  UMBRAL_META_TITLE,
  UMBRAL_PRIVACY_LINE,
  UMBRAL_PRIVACY_LINK_HREF,
  UMBRAL_PRIVACY_LINK_LABEL,
  UMBRAL_SHARE_LINE,
  UMBRAL_WARNING,
} from '@/features/umbral/constants';

// The page steps outside the app's visual system on purpose: crossing the
// threshold should feel like leaving Yebaam. Engraved serif instead of
// Poppins, near-black instead of white, and the angelic script as the only
// headline. See src/features/umbral/constants.ts for the whole brief.
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: UMBRAL_META_TITLE,
  description: UMBRAL_META_DESCRIPTION,
  openGraph: {
    title: UMBRAL_META_TITLE,
    description: UMBRAL_META_DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: UMBRAL_META_TITLE,
    description: UMBRAL_META_DESCRIPTION,
  },
};

export default async function UmbralPage() {
  const user = await getCachedAuthUser();

  return (
    <main
      className={`${cormorant.className} relative min-h-dvh overflow-hidden bg-[#050507] text-neutral-200`}
    >
      {/* Faint emerald halo — the door glows the brand's green, barely. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 45% at 50% 28%, rgba(34, 165, 76, 0.08), transparent 70%)',
        }}
      />
      {/* Ghost ring echoing the glyphs' terminal rings. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[30%] left-1/2 h-130 w-130 max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/4"
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col items-center px-6 py-16 sm:py-20">
        <header className="flex flex-col items-center gap-10 text-center">
          <h1 className="m-0">
            <CelestialText
              text={UMBRAL_HEADING}
              label="Inscripción en alfabeto angélico"
              glyphClassName="h-10 w-10 sm:h-12 sm:w-12"
              inscribeStepMs={170}
              className="inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-neutral-100 drop-shadow-[0_0_20px_rgba(167,243,208,0.14)]"
            />
          </h1>
          <p className="max-w-md text-base leading-relaxed text-neutral-500 italic sm:text-lg">
            {UMBRAL_WARNING}
          </p>
        </header>

        {/* Entering obliges a profile: anonymous visitors get the gate, never
            the clave form. The route stays public in the proxy so shared links
            keep their OG preview and this lore shell — the obligation lives
            here and in the pronounceClave action. */}
        <section className="mt-14 w-full">
          {user ? <ClaveExperience /> : <UmbralGate />}
        </section>

        <section className="mt-16 flex flex-col items-center gap-4">
          <ShareLink />
          <p className="max-w-sm text-center text-sm leading-relaxed text-neutral-600 italic">
            {UMBRAL_SHARE_LINE}
          </p>
        </section>

        <div aria-hidden="true" className="mt-20 h-px w-24 bg-neutral-800/70" />

        <CelestialAlphabetLegend className="mt-10 w-full max-w-xl opacity-55" />

        {/* Aviso de tratamiento de datos — lore-toned, legally load-bearing. */}
        <p className="mt-12 max-w-sm text-center text-[11px] leading-relaxed text-neutral-600">
          {UMBRAL_PRIVACY_LINE}{' '}
          <a
            href={UMBRAL_PRIVACY_LINK_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-neutral-700 underline-offset-2 transition-colors hover:text-neutral-400"
          >
            {UMBRAL_PRIVACY_LINK_LABEL}
          </a>
        </p>

        <footer className="mt-16 pb-4">
          <Link
            href="/"
            className="text-[10px] tracking-[0.5em] text-neutral-700 uppercase transition-colors hover:text-neutral-400"
          >
            yebaam
          </Link>
        </footer>
      </div>
    </main>
  );
}
