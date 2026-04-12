import { FC } from 'react';
import {
  CheckBadgeIcon,
  ShieldCheckIcon,
  StarIcon,
  TrophyIcon,
  HeartIcon,
  FireIcon,
  BoltIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';

interface PageDetailBadgesProps {
  pageId: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: typeof CheckBadgeIcon;
  color: string;
  bgColor: string;
  earned: boolean;
  earnedDate?: Date;
  requirement?: string;
}

// Mock badges data
const mockBadges: Badge[] = [
  {
    id: '1',
    name: 'Verificado',
    description: 'Página verificada por la plataforma',
    icon: CheckBadgeIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    earned: true,
    earnedDate: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Confiable',
    description: 'Más de 100 valoraciones positivas',
    icon: ShieldCheckIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    earned: true,
    earnedDate: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Popular',
    description: 'Más de 1,000 seguidores',
    icon: StarIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    earned: true,
    earnedDate: new Date('2024-03-01'),
  },
  {
    id: '4',
    name: 'Campeón Local',
    description: 'Top 10 en la categoría local',
    icon: TrophyIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    earned: true,
    earnedDate: new Date('2024-03-10'),
  },
  {
    id: '5',
    name: 'Favorito de la Comunidad',
    description: 'Más de 500 "me gusta" en publicaciones',
    icon: HeartIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    earned: false,
    requirement: '350/500 me gusta',
  },
  {
    id: '6',
    name: 'En Racha',
    description: 'Publicaciones diarias durante 30 días',
    icon: FireIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    earned: false,
    requirement: '23/30 días',
  },
  {
    id: '7',
    name: 'Respuesta Rápida',
    description: 'Responde en menos de 1 hora',
    icon: BoltIcon,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    earned: true,
    earnedDate: new Date('2024-02-01'),
  },
  {
    id: '8',
    name: 'Innovador',
    description: 'Primera página en usar nuevas funciones',
    icon: SparklesIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    earned: false,
    requirement: 'Usa 3 funciones más',
  },
];

export const PageDetailBadges: FC<PageDetailBadgesProps> = ({ pageId }) => {
  const earnedBadges = mockBadges.filter((b) => b.earned);
  const notEarnedBadges = mockBadges.filter((b) => !b.earned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <TrophyIcon className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Insignias y logros
          </h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {earnedBadges.length} de {mockBadges.length} insignias obtenidas
        </p>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
              style={{
                width: `${(earnedBadges.length / mockBadges.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Earned Badges */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Insignias obtenidas
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {earnedBadges.map((badge) => {
            const Icon = badge.icon;

            return (
              <div
                key={badge.id}
                className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-16 h-16 ${badge.bgColor} rounded-full flex items-center justify-center mb-3`}
                >
                  <Icon className={`w-8 h-8 ${badge.color}`} />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-1">
                  {badge.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                  {badge.description}
                </p>
                {badge.earnedDate && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {badge.earnedDate.toLocaleDateString('es-ES', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges in Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          En progreso
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {notEarnedBadges.map((badge) => {
            const Icon = badge.icon;

            return (
              <div
                key={badge.id}
                className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg opacity-60"
              >
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mb-3">
                  <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-1">
                  {badge.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                  {badge.description}
                </p>
                {badge.requirement && (
                  <div className="w-full">
                    <p className="text-xs text-center text-blue-600 dark:text-blue-400 mb-1">
                      {badge.requirement}
                    </p>
                    <div className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{
                          width: badge.requirement.includes('/')
                            ? `${
                                (parseInt(badge.requirement.split('/')[0]) /
                                  parseInt(badge.requirement.split('/')[1])) *
                                100
                              }%`
                            : '0%',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <strong>💡 ¿Sabías que...?</strong> Las insignias ayudan a generar
          confianza en la comunidad y pueden aumentar tu visibilidad en las
          búsquedas.
        </p>
      </div>
    </div>
  );
};
