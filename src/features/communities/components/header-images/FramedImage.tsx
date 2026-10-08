import { DEFAULT_IMAGE_FRAMING, type ImageFraming } from '../../schemas/communityHeaderImage.schema';

/** Share the exact framing model between preview and saved header; never alter the original. */
export function FramedImage({ src, alt, framing = DEFAULT_IMAGE_FRAMING, priority = false, onLoad, onError }: {
  src: string; alt: string; framing?: ImageFraming; priority?: boolean;
  onLoad?: () => void; onError?: () => void;
}) {
  const position = `${framing.x}% ${framing.y}%`;
  return <img src={src} alt={alt} onLoad={onLoad} onError={onError}
    loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined}
    className="h-full w-full object-cover" style={{ objectPosition: position, transformOrigin: position, transform: `scale(${framing.zoom})` }} />;
}
