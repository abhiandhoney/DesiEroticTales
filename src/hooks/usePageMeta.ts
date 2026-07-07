import { useEffect } from 'react';
import { DEFAULT_DESCRIPTION, SITE_NAME } from '../lib/seo';

interface JsonLdObject {
  '@context'?: string;
  '@type'?: string;
  [key: string]: unknown;
}

interface PageMetaOptions {
  title: string;
  description?: string;
  image?: string | null;
  path?: string;
  type?: 'website' | 'article' | 'profile';
  canonical?: string;
  jsonLd?: JsonLdObject | JsonLdObject[];
  noIndex?: boolean;
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

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id: string, data: JsonLdObject | JsonLdObject[]) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

const DEFAULT_TITLE = `${SITE_NAME} - Telugu and Desi Stories`;

export function usePageMeta({
  title,
  description,
  image,
  path,
  type = 'website',
  canonical,
  jsonLd,
  noIndex,
}: PageMetaOptions) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const desc = description ?? DEFAULT_DESCRIPTION;
    const url = canonical ?? (path ? `${window.location.origin}${path}` : window.location.href);
    const ogImage = image ?? `${window.location.origin}/favicon.svg`;

    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertLink('canonical', url);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:image', ogImage);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', ogImage);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    if (jsonLd) {
      upsertJsonLd('page-json-ld', jsonLd);
    } else {
      document.getElementById('page-json-ld')?.remove();
    }

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMeta('name', 'description', DEFAULT_DESCRIPTION);
      upsertLink('canonical', window.location.origin);
      upsertMeta('property', 'og:title', DEFAULT_TITLE);
      upsertMeta('property', 'og:description', DEFAULT_DESCRIPTION);
      upsertMeta('property', 'og:url', window.location.origin);
      upsertMeta('property', 'og:type', 'website');
      upsertMeta('property', 'og:image', `${window.location.origin}/favicon.svg`);
      upsertMeta('name', 'twitter:card', 'summary');
      upsertMeta('name', 'twitter:title', DEFAULT_TITLE);
      upsertMeta('name', 'twitter:description', DEFAULT_DESCRIPTION);
      upsertMeta('name', 'robots', 'index, follow');
      document.getElementById('page-json-ld')?.remove();
    };
  }, [title, description, image, path, type, canonical, jsonLd, noIndex]);
}