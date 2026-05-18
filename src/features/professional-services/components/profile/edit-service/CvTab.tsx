'use client';

import { CVUploader } from '../CVUploader';
import type { UseEditServiceForm } from './useEditServiceForm';

interface Props {
  cv: UseEditServiceForm['cv'];
  upload: UseEditServiceForm['uploads']['cv'];
}

export function CvTab({ cv, upload }: Props) {
  return (
    <div className="space-y-6 py-4">
      <CVUploader
        currentCvUrl={cv.cvUrl}
        onCvSelect={cv.onCvSelect}
        onCvUrlChange={cv.onCvUrlChange}
        isUploading={upload.isUploading}
        uploadProgress={upload.progress}
      />
    </div>
  );
}
