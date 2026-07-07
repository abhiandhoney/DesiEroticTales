import { useEffect, useRef, useState } from 'react';
import { getStoryMediaUrls } from '../lib/storyMedia';
import type { Story } from '../types';
import SafeImage from './SafeImage';

interface StoryMediaGalleryProps {
  story: Story;
}

export default function StoryMediaGallery({ story }: StoryMediaGalleryProps) {
  const urls = getStoryMediaUrls(story);
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    setActive(0);
  }, [story.id]);

  useEffect(() => {
    if (urls.length <= 1) return;

    function onKey(e: KeyboardEvent) {
      if (!focused.current) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActive((i) => Math.min(urls.length - 1, i + 1));
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [urls.length]);

  if (urls.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="story-media-gallery"
      aria-label="Story images"
      tabIndex={urls.length > 1 ? 0 : undefined}
      onFocus={() => { focused.current = true; }}
      onBlur={(e) => {
        if (!sectionRef.current?.contains(e.relatedTarget as Node)) {
          focused.current = false;
        }
      }}
    >
      <div className="media-main-stage media-main-stage-hero">
        <SafeImage
          key={urls[active]}
          src={urls[active]}
          alt={`${story.title} — image ${active + 1}`}
          className="media-main-image"
          loading={active === 0 ? 'eager' : 'lazy'}
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