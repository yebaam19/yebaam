import { XMarkIcon } from '@heroicons/react/24/outline';

interface PostUploadProgressProps {
  progress: number;
}

export default function PostUploadProgress({ progress }: PostUploadProgressProps) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Subiendo archivos...
        </span>
        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
          {progress}%
        </span>
      </div>
      <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-600 dark:bg-primary-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
