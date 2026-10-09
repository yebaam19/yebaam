import type { CSSProperties } from 'react';
import type { CommunityTheme } from '../types/communityTheme.types';

const PRIMARY = { green: 'var(--color-primary-800)', forest: 'var(--color-primary-900)' } as const;
const SECONDARY = { gold: 'var(--color-secondary-100)', amber: 'var(--color-secondary-400)' } as const;

export function communityThemeStyle(theme: CommunityTheme): CSSProperties {
  return {
    '--community-primary': PRIMARY[theme.primary_color],
    '--community-secondary': SECONDARY[theme.secondary_color],
  } as CSSProperties;
}
