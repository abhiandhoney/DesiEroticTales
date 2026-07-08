import { useState } from 'react';
import { remoteImageCrossOrigin } from '../lib/imageUrl';

interface ProfileAvatarProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProfileAvatar({ name, avatarUrl, className = '', size = 'md' }: ProfileAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  const sizeClass = `profile-avatar-img profile-avatar-${size}`;

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass} ${className}`}
        loading="lazy"
        decoding="async"
        crossOrigin={remoteImageCrossOrigin(avatarUrl)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`profile-avatar-fallback ${sizeClass} ${className}`} aria-hidden="true">
      {initial}
    </span>
  );
}