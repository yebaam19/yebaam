import { DocumentTextIcon } from '@/components/icons/heroicons-shim';
import type { FamilyStoryRow } from '../types/family.types';

export function TimelineStoryCard({ story }: { story: FamilyStoryRow }) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <DocumentTextIcon className="h-3.5 w-3.5" />
          <span>Historia</span>
        </div>
        <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {story.title}
        </h3>
        <p className="mt-3 whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
          {story.body}
        </p>
      </div>
    </article>
  );
}
