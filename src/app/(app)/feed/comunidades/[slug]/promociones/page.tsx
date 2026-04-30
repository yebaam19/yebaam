import { ComingSoonPanel } from '@/features/communities/components/ComingSoonPanel';
import { MegaphoneIcon } from '@/components/icons/heroicons-shim';

export default function CommunityPromotionsPage() {
  return (
    <ComingSoonPanel
      title="Promociones"
      description="Ofertas y promociones exclusivas para miembros. Próximamente."
      icon={MegaphoneIcon}
    />
  );
}
