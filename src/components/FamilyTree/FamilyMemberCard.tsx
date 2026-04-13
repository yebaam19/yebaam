'use client';

import { FamilyMember } from './types';
import { UserIcon, CalendarIcon, HeartIcon, PencilIcon, PlusIcon } from '@/components/icons/heroicons-shim';
import { HeartIcon as HeartIconSolid } from '@/components/icons/heroicons-shim';
import Image from 'next/image';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit?: (member: FamilyMember) => void;
  onAddRelative?: (memberId: string) => void;
  isHighlighted?: boolean;
}

export function FamilyMemberCard({
  member,
  onEdit,
  onAddRelative,
  isHighlighted = false,
}: FamilyMemberCardProps) {
  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'female':
        return 'border-pink-400 bg-pink-50 dark:bg-pink-900/20';
      default:
        return 'border-purple-400 bg-purple-50 dark:bg-purple-900/20';
    }
  };

  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      self: 'Tú',
      parent: 'Padre/Madre',
      grandparent: 'Abuelo/a',
      child: 'Hijo/a',
      grandchild: 'Nieto/a',
      sibling: 'Hermano/a',
      spouse: 'Cónyuge',
    };
    return labels[relationship] || relationship;
  };

  return (
    <div
      className={`
        relative group
        rounded-lg border-2 p-3
        transition-all duration-300 hover:shadow-lg
        ${getGenderColor(member.gender)}
        ${isHighlighted ? 'ring-4 ring-yellow-400 scale-105' : ''}
        w-[180px]
      `}
    >
      {/* Photo */}
      <div className="flex justify-center mb-2">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <UserIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-center font-bold text-sm text-gray-900 dark:text-white mb-1 truncate">
        {member.name}
      </h3>

      {/* Relationship Badge */}
      <div className="flex justify-center mb-1">
        <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
          {getRelationshipLabel(member.relationship)}
        </span>
      </div>

      {/* Birth/Death Years */}
      {member.birthYear && (
        <div className="flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 gap-1 mb-2">
          <CalendarIcon className="w-4 h-4" />
          <span>
            {member.birthYear}
            {member.deathYear && ` - ${member.deathYear}`}
          </span>
        </div>
      )}

      {/* Actions - appear on hover */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={() => onEdit(member)}
            className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Editar"
          >
            <PencilIcon className="w-3 h-3 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        {onAddRelative && (
          <button
            onClick={() => onAddRelative(member.id)}
            className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Agregar familiar"
          >
            <PlusIcon className="w-3 h-3 text-gray-700 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Spouse indicator */}
      {member.spouse && (
        <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
          <HeartIconSolid className="w-5 h-5 text-red-500" />
        </div>
      )}
    </div>
  );
}
