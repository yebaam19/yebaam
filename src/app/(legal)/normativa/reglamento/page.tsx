import type { Metadata } from 'next';

import { LegalDocument } from '@/features/legal/components/LegalDocument';

// Static: body HTML is build-time generated; cookies() is empty under
// force-static so next-intl falls back to 'es', matching the Spanish-only body.
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Reglamento General — YEBAAM',
  description:
    'Macro Reglamento de Regulación, Gobernanza y Convivencia Digital de la plataforma YEBAAM.',
};

export default function ReglamentoPage() {
  return <LegalDocument slug="reglamento" />;
}
