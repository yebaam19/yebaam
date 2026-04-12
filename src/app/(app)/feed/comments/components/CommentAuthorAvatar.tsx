import Avatar from '@/ui/Avatar';
import { getUserInitials } from '@/lib/user-helpers';

interface CommentAuthorAvatarProps {
  src?: string | null;
  username?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Avatar del usuario que está escribiendo el comentario
 * Componente simple y reutilizable
 */
export function CommentAuthorAvatar({ 
  src, 
  username,
  alt = 'Usuario',
  className = 'w-8 h-8'
}: CommentAuthorAvatarProps) {
  const initials = getUserInitials(username);
  
  return (
    <div className="shrink-0">
      <Avatar 
        src={src} 
        initials={initials}
        alt={alt}
        className={className}
      />
    </div>
  );
}
