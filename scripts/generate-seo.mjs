#!/usr/bin/env node
/**
 * Post-build SEO: robots.txt, sitemap.xml, feed.xml, and prerendered HTML for crawlers/LLMs.
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

const CATEGORY_SLUG_MAP = JSON.parse(
  fs.readFileSync(path.join(root, 'src/lib/categorySlugs.json'), 'utf8'),
);

const CATEGORY_DESCRIPTIONS = {
  Aunty: 'Mature aunty and pakkinti slow-burn tales in Telugu — emotional, realistic desi erotica.',
  'Akka-Chelli': 'Realistic akka chelli slow-burn fiction — emotional sibling tales in Telugu.',
  Office: 'Workplace slow-burn Telugu erotica — boss, colleague, and panimanishi tension.',
  College: 'Campus slow-burn Telugu stories — college romance and first experiences.',
  Friend: 'Friend pellam slow-burn Telugu tales — first-time and emotional romance.',
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

function formatLastmod(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function storyWordCount(content) {
  const trimmed = (content || '').trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function stripHtml(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function storyPlainText(story) {
  if (story.content_html) return stripHtml(story.content_html);
  return story.content || '';
}

function storyDescription(story) {
  const raw = story.teaser?.trim() || storyPlainText(story);
  return raw.replace(/\s+/g, ' ').trim().slice(0, 160);
}

function buildStoryHighlights(story) {
  return [
    story.category && `Category: ${story.category}`,
    story.tags?.length && `Tags: ${story.tags.join(', ')}`,
    `Style: Slow-burn, emotional Telugu erotica`,
  ].filter(Boolean);
}

function buildStoryBodyHtml(story) {
  const desc = storyDescription(story);
  const highlights = buildStoryHighlights(story);
  const words = storyWordCount(storyPlainText(story));
  const readMins = Math.max(1, Math.ceil(words / 200));
  const excerpt = escapeHtml(
    storyPlainText(story).slice(0, 1200),
  );

  return `
<article itemscope itemtype="https://schema.org/Article">
  <h1 itemprop="headline">${escapeHtml(story.title)}</h1>
  <section aria-label="Quick Summary">
    <h2>Quick Summary</h2>
    <p class="story-summary-text" itemprop="description">${escapeHtml(desc)}</p>
  </section>
  <section aria-label="Key Highlights">
    <h2>Key Highlights</h2>
    <ul>
      ${highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}
      <li>Read time: ~${readMins} min</li>
    </ul>
  </section>
  <section itemprop="articleBody">
    <h2>Full Story</h2>
    <div>${excerpt}</div>
  </section>
</article>`;
}

function buildStoryJsonLd(story, canonical, siteUrl) {
  const desc = storyDescription(story);
  const words = storyWordCount(storyPlainText(story));
  const readMins = Math.max(1, Math.ceil(words / 200));
  return {
    '@context': 'https://schema.org',
    '@type': ['Article', 'CreativeWork'],
    headline: story.title,
    abstract: desc,
    description: desc,
    datePublished: story.created_at,
    dateModified: story.updated_at ?? story.created_at,
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: story.category,
    genre: ['Telugu erotica', 'slow-burn', story.category],
    about: (story.tags ?? []).map((tag) => ({ '@type': 'Thing', name: tag })),
    keywords: (story.tags ?? []).join(', ') || story.category,
    wordCount: words,
    timeRequired: `PT${readMins}M`,
    inLanguage: ['te', 'en'],
    creativeWorkStatus: 'Published',
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: 'DesiEroticTales', url: siteUrl },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.story-summary-text'],
    },
  };
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

function buildPrerenderPage(shell, { title, description, canonical, bodyHtml, jsonLd, ogType = 'article', ogImage }) {
  let html = shell;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeHtml(description)}"`,
  );
  if (!html.includes('rel="canonical"')) {
    html = html.replace('</head>', `  <link rel="canonical" href="${escapeHtml(canonical)}" />\n</head>`);
  }
  const ld = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  const ldScripts = ld.map((d) => `<script type="application/ld+json">${JSON.stringify(d)}</script>`).join('\n  ');
  html = html.replace(
    '</head>',
    `  <meta property="og:title" content="${escapeHtml(title)}" />\n`
      + `  <meta property="og:description" content="${escapeHtml(description)}" />\n`
      + `  <meta property="og:url" content="${escapeHtml(canonical)}" />\n`
      + `  <meta property="og:type" content="${ogType}" />\n`
      + (ogImage
        ? `  <meta property="og:image" content="${escapeHtml(ogImage)}" />\n`
          + `  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />\n`
        : '')
      + `  ${ldScripts}\n</head>`,
  );
  const noscript = `<noscript><main class="prerender-fallback">${bodyHtml}</main></noscript>`;
  html = html.replace('<div id="root"></div>', `${noscript}\n    <div id="root"></div>`);
  return html;
}

function pushUrl(urlEntries, loc, lastmod) {
  urlEntries.push({ loc, lastmod: formatLastmod(lastmod) });
}

async function main() {
  const env = { ...process.env, ...loadEnv() };
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = (env.VITE_SITE_URL || 'https://desierotictales.online').replace(/\/$/, '');
  const buildDate = new Date().toISOString();

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Skipping SEO generation: missing Supabase env vars.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const shell = readDistShell();

  const fullSelect =
    'id, title, teaser, content, content_html, category, slug, tags, image_url, card_image_url, updated_at, created_at';
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

  const urlEntries = [];
  pushUrl(urlEntries, `${siteUrl}/`, buildDate);
  pushUrl(urlEntries, `${siteUrl}/stories`, buildDate);
  pushUrl(urlEntries, `${siteUrl}/writers`, buildDate);
  pushUrl(urlEntries, `${siteUrl}/about`, buildDate);
  pushUrl(urlEntries, `${siteUrl}/feed.xml`, buildDate);

  const staticPages = [
    { slug: 'about', title: 'About DesiEroticTales', description: 'Slow-burn Telugu and Desi erotic fiction — mission, categories, and citation guide.' },
    { slug: 'privacy-policy', title: 'Privacy Policy', description: 'How DesiEroticTales handles your data.' },
    { slug: 'cookie-policy', title: 'Cookie Policy', description: 'Cookies and local storage used by DesiEroticTales.' },
    { slug: 'contact', title: 'Contact Us', description: 'Get in touch with DesiEroticTales.' },
    { slug: 'report-content', title: 'Report Content', description: 'Report inappropriate content on DesiEroticTales.' },
  ];

  for (const page of staticPages) {
    const canonical = `${siteUrl}/${page.slug}`;
    pushUrl(urlEntries, canonical, buildDate);
    const html = buildPrerenderPage(shell, {
      title: `${page.title} | DesiEroticTales`,
      description: page.description,
      canonical,
      bodyHtml: `<h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p>`,
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, description: page.description, url: canonical },
        { '@context': 'https://schema.org', '@type': 'Organization', name: 'DesiEroticTales', url: siteUrl },
      ],
      ogType: 'website',
    });
    ensureDir(path.join(dist, page.slug, 'index.html'));
    fs.writeFileSync(path.join(dist, page.slug, 'index.html'), html);
  }

  for (const cat of Object.keys(CATEGORY_SLUG_MAP)) {
    const slug = categoryToSlug(cat);
    const canonical = `${siteUrl}/category/${slug}`;
    const catDesc = CATEGORY_DESCRIPTIONS[cat] || `Browse ${cat} slow-burn Telugu stories on DesiEroticTales.`;
    pushUrl(urlEntries, canonical, buildDate);
    const html = buildPrerenderPage(shell, {
      title: `${cat} Stories — Free Slow-Burn Tales | DesiEroticTales`,
      description: catDesc,
      canonical,
      bodyHtml: `<h1>${escapeHtml(cat)} Stories</h1><p>${escapeHtml(catDesc)}</p>`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${cat} Stories`,
        description: catDesc,
        url: canonical,
      },
      ogType: 'website',
    });
    ensureDir(path.join(dist, 'category', slug, 'index.html'));
    fs.writeFileSync(path.join(dist, 'category', slug, 'index.html'), html);
  }

  const feedStories = [...(stories ?? [])]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);

  for (const story of stories ?? []) {
    const catSlug = categoryToSlug(story.category);
    const storySlug = hasSlugColumn && story.slug ? story.slug : null;
    const canonical = storySlug
      ? `${siteUrl}/${catSlug}/${storySlug}`
      : `${siteUrl}/story/${story.id}`;
    const legacyCanonical = `${siteUrl}/story/${story.id}`;
    if (!storySlug && hasSlugColumn) {
      pushUrl(urlEntries, legacyCanonical, story.updated_at ?? story.created_at);
    } else {
      pushUrl(urlEntries, canonical, story.updated_at ?? story.created_at);
    }
    const desc = storyDescription(story);
    const bodyHtml = buildStoryBodyHtml(story);
    const jsonLd = buildStoryJsonLd(story, canonical, siteUrl);
    const coverImage = story.card_image_url || story.image_url;
    const ogImage = coverImage
      ? (coverImage.startsWith('http') ? coverImage : `${siteUrl}${coverImage.startsWith('/') ? '' : '/'}${coverImage}`)
      : `${siteUrl}/assets/og-image.png`;
    const pageCanonical = storySlug ? canonical : legacyCanonical;
    const html = buildPrerenderPage(shell, {
      title: `${story.title} | DesiEroticTales`,
      description: desc,
      canonical: pageCanonical,
      bodyHtml,
      jsonLd,
      ogImage,
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
    pushUrl(urlEntries, canonical, buildDate);
    const html = buildPrerenderPage(shell, {
      title: `@${w.username} | DesiEroticTales`,
      description: w.bio?.slice(0, 160) || `Slow-burn Telugu stories by @${w.username}`,
      canonical,
      bodyHtml: `<h1>@${escapeHtml(w.username)}</h1>${w.bio ? `<p>${escapeHtml(w.bio)}</p>` : ''}`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: w.display_name || w.username,
        url: canonical,
        description: w.bio ?? undefined,
      },
      ogType: 'profile',
    });
    ensureDir(path.join(dist, 'writer', w.username, 'index.html'));
    fs.writeFileSync(path.join(dist, 'writer', w.username, 'index.html'), html);
  }

  const { data: penNames } = await supabase
    .from('author_profiles')
    .select('slug, name, bio');

  const { data: collections } = await supabase
    .from('collections')
    .select('title, slug, description, user_id');

  for (const col of collections ?? []) {
    const { data: owner } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', col.user_id)
      .maybeSingle();
    const username = owner?.username;
    if (!username) continue;
    const canonical = `${siteUrl}/writer/${username}/collection/${col.slug}`;
    pushUrl(urlEntries, canonical, buildDate);
    const html = buildPrerenderPage(shell, {
      title: `${col.title} — ${username} | DesiEroticTales`,
      description: col.description?.slice(0, 160) || `Story collection: ${col.title}`,
      canonical,
      bodyHtml: `<h1>${escapeHtml(col.title)}</h1><p>Collection by @${escapeHtml(username)}</p>`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: col.title,
        url: canonical,
      },
      ogType: 'website',
    });
    ensureDir(path.join(dist, 'writer', username, 'collection', col.slug, 'index.html'));
    fs.writeFileSync(path.join(dist, 'writer', username, 'collection', col.slug, 'index.html'), html);
  }

  const writerUsernames = new Set((writers ?? []).map((w) => w.username));

  for (const p of penNames ?? []) {
    if (writerUsernames.has(p.slug)) continue;
    const canonical = `${siteUrl}/writer/${p.slug}`;
    pushUrl(urlEntries, canonical, buildDate);
    const html = buildPrerenderPage(shell, {
      title: `${p.name} | DesiEroticTales`,
      description: p.bio?.slice(0, 160) || `Slow-burn Telugu stories by ${p.name}`,
      canonical,
      bodyHtml: `<h1>${escapeHtml(p.name)}</h1><p>@${escapeHtml(p.slug)}</p>${p.bio ? `<p>${escapeHtml(p.bio)}</p>` : ''}`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: p.name,
        url: canonical,
        description: p.bio ?? undefined,
      },
      ogType: 'profile',
    });
    ensureDir(path.join(dist, 'writer', p.slug, 'index.html'));
    fs.writeFileSync(path.join(dist, 'writer', p.slug, 'index.html'), html);
  }

  const robots = `User-agent: *
Allow: /

# LLM / AI crawlers — allow indexing for discoverability
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  fs.writeFileSync(path.join(dist, 'robots.txt'), robots);

  const seen = new Set();
  const sitemapEntries = urlEntries
    .filter(({ loc }) => {
      if (seen.has(loc)) return false;
      seen.add(loc);
      return true;
    })
    .map(({ loc, lastmod }) => {
      const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeHtml(loc)}</loc>${lastmodTag}\n  </url>`;
    })
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>
`;
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);

  const rssItems = feedStories.map((story) => {
    const catSlug = categoryToSlug(story.category);
    const storySlug = hasSlugColumn && story.slug ? story.slug : story.id;
    const link = hasSlugColumn && story.slug
      ? `${siteUrl}/${catSlug}/${storySlug}`
      : `${siteUrl}/story/${story.id}`;
    const desc = escapeHtml(storyDescription(story));
    const pubDate = new Date(story.created_at).toUTCString();
    return `    <item>
      <title>${escapeHtml(story.title)}</title>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="true">${escapeHtml(link)}</guid>
      <description>${desc}</description>
      <category>${escapeHtml(story.category)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
  }).join('\n');

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DesiEroticTales — Latest Telugu Stories</title>
    <link>${siteUrl}/</link>
    <description>Slow-burn Telugu and Desi erotic stories — latest updates</description>
    <language>en-in</language>
    <lastBuildDate>${new Date(buildDate).toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(dist, 'feed.xml'), feed);

  console.log(
    `SEO artifacts: ${seen.size} URLs, ${(stories ?? []).length} story pages, feed.xml with ${feedStories.length} items.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});