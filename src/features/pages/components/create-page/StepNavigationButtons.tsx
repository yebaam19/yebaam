import { FC } from 'react';

interface StepNavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export const StepNavigationButtons: FC<StepNavigationButtonsProps> = ({
  onBack,
  onNext,
  isLoading,
}) => {
  return (
    <div className="flex justify-between pt-4">
      <button
        onClick={onBack}
        disabled={isLoading}
        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Atrás
      </button>
      <button
        onClick={onNext}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Subiendo...</span>
          </>
        ) : (
          'Siguiente'
        )}
      </button>
    </div>
  );
};
