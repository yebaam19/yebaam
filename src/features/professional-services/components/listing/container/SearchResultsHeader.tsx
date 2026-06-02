export function SearchResultsHeader({ totalResults }: { totalResults: number }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
        {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
      </h2>
    </div>
  )
}
