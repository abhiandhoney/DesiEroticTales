import { useEffect } from 'react';

interface PageMetaOptions {
  title: string;
  description?: string;
  image?: string | null;
  path?: string;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

const DEFAULT_TITLE = 'DesiEroticTales - Telugu and Desi Stories';
const DEFAULT_DESCRIPTION =
  'DesiEroticTales - Telugu and Desi erotic stories. Slow-burn tales of desire, free to read.';

export function usePageMeta({ title, description, image, path }: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = title.includes('DesiEroticTales') ? title : `${title} | DesiEroticTales`;
    const desc = description ?? DEFAULT_DESCRIPTION;
    const url = path ? `${window.location.origin}${path}` : window.location.href;
    const ogImage = image ?? `${window.location.origin}/favicon.svg`;

    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', 'article');
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta('name', 'description', DEFAULT_DESCRIPTION);
      upsertMeta('property', 'og:title', DEFAULT_TITLE);
      upsertMeta('property', 'og:description', DEFAULT_DESCRIPTION);
      upsertMeta('property', 'og:url', window.location.origin);
      upsertMeta('property', 'og:type', 'website');
      upsertMeta('property', 'og:image', `${window.location.origin}/favicon.svg`);
      upsertMeta('name', 'twitter:card', 'summary');
      upsertMeta('name', 'twitter:title', DEFAULT_TITLE);
      upsertMeta('name', 'twitter:description', DEFAULT_DESCRIPTION);
    };
  }, [title, description, image, path]);
}