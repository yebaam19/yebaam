import type { Metadata } from 'next';

import { LegalDocument } from '@/features/legal/components/LegalDocument';

// Static: body HTML is build-time generated; cookies() is empty under
// force-static so next-intl falls back to 'es', matching the Spanish-only body.
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — YEBAAM',
  description:
    'Contrato de Usuario y Términos y Condiciones de uso de la plataforma digital YEBAAM.',
};

export default function TerminosPage() {
  return <LegalDocument slug="terminos" />;
}
