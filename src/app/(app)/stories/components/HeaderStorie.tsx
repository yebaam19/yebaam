'use client';

import {

  CheckIcon,
  ArrowLeftIcon,
} from '@/components/icons/heroicons-shim';

import Avatar from '@/ui/Avatar';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import {useState } from 'react';
import { toast } from 'sonner';
import { StoryType } from '../interfaces/stories.interfaces';

const HeaderStorie = () => {
      const router = useRouter();
      const { user } = useAuth();

// Estados principales
  const [storyType, setStoryType] = useState<StoryType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [textContent, setTextContent] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);

  // Manejadores
  const handleBack = () => {
    if (confirm('¿Descartar esta historia?')) {
      router.back();
    }
  };



  const handlePublish = async () => {
    if (isUploading) return;

    if (storyType === 'text' && !textContent.trim()) {
      toast.error('Escribe algo para tu historia');
      return;
    }

    if ((storyType === 'image' || storyType === 'video') && !selectedFile) {
      toast.error('Selecciona un archivo');
      return;
    }

    setIsUploading(true);

    try {
      // TODO: Implementar llamada al backend
      // const formData = new FormData();
      // formData.append('type', storyType);
      // if (selectedFile) formData.append('file', selectedFile);
      // if (storyType === 'text') {
      //   formData.append('content', textContent);
      //   formData.append('background', selectedBackground.value);
      //   formData.append('fontSize', FONT_SIZES[fontSize]);
      //   formData.append('fontStyle', fontStyle.className);
      //   formData.append('textAlign', textAlign);
      // }
      // await createStory(formData);

      // Simulación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Historia publicada exitosamente');
      router.push('/feed');
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error('Error al publicar la historia');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return null;
  return (
 <div className="absolute top-0 left-0 right-0 z-10 bg-linear-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeftIcon className="h-6 w-6" />
            <span className="font-medium">Atrás</span>
          </button>
          
          <div className="flex items-center gap-3">
            <Avatar
              src={user.avatar}
              className="size-10 ring-2 ring-white"
              initials={user.username?.slice(0, 2).toUpperCase() || 'U'}
            />
            <div className="text-white">
              <p className="font-semibold">{user.firstName || user.username}</p>
              <p className="text-xs opacity-80">Ahora</p>
            </div>
          </div>

          <button
            onClick={handlePublish}
            disabled={isUploading || (storyType === 'text' && !textContent.trim())}
            className="rounded-full bg-primary-600 px-6 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5" />
                <span>Publicar</span>
              </>
            )}
          </button>
        </div>
      </div>
  )
}

export default HeaderStorie