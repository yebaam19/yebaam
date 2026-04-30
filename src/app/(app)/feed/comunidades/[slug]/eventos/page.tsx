import { ComingSoonPanel } from '@/features/communities/components/ComingSoonPanel';
import { CalendarDaysIcon } from '@/components/icons/heroicons-shim';

export default function CommunityEventsPage() {
  return (
    <ComingSoonPanel
      title="Eventos"
      description="Calendario de eventos y meetups de la comunidad. Próximamente."
      icon={CalendarDaysIcon}
    />
  );
}
