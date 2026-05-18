'use client';

import { ProjectsManager } from '../ProjectsManager';
import type { UseEditServiceForm } from './useEditServiceForm';

interface Props {
  portfolio: UseEditServiceForm['portfolio'];
}

export function ProjectsTab({ portfolio }: Props) {
  return (
    <div className="space-y-6 py-4">
      <ProjectsManager projects={portfolio.projects} onChange={portfolio.setProjects} />
    </div>
  );
}
