'use client';

import { type RefObject } from 'react';
import FilePreviews from '../FilePreviews';

interface EditPostMediaProps {
  previewUrls: string[];
  selectedFiles: File[];
  onRemove: (index: number) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EditPostMedia({
  previewUrls,
  selectedFiles,
  onRemove,
  fileInputRef,
  onFileSelect,
}: EditPostMediaProps) {
  return (
    <>
      {/* File Previews */}
      {selectedFiles.length > 0 && (
        <div className="px-6 pt-4">
          <FilePreviews
            previewUrls={previewUrls}
            selectedFiles={selectedFiles}
            onRemove={onRemove}
          />
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onFileSelect}
        className="hidden"
      />
    </>
  );
}
