import { resolveImage, imageUrl } from '@/lib/media/urls';
import type { TaggedPerson } from '../types/family.types';

interface Props {
  person: TaggedPerson;
  size?: 'sm' | 'md';
}

export function PersonAvatarChip({ person, size = 'sm' }: Props) {
  const avatarSrc =
    resolveImage({ avatar_url: person.claimed_avatar_url }, 'avatar') ??
    (person.avatar_cf_image_id ? imageUrl(person.avatar_cf_image_id, 'avatar') : null);

  const dimensions = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  const text = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-zinc-100 py-0.5 pl-0.5 pr-2 ${text} text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300`}
    >
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt=""
          className={`${dimensions} flex-shrink-0 rounded-full object-cover`}
          aria-hidden
        />
      ) : (
        <span
          className={`${dimensions} flex flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[9px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300`}
          aria-hidden
        >
          {person.full_name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className="truncate">{person.full_name}</span>
    </span>
  );
}

export function PersonChipList({ persons, max = 4 }: { persons: TaggedPerson[]; max?: number }) {
  if (persons.length === 0) return null;
  const visible = persons.slice(0, max);
  const overflow = persons.length - visible.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((p) => (
        <PersonAvatarChip key={p.id} person={p} />
      ))}
      {overflow > 0 && (
        <span className="text-[11px] text-zinc-500">+{overflow} más</span>
      )}
    </div>
  );
}
