import { BriefcaseIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface WorkEducationTabProps {
  formData: {
    work?: string;
    education?: string;
  };
  onFormChange: (updates: Partial<WorkEducationTabProps['formData']>) => void;
}

export function WorkEducationTab({
  formData,
  onFormChange,
}: WorkEducationTabProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <BriefcaseIcon className="w-5 h-5 text-primary-600" />
          Trabajo
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Empresa o cargo actual
            </label>
            <input
              type="text"
              value={formData.work || ''}
              onChange={(e) => onFormChange({ work: e.target.value })}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
              placeholder="Ej: Ingeniero de Software en Google"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-5">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-blue-600" />
          Educación
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Universidad o instituto
            </label>
            <input
              type="text"
              value={formData.education || ''}
              onChange={(e) => onFormChange({ education: e.target.value })}
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-neutral-900 dark:text-white"
              placeholder="Ej: Universidad Nacional de Colombia"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
