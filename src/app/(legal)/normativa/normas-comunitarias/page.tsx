import type { Metadata } from 'next';

import { LegalDocument } from '@/features/legal/components/LegalDocument';

// Static: body HTML is build-time generated; cookies() is empty under
// force-static so next-intl falls back to 'es', matching the Spanish-only body.
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Normas Comunitarias — YEBAAM',
  description:
    'Manual de Convivencia, Gobernanza y Reglamento de Uso de la plataforma digital YEBAAM.',
};

export default function NormasComunitariasPage() {
  return <LegalDocument slug="normas-comunitarias" />;
}
