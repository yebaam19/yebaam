import { FC, useState, useCallback, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  PhotoIcon,
  CloudArrowUpIcon,
} from '@/components/icons/heroicons-shim';
import { useUploadPagePhoto } from '../../hooks/usePagePhotos';
import Image from 'next/image';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
}

export const UploadPhotoModal: FC<UploadPhotoModalProps> = ({
  isOpen,
  onClose,
  pageId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadPagePhoto(pageId);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('La imagen no debe superar los 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        caption: caption.trim() || undefined,
      });

      // Reset and close
      handleClose();
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setIsDragging(false);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                    Subir foto
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    disabled={uploadMutation.isPending}
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* File Upload Area */}
                  {!selectedFile ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />

                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          {isDragging ? (
                            <CloudArrowUpIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <PhotoIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            {isDragging
                              ? 'Suelta la imagen aquí'
                              : 'Arrastra una imagen o haz clic para seleccionar'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            JPG, PNG o GIF (máx. 10MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Preview */}
                      <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                        {previewUrl && (
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            sizes="(max-width: 768px) 100vw, 600px"
                            className="object-contain"
                          />
                        )}
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                          disabled={uploadMutation.isPending}
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Caption Input */}
                      <div>
                        <label
                          htmlFor="caption"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Descripción (opcional)
                        </label>
                        <textarea
                          id="caption"
                          rows={3}
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Escribe una descripción para esta foto..."
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                          maxLength={200}
                          disabled={uploadMutation.isPending}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                          {caption.length}/200
                        </p>
                      </div>
                    </>
                  )}

                  {/* Upload Progress */}
                  {uploadMutation.isPending && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Subiendo foto...
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          Procesando
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '70%' }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    disabled={uploadMutation.isPending}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedFile || uploadMutation.isPending}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadMutation.isPending ? 'Subiendo...' : 'Subir foto'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
