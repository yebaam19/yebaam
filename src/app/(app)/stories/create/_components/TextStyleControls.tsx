'use client';

import { useTranslations } from 'next-intl';
import { STORY_BACKGROUNDS } from '../../utils/colors';
import { cn } from '@/lib/utils';

type StoryBackground = (typeof STORY_BACKGROUNDS)[number];

interface Props {
  selectedBackground: StoryBackground;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  onSelectBackground: (bg: StoryBackground) => void;
  onSelectFontSize: (size: number) => void;
  onSelectTextAlign: (align: 'left' | 'center' | 'right') => void;
}

/** Styling controls for a text story: background swatches, font size, and text
 *  alignment. Fully controlled — the parent owns the values and applies them to
 *  the live preview. */
export function TextStyleControls({
  selectedBackground,
  fontSize,
  textAlign,
  onSelectBackground,
  onSelectFontSize,
  onSelectTextAlign,
}: Props) {
  const t = useTranslations('stories.create');

  return (
    <div className="space-y-5">
      {/* Fondo */}
      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-300">{t('background')}</p>
        <div className="grid grid-cols-5 gap-2">
          {STORY_BACKGROUNDS.map((bg, index) => (
            <button
              key={index}
              onClick={() => onSelectBackground(bg)}
              aria-label={t('backgroundOption', { index: index + 1 })}
              className={cn(
                'h-12 w-full rounded-lg transition',
                selectedBackground === bg
                  ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-900'
                  : 'hover:scale-105'
              )}
              style={{ background: bg.value }}
            />
          ))}
        </div>
      </div>

      {/* Tamaño */}
      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-300">{t('size')}</p>
        <div className="flex gap-2">
          {['S', 'M', 'L'].map((size, index) => (
            <button
              key={index}
              onClick={() => onSelectFontSize(index)}
              className={cn(
                'h-10 flex-1 rounded-lg font-bold transition',
                fontSize === index
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Alineación */}
      <div>
        <p className="mb-3 text-sm font-semibold text-neutral-300">{t('align')}</p>
        <div className="flex gap-2">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => onSelectTextAlign(align)}
              className={cn(
                'h-10 flex-1 rounded-lg transition',
                textAlign === align
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              )}
            >
              {align === 'left' ? '⬅' : align === 'center' ? '⬌' : '➡'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
