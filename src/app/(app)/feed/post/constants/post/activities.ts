import { FeelingType } from '../../interfaces/post.interfaces';

/**
 * Actividades disponibles (estilo Facebook)
 * Label is resolved via i18n: t(`activities.${id}`)
 */
export const ACTIVITIES = [
  {
    type: FeelingType.EATING,
    id: 'eating',
    emoji: '',
    placeholder: '¿Qué estás comiendo?',
    color: '#FF6347',
    prefix: 'está',
  },
  {
    type: FeelingType.DRINKING,
    id: 'drinking',
    emoji: '',
    placeholder: '¿Qué estás tomando?',
    color: '#FF1493',
    prefix: 'está',
  },
  {
    type: FeelingType.TRAVELING,
    id: 'traveling',
    emoji: '',
    placeholder: '¿A dónde viajas?',
    color: '#1E90FF',
    prefix: 'está',
  },
  {
    type: FeelingType.WATCHING,
    id: 'watching',
    emoji: '',
    placeholder: '¿Qué estás viendo?',
    color: '#9370DB',
    prefix: 'está',
  },
  {
    type: FeelingType.READING,
    id: 'reading',
    emoji: '',
    placeholder: '¿Qué estás leyendo?',
    color: '#8B4513',
    prefix: 'está',
  },
  {
    type: FeelingType.PLAYING,
    id: 'playing',
    emoji: '',
    placeholder: '¿A qué estás jugando?',
    color: '#00CED1',
    prefix: 'está',
  },
  {
    type: FeelingType.LISTENING,
    id: 'listening',
    emoji: '',
    placeholder: '¿Qué estás escuchando?',
    color: '#FF69B4',
    prefix: 'está',
  },
  {
    type: FeelingType.CELEBRATING,
    id: 'celebrating',
    emoji: '',
    placeholder: '¿Qué estás celebrando?',
    color: '#FFD700',
    prefix: 'está',
  },
  {
    type: FeelingType.WORKING,
    id: 'working',
    emoji: '',
    placeholder: '¿En qué estás trabajando?',
    color: '#696969',
    prefix: 'está',
  },
  {
    type: FeelingType.EXERCISING,
    id: 'exercising',
    emoji: '',
    placeholder: '¿Qué ejercicio haces?',
    color: '#32CD32',
    prefix: 'está',
  },
] as const;
