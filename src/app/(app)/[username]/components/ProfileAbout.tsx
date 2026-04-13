'use client';

import {
  HomeIcon,
  ClockIcon,
  UserGroupIcon,
  HeartIcon,
  BriefcaseIcon,
  AcademicCapIcon,
} from '@/components/icons/heroicons-shim';

interface ProfileAboutProps {
  bio?: string;
  location?: string;
  joinDate?: string;
  mutualFriendsCount?: number;
  relationship?: string;
  work?: string;
  education?: string;
}

export default function ProfileAbout({
  bio,
  location,
  joinDate,
  mutualFriendsCount,
  relationship,
  work,
  education,
}: ProfileAboutProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-5">
        Información
      </h2>

      <div className="space-y-4">
        {bio && (
          <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed px-1">
            {bio}
          </p>
        )}

        {bio && (location || joinDate || mutualFriendsCount || relationship || work || education) && (
          <div className="border-t border-neutral-200 dark:border-neutral-800 my-5" />
        )}

        {location && (
          <div className="flex items-start gap-3.5 text-neutral-600 dark:text-neutral-400 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <HomeIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-sm">
                Vive en{' '}
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {location}
                </span>
              </p>
            </div>
          </div>
        )}

        {work && (
          <div className="flex items-start gap-3.5 text-neutral-600 dark:text-neutral-400 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BriefcaseIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-sm">
                Trabaja en{' '}
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {work}
                </span>
              </p>
            </div>
          </div>
        )}

        {education && (
          <div className="flex items-start gap-3.5 text-neutral-600 dark:text-neutral-400 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <AcademicCapIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-sm">
                Estudió en{' '}
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {education}
                </span>
              </p>
            </div>
          </div>
        )}

        {relationship && (
          <div className="flex items-start gap-3.5 text-neutral-600 dark:text-neutral-400 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <HeartIcon className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-sm">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {relationship}
                </span>
              </p>
            </div>
          </div>
        )}

        {joinDate && (
          <div className="flex items-start gap-3.5 text-neutral-600 dark:text-neutral-400 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ClockIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-sm">
                Se unió en{' '}
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {joinDate}
                </span>
              </p>
            </div>
          </div>
        )}

        {mutualFriendsCount && mutualFriendsCount > 0 && (
          <div className="flex items-start gap-3.5 text-neutral-600 dark:text-neutral-400 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <UserGroupIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-sm">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {mutualFriendsCount}
                </span>{' '}
                amigos en común
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
