import { FC } from 'react';
import { Page } from '../../types/page.types';
import {
  UsersIcon,
  DocumentTextIcon,
  HeartIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowDownTrayIcon,
} from '@/components/icons/heroicons-shim';

interface SettingsStatsProps {
  page: Page;
}

interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: typeof UsersIcon;
}

export const SettingsStats: FC<SettingsStatsProps> = ({ page }) => {
  // Mock stats data
  const stats: StatCard[] = [
    {
      label: 'Seguidores',
      value: page.followerCount?.toLocaleString('es-ES') || '0',
      change: '+12.5%',
      trend: 'up',
      icon: UsersIcon,
    },
    {
      label: 'Publicaciones',
      value: page.postCount?.toLocaleString('es-ES') || '0',
      change: '+8',
      trend: 'up',
      icon: DocumentTextIcon,
    },
    {
      label: 'Me gusta',
      value: '1,234',
      change: '+23.1%',
      trend: 'up',
      icon: HeartIcon,
    },
    {
      label: 'Alcance',
      value: '15.2K',
      change: '-5.2%',
      trend: 'down',
      icon: EyeIcon,
    },
  ];

  const weeklyStats = [
    { day: 'Lun', followers: 120, engagement: 45 },
    { day: 'Mar', followers: 135, engagement: 52 },
    { day: 'Mié', followers: 145, engagement: 48 },
    { day: 'Jue', followers: 160, engagement: 65 },
    { day: 'Vie', followers: 180, engagement: 72 },
    { day: 'Sáb', followers: 165, engagement: 58 },
    { day: 'Dom', followers: 155, engagement: 50 },
  ];

  const maxFollowers = Math.max(...weeklyStats.map((s) => s.followers));
  const maxEngagement = Math.max(...weeklyStats.map((s) => s.engagement));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Estadísticas
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Métricas y análisis de tu página
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <ArrowDownTrayIcon className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg">
            7 días
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            30 días
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            90 días
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            Todo el tiempo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.trend === 'up';
          const isNegative = stat.trend === 'down';

          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-2 rounded-lg ${
                    isPositive
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : isNegative
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : isNegative
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    isPositive
                      ? 'text-green-600 dark:text-green-400'
                      : isNegative
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <ArrowTrendingUpIcon
                    className={`w-3 h-3 ${
                      isNegative ? 'rotate-180' : ''
                    }`}
                  />
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-6">
          Actividad de la última semana
        </h3>

        <div className="space-y-6">
          {/* Followers Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nuevos seguidores
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {weeklyStats.reduce((sum, s) => sum + s.followers, 0)} total
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyStats.map((stat) => (
                <div key={stat.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-24">
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{
                        height: `${(stat.followers / maxFollowers) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Interacciones
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {weeklyStats.reduce((sum, s) => sum + s.engagement, 0)} total
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyStats.map((stat) => (
                <div key={stat.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-24">
                    <div
                      className="w-full bg-green-500 rounded-t"
                      style={{
                        height: `${(stat.engagement / maxEngagement) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
          Contenido más popular
        </h3>

        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  Publicación #{item}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Hace {item} días
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {(1000 - item * 100).toLocaleString('es-ES')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Me gusta
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age Groups */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
            Edad de seguidores
          </h3>
          <div className="space-y-3">
            {[
              { range: '18-24', percentage: 35 },
              { range: '25-34', percentage: 45 },
              { range: '35-44', percentage: 15 },
              { range: '45+', percentage: 5 },
            ].map((group) => (
              <div key={group.range}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {group.range} años
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {group.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${group.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-4">
            Género de seguidores
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Hombres', percentage: 48, color: 'bg-blue-600' },
              { label: 'Mujeres', percentage: 50, color: 'bg-pink-600' },
              { label: 'Otro', percentage: 2, color: 'bg-purple-600' },
            ].map((group) => (
              <div key={group.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {group.label}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {group.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${group.color} h-2 rounded-full`}
                    style={{ width: `${group.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
