import { DocumentIcon } from '@/components/icons/heroicons-shim';
import type { FamilyDocKind, FamilyDocumentRow } from '../types/family.types';
import { DocumentDownloadButton } from './DocumentDownloadButton';

const DOC_KIND_LABEL: Record<FamilyDocKind, string> = {
  birth_cert: 'Acta de nacimiento',
  marriage_cert: 'Acta de matrimonio',
  death_cert: 'Acta de defunción',
  id: 'Identificación',
  letter: 'Carta',
  other: 'Otro',
};

export function TimelineDocumentCard({ document }: { document: FamilyDocumentRow }) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-4 p-4 sm:p-5">
        <div
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          aria-hidden
        >
          <DocumentIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500">{DOC_KIND_LABEL[document.kind]}</p>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {document.title}
          </h3>
        </div>
        <DocumentDownloadButton documentId={document.id} />
      </div>
    </article>
  );
}
