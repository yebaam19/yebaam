'use client';

import { CakeIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';

interface Birthday {
  id: string;
  name: string;
  avatar: string;
  date: string;
}

interface BirthdaysSectionProps {
  birthdays: Birthday[];
}

export default function BirthdaysSection({ birthdays }: BirthdaysSectionProps) {
  if (birthdays.length === 0) return null;

  return (
    <section className="rounded-lg bg-linear-to-br from-purple-50 to-pink-50 p-4 dark:from-purple-900/20 dark:to-pink-900/20">
      <div className="mb-3 flex items-center gap-2">
        <CakeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          Cumpleaños
        </h3>
      </div>
      <div className="space-y-2">
        {birthdays.map((birthday) => (
          <div key={birthday.id} className="flex items-center gap-3">
            <Avatar
              className="h-8 w-8"
              src={birthday.avatar}
              initials={birthday.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            />
            <div className="flex-1">
              <p className="text-sm text-neutral-900 dark:text-white">
                <span className="font-medium">{birthday.name}</span> cumple años {birthday.date.toLowerCase()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
