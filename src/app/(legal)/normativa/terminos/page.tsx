import type { Metadata } from 'next';

import { LegalDocument } from '@/features/legal/components/LegalDocument';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — YEBAAM',
  description:
    'Contrato de Usuario y Términos y Condiciones de uso de la plataforma digital YEBAAM.',
};

export default function TerminosPage() {
  return <LegalDocument slug="terminos" />;
}
