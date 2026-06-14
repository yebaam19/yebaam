import { FeelingType } from '../../interfaces/post.interfaces';

/**
 * Sentimientos disponibles (estilo Facebook)
 * Label is resolved via i18n: t(`feelings.${id}`)
 */
export const FEELINGS = [
  {
    type: FeelingType.HAPPY,
    id: 'happy',
    emoji: '',
    color: '#FFD700',
    prefix: 'se siente',
  },
  {
    type: FeelingType.BLESSED,
    id: 'blessed',
    emoji: '',
    color: '#87CEEB',
    prefix: 'se siente',
  },
  {
    type: FeelingType.LOVED,
    id: 'loved',
    emoji: '',
    color: '#FF69B4',
    prefix: 'se siente',
  },
  {
    type: FeelingType.EXCITED,
    id: 'excited',
    emoji: '',
    color: '#FFA500',
    prefix: 'se siente',
  },
  {
    type: FeelingType.GRATEFUL,
    id: 'grateful',
    emoji: '',
    color: '#32CD32',
    prefix: 'se siente',
  },
  {
    type: FeelingType.SAD,
    id: 'sad',
    emoji: '',
    color: '#4682B4',
    prefix: 'se siente',
  },
  {
    type: FeelingType.ANGRY,
    id: 'angry',
    emoji: '',
    color: '#DC143C',
    prefix: 'se siente',
  },
  {
    type: FeelingType.CONFUSED,
    id: 'confused',
    emoji: '',
    color: '#A9A9A9',
    prefix: 'se siente',
  },
  {
    type: FeelingType.TIRED,
    id: 'tired',
    emoji: '',
    color: '#708090',
    prefix: 'se siente',
  },
] as const;
