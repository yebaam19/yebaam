type CoverImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  gradient?: boolean;
};

export function CoverImage({ src, alt = "", className = "", gradient = true }: CoverImageProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-brand-hero" />
      )}
      {gradient ? (
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/70 via-transparent to-transparent" />
      ) : null}
    </div>
  );
}
