import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export default function SafeImage({ src, alt, className, loading = 'lazy' }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className={`safe-image-fallback ${className ?? ''}`} aria-label={alt} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}