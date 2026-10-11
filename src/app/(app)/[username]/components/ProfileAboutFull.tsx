'use client';

import type { ComponentType, SVGProps } from 'react';

import {
AcademicCapIcon,
BriefcaseIcon,
ClockIcon,
EnvelopeIcon,
GlobeAltIcon,
HeartIcon,
HomeIcon,
MapPinIcon,
PhoneIcon
} from '@/components/icons/heroicons-shim';

import { ProfileAboutInterests } from './ProfileAboutInterests';

interface ProfileAboutFullProps {
  username: string;
  displayName: string;
  bio?: string;
  location?: string;
  work?: string;
  education?: string;
  relationship?: string;
  joinDate?: string;
  website?: string;
  phone?: string;
  email?: string;
  hometown?: string;
  languages?: string[];
  interests?: string[];
}

export default function ProfileAboutFull({
  username,
  displayName,
  bio,
  location,
  work,
  education,
  relationship,
  joinDate,
  website,
  phone,
  email,
  hometown,
  languages = ['Español', 'Inglés'],
  interests = ['Tecnología', 'Viajes', 'Fotografía', 'Música'],
}: ProfileAboutFullProps) {
  return (
    <div className="space-y-5">
      {/* About Me Section - Always visible */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
          Acerca de mí
        </h2>
        
        {bio ? (
          <div className="space-y-4">
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed text-base">
              {bio}
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                Sin información
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {displayName} aún no ha agregado una descripción sobre sí mismo
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overview */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
          Información general
        </h2>
        
        <div className="space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {location && (
              <InfoItem icon={MapPinIcon} label="Vive en" value={location} color="primary" />
            )}
            {hometown && (
              <InfoItem icon={HomeIcon} label="De" value={hometown} color="blue" />
            )}
            {relationship && (
              <InfoItem icon={HeartIcon} label="Estado" value={relationship} color="pink" />
            )}
            {joinDate && (
              <InfoItem icon={ClockIcon} label="Se unió" value={joinDate} color="green" />
            )}
          </div>
        </div>
      </div>

      {/* Work and Education */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
          Trabajo y educación
        </h2>
        
        <div className="space-y-4">
          {work && (
            <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <BriefcaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Trabaja en</p>
                <p className="font-semibold text-neutral-900 dark:text-white">{work}</p>
              </div>
            </div>
          )}
          
          {education && (
            <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
                <AcademicCapIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Estudió en</p>
                <p className="font-semibold text-neutral-900 dark:text-white">{education}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
          Información de contacto
        </h2>
        
        <div className="space-y-4">
          {email && (
            <InfoItem icon={EnvelopeIcon} label="Email" value={email} color="red" />
          )}
          {phone && (
            <InfoItem icon={PhoneIcon} label="Teléfono" value={phone} color="green" />
          )}
          {website && (
            <InfoItem icon={GlobeAltIcon} label="Sitio web" value={website} color="indigo" isLink />
          )}
        </div>
      </div>

      <ProfileAboutInterests interests={interests} languages={languages} location={location} hometown={hometown} />
    </div>
  );
}

// Helper component for info items
function InfoItem({ 
  icon: Icon, 
  label, 
  value, 
  color = 'neutral',
  isLink = false 
}: { 
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string; 
  value: string; 
  color?: string;
  isLink?: boolean;
}) {
  const colorClasses = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    neutral: 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClasses[color as keyof typeof colorClasses]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
        {isLink ? (
          <a
            href={value.startsWith('http') ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-600 dark:text-primary-400 hover:underline truncate block"
          >
            {value}
          </a>
        ) : (
          <p className="font-medium text-neutral-900 dark:text-white truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
