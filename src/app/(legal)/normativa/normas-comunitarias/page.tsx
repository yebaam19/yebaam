import type { Metadata } from 'next';

import { LegalDocument } from '@/features/legal/components/LegalDocument';

export const metadata: Metadata = {
  title: 'Normas Comunitarias — YEBAAM',
  description:
    'Manual de Convivencia, Gobernanza y Reglamento de Uso de la plataforma digital YEBAAM.',
};

export default function NormasComunitariasPage() {
  return <LegalDocument slug="normas-comunitarias" />;
}
