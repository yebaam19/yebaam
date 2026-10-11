import { ComingSoonPanel } from '@/features/communities/components/ComingSoonPanel';
import { TagIcon } from '@/components/icons/heroicons-shim';

export default function CommunityClassifiedsPage() {
  return (
    <ComingSoonPanel
      title="Clasificados"
      description="Compra, vende o intercambia entre los miembros. Próximamente."
      icon={TagIcon}
    />
  );
}
