import type { Metadata } from 'next';

import { LegalDocument } from '@/features/legal/components/LegalDocument';

export const metadata: Metadata = {
  title: 'Reglamento General — YEBAAM',
  description:
    'Macro Reglamento de Regulación, Gobernanza y Convivencia Digital de la plataforma YEBAAM.',
};

export default function ReglamentoPage() {
  return <LegalDocument slug="reglamento" />;
}
