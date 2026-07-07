# DesiEroticTales — SEO Keyword Strategy

**Last updated:** July 7, 2026  
**Implementation:** `src/lib/seoKeywords.ts`, `src/lib/seoMeta.ts`, `usePageMeta`, `scripts/generate-seo.mjs`

---

## Primary keywords (homepage + site-wide)

| Keyword | Intent |
|---------|--------|
| telugu sex stories | Head term — highest volume |
| kamakathalu | Brand-adjacent Telugu term |
| boothu kathalu | Colloquial Telugu search |
| desi sex stories | English-language Desi audience |
| telugu kama kathalu | Traditional Telugu phrasing |
| telugu dengudu kathalu | High-intent Telugu |
| indian sex stories | Broader geo |
| telugu sex kathalu | Variant spelling |

---

## Long-tail keywords (30+ — target in categories, tags, meta)

1. telugu aunty sex stories  
2. aunty dengudu kathalu  
3. akka chelli sex stories  
4. anna chellelu sex stories  
5. telugu office sex stories  
6. pinni puku kathalu  
7. pinni pedhamma dengudu  
8. telugu panimanishi sex stories  
9. pakkinti aunty sex story  
10. telugu college sex stories  
11. girlfriend tho first sex telugu  
12. telugu boothu kathalu new  
13. hot telugu sex stories  
14. telugu ranku kathalu  
15. desi erotic stories telugu  
16. telugu sex stories online free  
17. latest telugu kamakathalu  
18. telugu family sex stories  
19. vadhina sex stories telugu  
20. maradhalu dengudu kathalu  
21. telugu milf sex stories  
22. gumpu dengudu kathalu  
23. telugu fantasy sex stories  
24. read telugu sex stories  
25. best telugu sex stories 2026  
26. telugu sex stories with photos  
27. slow burn telugu erotica  
28. telugu writer sex stories  
29. amma koduku sex stories  
30. telugu neighbor sex stories  
31. yavannam sex stories  
32. telugu sex story blog  
33. rachayitalu sex stories  
34. telugu sex stories app  
35. new kamakathalu today  

---

## Page-level meta (implemented)

| Page | Title pattern | Index? |
|------|---------------|--------|
| Home | Telugu Sex Stories & Kamakathalu | Yes |
| Stories | All Telugu Sex Stories | Yes |
| Category | `{phrase} — Read Free Online` | Yes |
| Story | `{title} — {category phrase}` | Yes + Article schema |
| Writers | Top Telugu Story Writers | Yes |
| Writer | `@{user} — Telugu Story Writer` | Yes |
| Submit / Admin / Profile | — | **noindex** |

---

## Internal linking checklist

- [x] `CategoryNav` on Home, Stories, Story detail, Category archive  
- [x] Breadcrumbs on story pages (visible + JSON-LD)  
- [x] Related stories in same category  
- [x] “View all {category}” link below related stories  
- [x] Writer links from story cards and detail  
- [x] Footer links to legal + explore  
- [ ] Add “Popular in {category}” block on category archive (future)  
- [ ] Tag archive pages `/tag/{slug}` when tags are used (future)  

---

## Writer tips for on-page SEO

1. **Title** — Include character/relationship hook (e.g. “Aunty”, “Office”)  
2. **Teaser** — 120–160 chars; natural keyword use  
3. **Tags** — 3–5 tags from long-tail list (comma-separated in submit form)  
4. **Category** — Pick the most specific match  
5. **Slug** — Auto-generated from title on approve; edit title before submit if needed  

---

## Technical SEO status

| Item | Status |
|------|--------|
| Canonical URLs | ✅ `usePageMeta` |
| Open Graph | ✅ All indexed pages |
| Twitter cards | ✅ `summary_large_image` |
| JSON-LD Article | ✅ Story pages |
| JSON-LD BreadcrumbList | ✅ Story pages |
| JSON-LD WebSite + SearchAction | ✅ Home, Stories |
| sitemap.xml | ✅ Post-build script |
| robots.txt | ✅ |
| Prerender HTML for crawlers | ✅ `generate-seo.mjs` |
| Semantic URLs | ✅ `/{category}/{slug}` |