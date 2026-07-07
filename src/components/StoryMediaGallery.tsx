import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoryMediaUrls } from '../lib/storyMedia';
import type { Story } from '../types';
import SafeImage from './SafeImage';

interface StoryMediaGalleryProps {
  story: Story;
}

export default function StoryMediaGallery({ story }: StoryMediaGalleryProps) {
  const urls = getStoryMediaUrls(story);
  const [active, setActive] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0);
  }, [story.id]);

  const go = useCallback((index: number) => {
    setActive(Math.max(0, Math.min(urls.length - 1, index)));
  }, [urls.length]);

  useEffect(() => {
    if (urls.length <= 1) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') go(active + 1);
      if (e.key === 'ArrowLeft') go(active - 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go, urls.length]);

  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.querySelector(`[data-index="${active}"]`);
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [active]);

  if (urls.length === 0) return null;

  return (
    <section className="steam-gallery" aria-label="Story gallery">
      <div className="steam-gallery-main">
        <SafeImage
          key={urls[active]}
          src={urls[active]}
          alt={`${story.title} — image ${active + 1}`}
          className="steam-gallery-image"
          loading={active === 0 ? 'eager' : 'lazy'}
        />
        {urls.length > 1 && (
          <>
            <button
              type="button"
              className="steam-gallery-nav steam-gallery-prev"
              onClick={() => go(active - 1)}
              disabled={active === 0}
              aria-label="Previous image"
            >
              &#8249;
            </button>
            <button
              type="button"
              className="steam-gallery-nav steam-gallery-next"
              onClick={() => go(active + 1)}
              disabled={active === urls.length - 1}
              aria-label="Next image"
            >
              &#8250;
            </button>
            <span className="steam-gallery-counter">{active + 1} / {urls.length}</span>
          </>
        )}
      </div>

      {urls.length > 1 && (
        <div className="steam-gallery-thumbs" ref={stripRef} role="tablist" aria-label="Gallery thumbnails">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              role="tab"
              data-index={i}
              aria-selected={i === active}
              className={`steam-gallery-thumb ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}