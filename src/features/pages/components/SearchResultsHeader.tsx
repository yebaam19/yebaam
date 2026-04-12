import { FC } from 'react';

interface SearchResultsHeaderProps {
  totalResults: number;
}

export const SearchResultsHeader: FC<SearchResultsHeaderProps> = ({ totalResults }) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        Resultados de búsqueda
        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
          ({totalResults} páginas)
        </span>
      </h2>
    </div>
  );
};
