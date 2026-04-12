import { useState, useRef, useCallback } from 'react';
import { useProfileStore } from '../store/profile.store';

interface UseIdentificationUploadReturn {
  // Estado
  idDocument: File | null;
  idDocumentPreview: string | null;
  isUploading: boolean;
  error: string | null;
  
  // Refs
  idDocumentInputRef: React.RefObject<HTMLInputElement | null>;
  
  // Acciones
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemove: () => void;
  uploadDocument: () => Promise<string | null>;
  clearError: () => void;
}

/**
 * Hook para manejar subida de documento de identificación
 */
export function useIdentificationUpload(): UseIdentificationUploadReturn {
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const idDocumentInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage } = useProfileStore();

  /**
   * Maneja el cambio de archivo
   * Valida y genera preview
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (PNG, JPG, JPEG, WEBP)');
      return;
    }

    // Validar tamaño (max 5MB para documentos)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('El archivo es muy grande. Tamaño máximo: 5MB');
      return;
    }

    setError(null);
    setIdDocument(file);

    // Generar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setIdDocumentPreview(reader.result as string);
    };
    reader.onerror = () => {
      setError('Error al leer el archivo');
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Elimina el documento seleccionado
   */
  const handleRemove = useCallback(() => {
    setIdDocument(null);
    setIdDocumentPreview(null);
    setError(null);
    
    if (idDocumentInputRef.current) {
      idDocumentInputRef.current.value = '';
    }
  }, []);

  /**
   * Sube el documento a S3
   * @returns CloudFront URL del documento subido o null si falla
   */
  const uploadDocument = useCallback(async (): Promise<string | null> => {
    if (!idDocument) {
      setError('No hay documento seleccionado');
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {

      const cloudFrontUrl = await uploadImage(idDocument, 'idDocument');

      return cloudFrontUrl;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al subir documento';
      setError(errorMsg);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [idDocument, uploadImage]);

  /**
   * Limpia el error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    idDocument,
    idDocumentPreview,
    isUploading,
    error,
    
    // Refs
    idDocumentInputRef,
    
    // Acciones
    handleFileChange,
    handleRemove,
    uploadDocument,
    clearError,
  };
}
