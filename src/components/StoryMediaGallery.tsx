import { useEffect, useState } from 'react';
import { getStoryMediaUrls } from '../lib/storyMedia';
import type { Story } from '../types';

interface StoryMediaGalleryProps {
  story: Story;
}

export default function StoryMediaGallery({ story }: StoryMediaGalleryProps) {
  const urls = getStoryMediaUrls(story);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [story.id]);

  useEffect(() => {
    if (urls.length <= 1) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setActive((i) => Math.min(urls.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setActive((i) => Math.max(0, i - 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [urls.length]);

  if (urls.length === 0) return null;

  return (
    <section className="story-media-gallery" aria-label="Story images">
      <div className="media-main-stage media-main-stage-hero">
        <img
          key={urls[active]}
          src={urls[active]}
          alt={`${story.title} — image ${active + 1}`}
          className="media-main-image"
          loading={active === 0 ? 'eager' : 'lazy'}
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {urls.length > 1 && (
          <span className="media-counter">
            {active + 1} / {urls.length}
          </span>
        )}
      </div>
      {urls.length > 1 && (
        <div className="media-thumb-strip media-thumb-strip-hero" role="tablist">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`media-thumb ${i === active ? 'active' : ''}`}
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