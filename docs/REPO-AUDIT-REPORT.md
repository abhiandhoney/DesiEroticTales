# DesiEroticTales — Full Repository Audit Report

**Date:** July 7, 2026  
**Auditor:** Automated + manual code review (Grok agent)  
**Repo:** `/media/sf_X_DRIVE/DesiEroticTales`  
**Scope:** A→Z — architecture, security, bugs, memory, performance, UI/UX, accessibility, database, tooling, deployment

---

## Executive Summary

| Area | Grade | Summary |
|------|-------|---------|
| **Architecture** | B+ | Clean React 19 SPA + Supabase + Cloudflare static deploy; good separation of `lib/`, `hooks/`, `pages/` |
| **Security** | C+ | RLS is solid; **stored XSS via `content_html`** and **missing CSP** are the top risks |
| **Correctness** | B- | Recent draft/submit race fixed; several reaction, moderation, and data-wipe bugs remain |
| **Performance** | C | Main JS bundle **695 KB** (213 KB gzip); over-fetching `select('*')` on list views |
| **UI/UX** | B | Polished dark theme, good empty/loading states; some mobile a11y gaps |
| **Testing** | F | **Zero** automated tests; one orphaned Playwright script |
| **Tooling** | B | TypeScript strict build passes; oxlint reports **22 warnings**, 0 errors |

**Critical actions (do first):**
1. Sanitize `content_html` on read (and ideally on write)
2. Add Content-Security-Policy + HSTS headers
3. Fix admin review modal to show rich HTML content
4. Split TipTap out of the main bundle
5. Add automated tests for story submit/draft/delete flows

---

## 1. Repository Overview

### Stack
- **Frontend:** React 19, TypeScript 6, Vite 8, React Router 7
- **Editor:** TipTap 3 + `react-image-crop`
- **Backend:** Supabase (Auth, Postgres RLS, Storage)
- **Deploy:** Cloudflare Workers (`wrangler.toml` → `./dist` SPA)
- **SEO:** `scripts/generate-seo.mjs` pre-renders sitemap, feed, story pages

### Size
| Metric | Value |
|--------|-------|
| `src/` TypeScript files | 97 |
| Total `src/` lines | ~8,617 |
| Supabase migrations | 15 (`001`–`015`) |
| Components | 39 |
| Pages | 16 |
| Lib modules | 22 |
| Hooks | 11 |

### Build Status (audit run)
```
npm run build  → PASS (tsc + vite + seo)
npm run lint   → PASS (22 warnings, 0 errors)
```

### Test Coverage
| Type | Status |
|------|--------|
| Unit tests | **None** |
| Integration tests | **None** |
| E2E tests | `scripts/test-crop-modal.mjs` exists but **Playwright not in package.json** |
| CI test gate | **None** |

---

## 2. Lint & Static Analysis

**Tool:** oxlint (`.oxlintrc.json`) — no ESLint, no type-aware lint in CI.

### All 22 warnings (by category)

| Category | Count | Files |
|----------|-------|-------|
| `react-hooks/exhaustive-deps` | 16 | `StoryForm`, `Stories`, `Profile`, `Home`, `Admin`, `EditStory` |
| `react(only-export-components)` | 6 | `AuthProvider`, `useToast`, `useConfirm` |

### Notable hook dependency issues

**`StoryForm.tsx` — `persist` useCallback**
- Missing deps: `uploadCover`, `buildPayload`
- Risk: stale closure if those helpers ever change; currently works because deps list includes the state they read
- Fix: wrap `uploadCover`/`buildPayload` in `useCallback` or inline into `persist`

**`Stories.tsx`, `Home.tsx`, `Admin.tsx`, `Profile.tsx`, `EditStory.tsx`**
- `fetchStories` / `fetchStory` not in `useEffect` deps
- Risk: stale fetches after refactors; eslint-suppression or `useCallback` wrappers needed

### TypeScript
- `tsconfig.app.json`: `strict`, `noUnusedLocals`, `noUnusedParameters` — **enabled**
- Build: **0 type errors**

### Syntax / parse errors
- **None found** across `src/`

---

## 3. Security Audit

### 🔴 Critical

#### S1 — Stored XSS via `content_html`
**Files:** `src/components/StoryRichContent.tsx:11-16`, `src/components/StoryForm.tsx`, `src/lib/richText.ts`

```tsx
dangerouslySetInnerHTML={{ __html: story.content_html }}
```

- Writers can store arbitrary HTML (scripts, `onerror`, `javascript:` links) via TipTap
- Once **approved**, every reader executes/renders attacker-controlled HTML
- TipTap `allowBase64: false` helps but does not block script tags in HTML output

**Fix:** DOMPurify (or similar) on read; server-side allowlist on write; consider DB trigger or Edge Function validation.

---

#### S2 — No Content-Security-Policy
**File:** `public/_headers`

Present: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`  
**Missing:** `Content-Security-Policy`, `Strict-Transport-Security`

Third-party scripts (Disqus, Adsterra, Google Fonts) run without CSP restriction.

**Fix:** Add CSP with explicit `script-src`, `img-src` (Supabase storage), `frame-src` (ads/Disqus), `style-src`.

---

### 🟠 High

#### S3 — Unvalidated link URLs in editor
**File:** `src/components/RichTextEditor.tsx:88-95`

`window.prompt` accepts any string; no protocol validation. `javascript:alert(1)` can be persisted.

**Fix:** `Link.configure({ validate: (url) => /^https?:\/\//.test(url) })`

---

#### S4 — Admin moderation blind spot
**File:** `src/components/StoryReviewModal.tsx:20,67-71`

Moderation modal renders `story.content` (legacy plain text) only — **not** `content_html`, inline images, or TipTap formatting. Admins approve/reject without seeing actual published content.

**Fix:** Use `StoryRichContent` (sanitized) in review modal.

---

#### S5 — PII in migration
**File:** `supabase/migrations/007_username_admin_rules.sql:10`

Hardcoded admin owner email in SQL. Must stay in sync with `VITE_ADMIN_EMAIL`.

**Fix:** Move to Supabase secret / config table.

---

#### S6 — Real Supabase project URL in `.env.example`
Exposes project ref (anon key is placeholder). Low exploit value but poor hygiene.

---

### 🟡 Medium

| ID | Issue | Location | Notes |
|----|-------|----------|-------|
| S7 | View-count inflation | `useStoryLoader.ts`, `increment_story_views` RPC | No rate limit; spam possible |
| S8 | Client-only admin guard | `ProtectedRoute.tsx` | OK if RLS always enforced |
| S9 | Public reaction rows | `005_story_reactions.sql` | Anyone can enumerate `story_reactions` |
| S10 | Third-party script injection | `DisqusComments.tsx`, `AdSlot.tsx` | No SRI; scripts accumulate on navigation |
| S11 | Raw OAuth errors shown | `AuthCallback.tsx` | Phishing-friendly error text |

### 🟢 Low

| ID | Issue | Notes |
|----|-------|-------|
| S12 | `VITE_*` inlined in bundle | Expected for anon key; never put service role in `VITE_*` |
| S13 | Age gate = localStorage only | UX gate, not security boundary |

### RLS Assessment ✅ (generally sound)

| Policy | Status |
|--------|--------|
| Writers insert `draft`/`pending` only | ✅ `013` |
| Writers update own `draft`/`pending`/`rejected` | ✅ `013` |
| Admins update/delete any story | ✅ `001`, `015` |
| Role self-escalation blocked | ✅ `011` trigger |
| Storage scoped to `auth.uid()` folder | ✅ `011` |
| Collection RLS recursion | ✅ Fixed in `014` |

**Gaps:**
- No server-side HTML sanitization on `content_html` / `content_json`
- Migrations `014` and `015` must be applied on **live Supabase** (user-reported drift risk)

### Secrets / `.env`
- `.env`, `.env.production` are **gitignored** ✅
- Verify they are not committed: `git check-ignore .env` passes

---

## 4. Bugs & Logic Errors

### 🔴 High

| ID | Bug | File | Detail |
|----|-----|------|--------|
| L1 | `initialDislikes` hardcoded `0` | `StoryDetail.tsx:52` | `story.dislike_count` ignored; UI diverges from DB |
| L2 | Reaction hook with empty `storyId` | `StoryDetail.tsx:48-53`, `useStoryReaction.ts:43-48` | Queries `story_reactions` with `story_id = ''` before story loads |
| L3 | Admin reviews wrong content | `StoryReviewModal.tsx:20` | Plain `story.content` only; rich stories invisible to moderators |

### 🟠 Medium

| ID | Bug | File | Detail |
|----|-----|------|--------|
| L4 | Reaction rollback uses stale `initialLikes` | `useStoryReaction.ts:79-82` | Concurrent updates restore wrong counts |
| L5 | `gallery_urls` wiped on save | `StoryForm.tsx:142` | Always sets `gallery_urls: []`; legacy gallery data lost on edit |
| L6 | Navigate during render | `OnboardingUsername.tsx:63-66` | `navigate()` in render body; StrictMode risk |
| L7 | Stories pagination race | `Stories.tsx:47-54` | No abort; stale responses can overwrite state |
| L8 | Slug fetch without category filter | `useStoryLoader.ts:30+` | Extra round-trip when wrong `categorySlug` in URL |
| L9 | Draft save debounce UX | `StoryForm.tsx` | "Saving..." only shows after debounce fires, not on click |

### 🟢 Low

| ID | Bug | Detail |
|----|-----|--------|
| L10 | View double-increment in StrictMode dev | `useStoryLoader.ts` — dev only |
| L11 | `requireWriter` = any signed-in user | Naming mismatch in `ProtectedRoute` |
| L12 | Success screen stale status | `EditStory.tsx:77` — checks `story?.status === 'approved'` from pre-save state |

### Recently fixed (this session)
- ✅ Duplicate draft INSERT on repeated "Save as Draft"
- ✅ Debounced draft overwriting submit (draft → pending race)
- ✅ Story deletion with storage cleanup (`015` + `deleteStory.ts`)

---

## 5. Memory Leaks & Resource Cleanup

### 🔴 High

| ID | Issue | File | Detail |
|----|-------|------|--------|
| M1 | Blob URL not revoked on success | `imageProcessing.ts:21-33` | `loadImageFromFile` revokes only on error |
| M2 | Draft preview URLs on unmount | `StoryMediaUploader.tsx:128` | `createObjectURL` per file; no cleanup if user navigates away |
| M3 | Cover recrop URL leak | `StoryCoverUploader.tsx:108-115` | New `fullPreviewUrl` without revoking previous |

### 🟠 Medium

| ID | Issue | File | Detail |
|----|-------|------|--------|
| M4 | TipTap editor not destroyed | `RichTextEditor.tsx` | Missing `editor.destroy()` on unmount |
| M5 | Disqus script accumulation | `DisqusComments.tsx` | New `embed.js` per story navigation |
| M6 | Related stories fetch no cancel | `RelatedStoriesSection.tsx:24-54` | `setState` after unmount possible |

### ✅ Good patterns found

| File | Pattern |
|------|---------|
| `ImageCropModal.tsx` | Revokes object URLs on cleanup |
| `AuthProvider.tsx` | Unsubscribes `onAuthStateChange` |
| `useFocusTrap`, `useBodyScrollLock` | Proper cleanup |
| `useStoryLoader.ts` | `cancelled` flag on fetch |
| `useDebouncedValue.ts` | Clears timeout |

---

## 6. Performance

### Bundle analysis (production build)

| Chunk | Size | Gzip |
|-------|------|------|
| `index-*.js` (main) | **695 KB** | 213 KB |
| `StoryForm-*.js` | 34 KB | 11 KB |
| `imageProcessing-*.js` | 16 KB | 5 KB |
| CSS total | 58 KB | 11 KB |

⚠️ Vite warns: main chunk > 500 KB.

### Root cause: TipTap in main bundle
`src/lib/richText.ts` imports `@tiptap/starter-kit`, `@tiptap/html`, etc.  
Pulled transitively by: `StoryDetail`, `StoryCard`, `Home`, `seo.ts`, `storyPlainText` callers.

**Fix:** Split into `richTextPlain.ts` (no TipTap) for read paths; dynamic `import()` TipTap only in `StoryForm` / `RichTextEditor`.

### Over-fetching (`select('*')`)

| File | Impact |
|------|--------|
| `Admin.tsx:48` | Full `content_html` for every row in moderation list |
| `Home.tsx:61` | Full story bodies for 8 cards (only teaser needed) |
| `Profile.tsx:57` | Full HTML for submission list |
| `RelatedStoriesSection.tsx:32,40` | 2× full story fetch per detail page |
| `rankings.ts` | Multiple `select('*')` for featured stories |

**Fix:** Define `STORY_LIST_COLUMNS` constant (already partially done in `Stories.tsx`) and reuse everywhere.

### Other performance notes

| Item | Status |
|------|--------|
| Lazy routes for Submit/Profile/Admin/Edit | ✅ Good |
| `StoryDetail` in main bundle | ❌ Not lazy-loaded |
| Google Fonts (3 families) | Render-blocking in `index.html` |
| Image lazy loading on cards | ✅ `loading="lazy"` on `StoryCard` |
| WebP conversion client-side | Good for bandwidth; CPU cost on upload |

---

## 7. UI / UX Audit

### Strengths ✅
- Consistent dark burgundy/gold design system (`index.css` CSS variables)
- Empty states with CTAs (`EmptyState.tsx`)
- Skeleton/spinner loading patterns
- Toast + confirm modal system
- Reading progress bar, font-size prefs
- 16:9 cover crop with card preview (recent improvement)
- Breadcrumbs + JSON-LD for SEO
- Skip link in layout

### Issues

#### 🟠 Medium

| ID | Issue | Location |
|----|-------|----------|
| U1 | Mobile nav — no focus trap | `Navbar.tsx` — Tab escapes open menu |
| U2 | Age gate — no focus trap | `AgeGate.tsx` — background focusable |
| U3 | User menu — no arrow-key nav | `UserMenu.tsx` |
| U4 | Story loading — no accessible text | `StoryDetail.tsx` — spinner without `aria` label |
| U5 | H2 / Link toolbar buttons missing `aria-label` | `RichTextEditor.tsx:76-99` |
| U6 | Raw Supabase errors shown to users | `AuthCallback.tsx`, form errors |
| U7 | Delete button styling inconsistent | `btn-danger-outline` vs `btn-danger` |

#### 🟢 Low

| ID | Issue |
|----|-------|
| U8 | `StoryMediaGallery` uses raw `<img>` not `SafeImage` |
| U9 | Disqus loads without cookie consent gate |
| U10 | Reading progress ignores `prefers-reduced-motion` |
| U11 | `CategoryNav` on story detail may duplicate `StoryFilters` (removed from Home already) |
| U12 | Crop modal on small screens — preview panel stacks (acceptable; tested at 720px breakpoint) |

### Responsive breakpoints
- `index.css` has **8** `@media (max-width: …)` rules
- Crop modal stacks at `720px` ✅
- Profile card grid may be tight on very small screens (~320px) — not tested on device

### Route conflicts
- `/:categorySlug/:storySlug` is last among content routes ✅
- `RESERVED_PATHS` in `slug.ts` blocks ~20 paths ✅
- Risk: new top-level routes must be added to `RESERVED_PATHS` manually

---

## 8. Accessibility (a11y)

| Check | Status |
|-------|--------|
| Skip link | ✅ |
| Modal focus trap | ✅ (`useFocusTrap`) — except Navbar/AgeGate |
| `aria-modal`, `role="dialog"` on modals | ✅ |
| Form labels | ✅ Most forms |
| Color contrast (dark theme) | ✅ Generally good |
| Keyboard gallery nav | ✅ `StoryMediaGallery` |
| Live regions for errors | ⚠️ Partial — toasts have `aria-live`, form errors don't |
| Image alt text | ⚠️ Inline editor images use `file.name` as alt |
| Language attribute | ✅ `lang="te"` on Telugu snippets |

---

## 9. Database & Migrations

### Migration inventory

| # | File | Purpose |
|---|------|---------|
| 001 | `initial_schema` | Core tables, RLS, storage bucket |
| 002–012 | Various | Teaser, gallery, social, reactions, rankings, SEO slugs |
| 013 | `rich_content_drafts_collections` | TipTap JSON/HTML, drafts, collections |
| 014 | `fix_collection_rls_recursion` | SECURITY DEFINER helpers — **must be live** |
| 015 | `story_delete_rls` | Delete policies — **must be live** |

### Schema concerns

| Issue | Severity |
|-------|----------|
| No DB-level HTML sanitization | High |
| `increment_story_views` unlimited | Medium |
| `story_reactions` public SELECT | Low |
| Global unique `slug` (not per-category) | Low — handled in app layer |

### Storage
- Bucket: `story-images` (public read)
- Upload path: `{userId}/{timestamp}-{suffix}.webp` ✅
- Delete: owner + admin (`015`) ✅
- Orphan cleanup: best-effort in `deleteStory.ts` ✅

---

## 10. Deployment & Ops

| Item | Status |
|------|--------|
| `npm run build` pipeline | tsc → brand assets → vite → SEO |
| `npm run deploy` | Wrangler to Cloudflare |
| `public/_headers` | Copied to `dist/_headers` |
| Pre-rendered SEO pages | `generate-seo.mjs` |
| `llms.txt` | Present for LLM crawlers |
| Environment vars | Documented in `.env.example` |

### Missing ops tooling
- No CI/CD config in repo (GitHub Actions, etc.)
- No health check endpoint (static site — acceptable)
- No error tracking (Sentry, etc.)
- No analytics beyond story `views` counter

---

## 11. Dependency Health

| Package | Version | Notes |
|---------|---------|-------|
| react | 19.2.7 | Current |
| vite | 8.1.1 | Current |
| typescript | 6.0.2 | Current |
| @supabase/supabase-js | 2.110.0 | Current |
| @tiptap/* | 3.27.3 | Current |
| react-image-crop | 11.1.2 | Current |
| oxlint | 1.71.0 | Lint only — no type-aware rules |
| wrangler | 4.107.0 | Current |

**Notable absences:** `vitest`, `@testing-library/react`, `dompurify`, `playwright` (script references it but not installed)

`npm audit`: **0 vulnerabilities** (at audit time)

---

## 12. File-by-File Hotspot Index

| File | Risk | Top issue |
|------|------|-----------|
| `StoryRichContent.tsx` | 🔴 | XSS via `dangerouslySetInnerHTML` |
| `public/_headers` | 🔴 | No CSP |
| `StoryReviewModal.tsx` | 🟠 | Wrong content for moderation |
| `RichTextEditor.tsx` | 🟠 | Link injection; no editor destroy |
| `StoryForm.tsx` | 🟠 | Gallery wipe; hook deps warnings |
| `useStoryReaction.ts` | 🟠 | Empty storyId query; stale rollback |
| `StoryDetail.tsx` | 🟠 | `initialDislikes: 0` |
| `richText.ts` | 🟠 | Bundle bloat |
| `imageProcessing.ts` | 🟡 | Blob URL leak |
| `StoryMediaUploader.tsx` | 🟡 | Preview URL leak |
| `DisqusComments.tsx` | 🟡 | Script accumulation |
| `AuthProvider.tsx` | 🟢 | Solid PKCE/session handling |
| `ProtectedRoute.tsx` | 🟢 | Good UX guard (RLS is real gate) |
| `deleteStory.ts` | 🟢 | Good storage + HTML URL collection |

---

## 13. Positive Findings

1. **PKCE OAuth** completed before React mount (`main.tsx`) — avoids verifier race
2. **`detectSessionInUrl: false`** — prevents double token exchange
3. **RLS hardening** across 15 migrations with security-definer helpers
4. **Search filter escaping** (`escapePostgrestIlike` in `search.ts`)
5. **Privacy helpers** — email masking, admin email never in UI
6. **Canonical slug redirects** from legacy `/story/:id` URLs
7. **Error boundary** at app root
8. **Lazy-loaded** writer/admin routes
9. **WebP pipeline** for all uploaded images
10. **Recent draft/delete/crop fixes** address real user-reported issues

---

## 14. Remediation Roadmap

### Phase 1 — Security (1–2 days)
- [ ] Add DOMPurify to `StoryRichContent` (+ optional server sanitization)
- [ ] Validate link URLs in `RichTextEditor`
- [ ] Add CSP + HSTS to `public/_headers`
- [ ] Fix `StoryReviewModal` to render sanitized rich content

### Phase 2 — Correctness (1 day)
- [ ] Guard `useStoryReaction` when `!storyId`
- [ ] Pass `story.dislike_count` to reaction hook
- [ ] Preserve `gallery_urls` on edit in `StoryForm`
- [ ] Move `OnboardingUsername` navigate to `useEffect`

### Phase 3 — Performance (1–2 days)
- [ ] Split `richText.ts` → plain vs editor modules
- [ ] Narrow `select()` on Admin, Home, Profile, RelatedStories
- [ ] Lazy-load `StoryDetail`
- [ ] `font-display: swap` + subset fonts

### Phase 4 — Memory & hygiene (0.5 day)
- [ ] Revoke blob URLs in `imageProcessing.ts`, cover/media uploaders
- [ ] `editor.destroy()` in `RichTextEditor`
- [ ] Disqus single-load pattern
- [ ] Fix oxlint hook dependency warnings

### Phase 5 — Testing & CI (2–3 days)
- [ ] Add Vitest + Testing Library
- [ ] Tests: `StoryForm` draft/submit, `deleteStory`, `slug` helpers, `richText`
- [ ] Install Playwright; fix `test-crop-modal.mjs`
- [ ] GitHub Action: `lint` + `build` + `test` on PR

---

## 15. Audit Methodology

1. Repository tree inventory (99 `src/` files)
2. `npm run lint` — full warning capture (22 warnings)
3. `npm run build` — bundle size analysis
4. Pattern scans: `dangerouslySetInnerHTML`, `createObjectURL`, `select('*')`, `console.*`, `TODO`
5. Manual review of auth, RLS migrations, story flows, editor, moderation
6. Cross-reference with prior docs (`docs/FULL-AUDIT-REPORT.md`, `UI-UX-AUDIT-AND-REDESIGN-PLAN.md`)

---

## 16. Document History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-07-07 | Initial comprehensive A→Z audit |

---

*End of report. For implementation of Phase 1–5 items, request specific fixes and they can be patched incrementally.*