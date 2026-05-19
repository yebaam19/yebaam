import { Icon } from '@iconify/react';
import type { ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Icon>, 'icon'>;

export function PawIcon(props: Props) {
  return <Icon {...props} icon="lucide:paw-print" />;
}
