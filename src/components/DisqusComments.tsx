import { useEffect, useRef } from 'react';
import { getStoryCanonicalPath } from '../lib/slug';
import type { Story } from '../types';

declare global {
  interface Window {
    DISQUS?: {
      reset: (opts: { reload: boolean; config: () => void }) => void;
    };
  }
}

interface DisqusCommentsProps {
  story: Story;
}

export default function DisqusComments({ story }: DisqusCommentsProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shortname = import.meta.env.VITE_DISQUS_SHORTNAME;

  useEffect(() => {
    if (!shortname || !hostRef.current) return;

    const pageUrl = `${window.location.origin}${getStoryCanonicalPath(story)}`;
    const identifier = `${story.id} ${pageUrl}`;

    const load = () => {
      if (!hostRef.current) return;
      hostRef.current.innerHTML = '<div id="disqus_thread"></div>';

      window.disqus_config = function disqus_config() {
        // @ts-expect-error Disqus global config
        this.page.url = pageUrl;
        // @ts-expect-error Disqus global config
        this.page.identifier = identifier;
        // @ts-expect-error Disqus global config
        this.page.title = story.title;
      };

      if (window.DISQUS) {
        window.DISQUS.reset({ reload: true, config: () => window.disqus_config?.() });
        return;
      }

      const script = document.createElement('script');
      script.src = `https://${shortname}.disqus.com/embed.js`;
      script.async = true;
      script.setAttribute('data-timestamp', String(+new Date()));
      document.body.appendChild(script);
    };

    load();

    return () => {
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [shortname, story.id, story.title, story.category, story.slug]);

  if (!shortname) return null;

  return (
    <section className="disqus-section" aria-label="Comments">
      <h2 className="section-title">Comments</h2>
      <div ref={hostRef} />
    </section>
  );
}

declare global {
  interface Window {
    disqus_config?: () => void;
  }
}