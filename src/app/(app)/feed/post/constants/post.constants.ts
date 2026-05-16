/**
 * Constantes para el módulo de Posts
 * 
 * Define colores, sentimientos, actividades y otras opciones
 * para crear/editar publicaciones
 */

import { FeelingType } from '../interfaces/post.interfaces';

/**
 * Colores de fondo para posts (estilo Facebook)
 * Solo colores sólidos hexadecimales compatibles con el backend
 */
export const BACKGROUND_COLORS = [
  {
    id: 'none',
    name: 'Sin color',
    value: '#ffffff',
    textColor: '#000000',
    preview: 'bg-white dark:bg-neutral-900',
  },
  {
    id: 'solid-red',
    name: 'Rojo',
    value: '#FF5733',
    textColor: '#ffffff',
    preview: 'bg-[#FF5733]',
  },
  {
    id: 'solid-pink',
    name: 'Rosa',
    value: '#FF69B4',
    textColor: '#ffffff',
    preview: 'bg-[#FF69B4]',
  },
  {
    id: 'solid-orange',
    name: 'Naranja',
    value: '#e67e22',
    textColor: '#ffffff',
    preview: 'bg-[#e67e22]',
  },
  {
    id: 'solid-yellow',
    name: 'Amarillo',
    value: '#f1c40f',
    textColor: '#000000',
    preview: 'bg-[#f1c40f]',
  },
  {
    id: 'solid-green',
    name: 'Verde',
    value: '#2ecc71',
    textColor: '#ffffff',
    preview: 'bg-[#2ecc71]',
  },
  {
    id: 'solid-teal',
    name: 'Verde azulado',
    value: '#1abc9c',
    textColor: '#ffffff',
    preview: 'bg-[#1abc9c]',
  },
  {
    id: 'solid-blue',
    name: 'Azul',
    value: '#3498db',
    textColor: '#ffffff',
    preview: 'bg-[#3498db]',
  },
  {
    id: 'solid-indigo',
    name: 'Índigo',
    value: '#667eea',
    textColor: '#ffffff',
    preview: 'bg-[#667eea]',
  },
  {
    id: 'solid-purple',
    name: 'Morado',
    value: '#9b59b6',
    textColor: '#ffffff',
    preview: 'bg-[#9b59b6]',
  },
  {
    id: 'solid-magenta',
    name: 'Magenta',
    value: '#A445B2',
    textColor: '#ffffff',
    preview: 'bg-[#A445B2]',
  },
  {
    id: 'solid-brown',
    name: 'Marrón',
    value: '#8B4513',
    textColor: '#ffffff',
    preview: 'bg-[#8B4513]',
  },
  {
    id: 'solid-gray',
    name: 'Gris',
    value: '#95a5a6',
    textColor: '#ffffff',
    preview: 'bg-[#95a5a6]',
  },
  {
    id: 'solid-navy',
    name: 'Azul marino',
    value: '#2c3e50',
    textColor: '#ffffff',
    preview: 'bg-[#2c3e50]',
  },
  {
    id: 'solid-crimson',
    name: 'Carmesí',
    value: '#DC143C',
    textColor: '#ffffff',
    preview: 'bg-[#DC143C]',
  },
  {
    id: 'solid-lime',
    name: 'Lima',
    value: '#32CD32',
    textColor: '#000000',
    preview: 'bg-[#32CD32]',
  },
] as const;

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

/**
 * Opciones de privacidad con iconos
 */
export const PRIVACY_OPTIONS = [
  {
    value: 'public' as const,
    label: 'Público',
    description: 'Cualquiera puede ver esta publicación',
    icon: '',
  },
  {
    value: 'friends' as const,
    label: 'Amigos',
    description: 'Solo tus amigos pueden ver',
    icon: '',
  },
  {
    value: 'private' as const,
    label: 'Solo yo',
    description: 'Solo tú puedes ver',
    icon: '',
  },
] as const;
