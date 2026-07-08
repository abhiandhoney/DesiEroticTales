import { useEffect, useState } from 'react';
import { resolveStoryImageUrl } from '../lib/storyImages';
import SafeImage from './SafeImage';

interface ResolvedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export default function ResolvedImage({ src, alt, className, loading = 'lazy' }: ResolvedImageProps) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!src) {
      setResolved(null);
      return;
    }
    resolveStoryImageUrl(src).then((url) => {
      if (!cancelled) setResolved(url);
    });
    return () => { cancelled = true; };
  }, [src]);

  if (!resolved) {
    return <div className={`safe-image-fallback ${className ?? ''}`} aria-label={alt} />;
  }

  return <SafeImage src={resolved} alt={alt} className={className} loading={loading} />;
}