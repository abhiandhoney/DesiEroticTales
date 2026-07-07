#!/usr/bin/env node
/**
 * Post-build SEO: robots.txt, sitemap.xml, and prerendered HTML for crawlers.
 * Requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (+ optional VITE_SITE_URL).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

function loadEnv() {
  const envPath = path.join(root, '.env');
  const productionPath = path.join(root, '.env.production');
  const vars = {};
  for (const file of [envPath, productionPath]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) vars[m[1]] = m[2].trim();
    }
  }
  return vars;
}

const CATEGORY_SLUG_MAP = {
  Aunty: 'aunty-sex-stories',
  'Akka-Chelli': 'anna-chellelu',
  'Amma-Koduku': 'amma-koduku',
  Friend: 'friend-pellam',
  Office: 'office-sex',
  Fantasy: 'fantasy',
  Neighbor: 'pakkinti-valu',
  Cousin: 'cousin',
  College: 'college',
  MILF: 'milf',
  'Pakkinti Valu': 'pakkinti-valu',
  Panimanishi: 'panimanishi',
  'Pinni-Pedhamma': 'pinni-pedhamma-dengudu',
  Maradhalu: 'maradhalu',
  Vadhina: 'vadhina',
  Gumpu: 'gumpu-dengudu',
  Yavannam: 'yavannam',
  Audio: 'audio-telugu-sex-stories',
  Photos: 'telugu-sex-photos',
  Other: 'telugu-sex-stories',
};

function categoryToSlug(category) {
  return CATEGORY_SLUG_MAP[category] ?? category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readDistShell() {
  const indexPath = path.join(dist, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('dist/index.html not found — run vite build first.');
    process.exit(1);
  }
  return fs.readFileSync(indexPath, 'utf8');
}

function buildPrerenderPage(shell, { title, description, canonical, bodyHtml, jsonLd }) {
  let html = shell;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeHtml(description)}"`,
  );
  if (!html.includes('rel="canonical"')) {
    html = html.replace('</head>', `  <link rel="canonical" href="${escapeHtml(canonical)}" />\n</head>`);
  }
  html = html.replace(
    '</head>',
    `  <meta property="og:title" content="${escapeHtml(title)}" />\n`
      + `  <meta property="og:description" content="${escapeHtml(description)}" />\n`
      + `  <meta property="og:url" content="${escapeHtml(canonical)}" />\n`
      + `  <meta property="og:type" content="article" />\n`
      + `  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`,
  );
  const noscript = `<noscript><main class="prerender-fallback">${bodyHtml}</main></noscript>`;
  html = html.replace('<div id="root"></div>', `${noscript}\n    <div id="root"></div>`);
  return html;
}

async function main() {
  const env = { ...process.env, ...loadEnv() };
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = (env.VITE_SITE_URL || 'https://desierotictales.com').replace(/\/$/, '');

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Skipping SEO generation: missing Supabase env vars.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const shell = readDistShell();

  const fullSelect =
    'id, title, teaser, content, category, slug, tags, updated_at, created_at';
  const fallbackSelect = 'id, title, teaser, content, category, updated_at, created_at';

  let stories;
  let hasSlugColumn = true;
  const { data: fullStories, error: storiesErr } = await supabase
    .from('stories')
    .select(fullSelect)
    .eq('status', 'approved');

  if (storiesErr) {
    console.warn(`Full story fetch failed (${storiesErr.message}) — trying without slug/tags.`);
    hasSlugColumn = false;
    const { data: fallback, error: fallbackErr } = await supabase
      .from('stories')
      .select(fallbackSelect)
      .eq('status', 'approved');
    if (fallbackErr) {
      console.error('Failed to fetch stories:', fallbackErr.message);
      process.exit(1);
    }
    stories = fallback;
  } else {
    stories = fullStories;
  }

  const { data: writers } = await supabase
    .from('profiles')
    .select('username, display_name, bio')
    .eq('onboarding_complete', true)
    .not('username', 'is', null);

  const urls = [`${siteUrl}/`, `${siteUrl}/stories`, `${siteUrl}/writers`];
  const staticPages = [
    'privacy-policy',
    'cookie-policy',
    'contact',
    'report-content',
  ];

  for (const page of staticPages) {
    urls.push(`${siteUrl}/${page}`);
    const canonical = `${siteUrl}/${page}`;
    const html = buildPrerenderPage(shell, {
      title: `${page.replace(/-/g, ' ')} | DesiEroticTales`,
      description: 'DesiEroticTales — Telugu and Desi stories.',
      canonical,
      bodyHtml: `<h1>${escapeHtml(page)}</h1>`,
      jsonLd: { '@context': 'https://schema.org', '@type': 'WebPage', url: canonical },
    });
    ensureDir(path.join(dist, page, 'index.html'));
    fs.writeFileSync(path.join(dist, page, 'index.html'), html);
  }

  for (const cat of Object.keys(CATEGORY_SLUG_MAP)) {
    const slug = categoryToSlug(cat);
    const canonical = `${siteUrl}/category/${slug}`;
    urls.push(canonical);
    const html = buildPrerenderPage(shell, {
      title: `${cat} Stories | DesiEroticTales`,
      description: `Browse ${cat} stories on DesiEroticTales.`,
      canonical,
      bodyHtml: `<h1>${escapeHtml(cat)} Stories</h1>`,
      jsonLd: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${cat} Stories`, url: canonical },
    });
    ensureDir(path.join(dist, 'category', slug, 'index.html'));
    fs.writeFileSync(path.join(dist, 'category', slug, 'index.html'), html);
  }

  for (const story of stories ?? []) {
    const catSlug = categoryToSlug(story.category);
    const storySlug = hasSlugColumn && story.slug ? story.slug : null;
    const canonical = storySlug
      ? `${siteUrl}/${catSlug}/${storySlug}`
      : `${siteUrl}/story/${story.id}`;
    if (!storySlug && hasSlugColumn) continue;
    urls.push(canonical);
    const desc = (story.teaser || story.content || '').slice(0, 160);
    const excerpt = escapeHtml((story.content || '').slice(0, 800));
    const bodyHtml = `<article><h1>${escapeHtml(story.title)}</h1><p>${escapeHtml(desc)}</p><div>${excerpt}</div></article>`;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: story.title,
      description: desc,
      datePublished: story.created_at,
      dateModified: story.updated_at ?? story.created_at,
      url: canonical,
    };
    const html = buildPrerenderPage(shell, {
      title: `${story.title} | DesiEroticTales`,
      description: desc,
      canonical,
      bodyHtml,
      jsonLd,
    });
    if (storySlug) {
      ensureDir(path.join(dist, catSlug, storySlug, 'index.html'));
      fs.writeFileSync(path.join(dist, catSlug, storySlug, 'index.html'), html);
    } else {
      ensureDir(path.join(dist, 'story', story.id, 'index.html'));
      fs.writeFileSync(path.join(dist, 'story', story.id, 'index.html'), html);
    }
  }

  for (const w of writers ?? []) {
    const canonical = `${siteUrl}/writer/${w.username}`;
    urls.push(canonical);
    const html = buildPrerenderPage(shell, {
      title: `@${w.username} | DesiEroticTales`,
      description: w.bio?.slice(0, 160) || `Stories by @${w.username}`,
      canonical,
      bodyHtml: `<h1>@${escapeHtml(w.username)}</h1>`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: w.display_name || w.username,
        url: canonical,
      },
    });
    ensureDir(path.join(dist, 'writer', w.username, 'index.html'));
    fs.writeFileSync(path.join(dist, 'writer', w.username, 'index.html'), html);
  }

  const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  fs.writeFileSync(path.join(dist, 'robots.txt'), robots);

  const sitemapEntries = [...new Set(urls)]
    .map((loc) => `  <url><loc>${escapeHtml(loc)}</loc></url>`)
    .join('\n');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);

  console.log(`SEO artifacts: ${urls.length} URLs, ${(stories ?? []).length} story pages prerendered.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});