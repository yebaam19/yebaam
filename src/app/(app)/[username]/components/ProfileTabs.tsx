'use client';

import { cn } from '@/lib/utils';
import {
  HomeIcon,
  UserIcon,
  UserGroupIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

export type ProfileTab = 'posts' | 'about' | 'friends' | 'photos' | 'videos';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const tabs: { id: ProfileTab; label: string; icon: typeof HomeIcon }[] = [
  { id: 'posts', label: 'Publicaciones', icon: HomeIcon },
  { id: 'about', label: 'Información', icon: UserIcon },
  { id: 'friends', label: 'Amigos', icon: UserGroupIcon },
  { id: 'photos', label: 'Fotos', icon: PhotoIcon },
  { id: 'videos', label: 'Videos', icon: VideoCameraIcon },
];

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="border-b border-neutral-200 dark:border-neutral-800 sticky top-14 z-20 backdrop-blur-md bg-white/80 dark:bg-neutral-900/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-2.5 px-6 py-4 font-semibold text-sm transition-all whitespace-nowrap group",
                  isActive
                    ? "text-primary-600 dark:text-primary-500"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-all",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )} />
                {tab.label}
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary-400 via-primary-600 to-primary-400 rounded-full" />
                )}
                
                {/* Hover background */}
                {!isActive && (
                  <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
