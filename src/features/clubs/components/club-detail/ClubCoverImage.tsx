import Image from 'next/image';

interface ClubCoverImageProps {
  coverImageUrl?: string;
  clubName: string;
}

/**
 * Componente para la imagen de portada del club
 * Muestra un gradiente por defecto si no hay imagen
 */
export function ClubCoverImage({ coverImageUrl, clubName }: ClubCoverImageProps) {
  return (
    <div className="relative h-64 md:h-80 bg-linear-to-r from-blue-500 to-purple-500">
      {coverImageUrl && (
        <Image
          src={coverImageUrl}
          alt={`Portada de ${clubName}`}
          fill
          className="object-cover"
          unoptimized
          priority
        />
      )}
    </div>
  );
}
