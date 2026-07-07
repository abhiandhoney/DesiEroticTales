# DesiEroticTales — UI/UX Audit & Redesign Plan

**Created:** July 6, 2026  
**Scope:** Full frontend audit (`src/`, `index.css`, `index.html`)  
**Goal:** Fix UI/UX bugs, tighten workflows, and rebuild layout for a professional, robust reading + writing experience.

---

## Executive summary

The app is functionally complete (read, submit, moderate, auth) but the **presentation layer is inconsistent and several workflows dead-end**. Styling lives almost entirely in a single 465-line `index.css` with no design tokens beyond CSS variables, no component-level structure, and several **CSS rule conflicts** that break intended layouts.

| Area | Grade | Notes |
|------|-------|-------|
| Visual design | C+ | Dark theme is cohesive; cards, profile, and mobile nav feel unfinished |
| Layout robustness | C | Grid/flex conflicts, missing fallbacks, uneven card heights |
| Reader UX | B- | Good typography intent; weak discovery, no skeletons, justify text on mobile |
| Writer UX | C+ | Submit flow works; crop/cover edge cases, rejected-story dead ends |
| Admin UX | B- | Review modal works; no gallery preview, no writer attribution |
| Accessibility | D+ | Modals lack focus trap; `outline: none` on inputs; sparse focus rings |
| Mobile | C | Nav menu works but backdrop is invisible; cramped auth errors |

**Recommended approach:** 4-phase rollout (bugs → workflows → design system → layout rebuild). Estimated **~3–5 dev days** for phases 1–3; phase 4 is optional polish.

---

## Architecture snapshot

```
App
├── MainLayout (AgeGate, Navbar, main, Footer)
│   ├── Home          — hero + latest 24 stories + client search
│   ├── Stories       — full library + sort
│   ├── StoryDetail   — reading view + gallery + related
│   ├── Submit        — StoryForm (create)
│   ├── EditStory     — StoryForm (edit)
│   ├── Profile       — writer dashboard
│   ├── Admin         — moderation tabs + StoryReviewModal
│   └── NotFound
└── AuthCallback (outside layout)
```

**Tech:** React 19, React Router 7, plain CSS (no Tailwind/component library), Supabase.

---

## P0 — Critical bugs (fix first)

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| B-01 | **Profile card layout broken** — `.profile-card` uses `display: grid` with no `grid-template-columns`; avatar, info, stats, and CTA stack as a single column blob | `index.css:219–224`, `Profile.tsx:55–81` | Profile page looks amateurish |
| B-02 | **My-submission card row layout overridden** — first rule sets `flex-direction: row` (L237) but second rule (L338) sets `display: flex; flex-direction: column`, so thumbnails never sit beside content | `index.css:237–239`, `338–341` | Submission list layout broken on all breakpoints |
| B-03 | **Edit cancel navigates to `/submit`** for writers instead of `/profile` | `EditStory.tsx:108` | Confusing back-navigation after editing |
| B-04 | **Rejected stories are dead ends** — profile shows badge but no Edit / Resubmit / feedback action | `Profile.tsx:125–136` | Writers cannot recover from rejection |
| B-05 | **Crop modal dismiss leaves orphan draft** — closing crop without applying leaves a cover-flagged draft with no `croppedBlob`; form can submit without a valid cover | `StoryMediaUploader.tsx:115–117`, `281–286` | Broken or missing cover images |
| B-06 | **Gallery broken-image handling** — `onError` sets `display: none` on main stage image, leaving empty 16:9 box | `StoryMediaGallery.tsx:39–41` | Broken UX on failed CDN URLs |
| B-07 | **Story cards without images** — no placeholder; cards collapse to uneven heights in grid | `StoryCard.tsx:11–15` | Grid looks jagged |
| B-08 | **`.auth-loading` class undefined** — navbar shows unstyled "Loading..." during auth | `Navbar.tsx:101`, `index.css` (missing) | Flash of ugly text |
| B-09 | **Admin review shows cover only** — `gallery_urls` ignored in moderation modal | `StoryReviewModal.tsx:63–67` | Admins cannot review full media before approve |
| B-10 | **Body `overflow` conflicts** — AgeGate, Navbar mobile menu, and modals each set `document.body.style.overflow`; closing one can restore wrong state when multiple are open | `AgeGate.tsx`, `Navbar.tsx:17–22`, modals | Scroll lock bugs on mobile |

---

## P1 — Workflow & UX gaps

| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| W-01 | **Home search only scans latest 24** — full-text search on `/stories` is client-side over all rows, but home is limited | `Home.tsx:31`, `47–56` | Either server-side search or remove home search; add prominent "Search all stories" CTA |
| W-02 | **Home vs Stories overlap** — both list stories with filters; user unclear which to use | `Home.tsx`, `Stories.tsx` | Home = curated hero + latest 6–8; Stories = full library with filters |
| W-03 | **No result counts** — filters give no "Showing X of Y" feedback | `Stories.tsx`, `Home.tsx` | Add `.results-meta` below filters |
| W-04 | **No pagination / virtual scroll** — Stories loads entire approved table | `Stories.tsx:19–34` | Paginate (24/page) or infinite scroll |
| W-05 | **Success screens auto-redirect with no control** — 2.5s timeout, no cancel | `Submit.tsx:13`, `EditStory.tsx:55` | Add manual CTA; optional countdown |
| W-06 | **Edit success has no navigation link** — only message, then redirect | `EditStory.tsx:67–74` | Add "Back to profile" / "View story" buttons |
| W-07 | **Writer cannot re-crop persisted cover** — only new drafts open crop modal; persisted cover has no "Adjust crop" | `StoryMediaUploader.tsx:187–193` | Add re-crop action for persisted + draft covers |
| W-08 | **Persisted gallery images cannot become cover** — `onSelect` only on drafts | `StoryMediaUploader.tsx:195–202` | Allow any thumb to become cover (re-crop if needed) |
| W-09 | **Sign-in redirect: `signingIn` never resets on success** — only on error (`Navbar.tsx:50`) | `Navbar.tsx:42–51` | Reset on auth state change |
| W-10 | **Protected route copy wrong for signed-in non-writer** — `isWriter === !!user` so this branch is unreachable; message says "Create an account" incorrectly | `ProtectedRoute.tsx:61–68`, `AuthProvider.tsx:76` | Clarify role messaging if writer role is added later |
| W-11 | **No draft autosave** — long story form loses data on refresh | `StoryForm.tsx` | `sessionStorage` draft keyed by `story.id` or `new` |
| W-12 | **Category filter on Home refetches but doesn't clear search** — inconsistent filter state | `Home.tsx` | "Clear all filters" resets both |
| W-13 | **Admin pending count fetched twice** — `fetchPendingCount` + `setPendingCount(data.length)` | `Admin.tsx:23–48` | Single source of truth |
| W-14 | **No writer attribution on story detail** — readers can't see author | `StoryDetail.tsx` | Optional: show username if profile join exists |
| W-15 | **Age gate stores forever in localStorage** — no re-verify option | `AgeGate.tsx` | Acceptable; document in footer |

---

## P2 — Design & layout weaknesses

| ID | Issue | Location | Recommendation |
|----|-------|----------|----------------|
| D-01 | **Monolithic CSS** — 465 lines, duplicate selectors, no BEM/component scoping | `index.css` | Split into `tokens.css`, `layout.css`, `components/*.css` OR adopt CSS modules per component |
| D-02 | **No focus-visible styles** — buttons/links rely on browser default; inputs use `outline: none` | `index.css:132` | Add `:focus-visible` ring using `--accent-gold` |
| D-03 | **No reduced-motion** — `fadeIn`, spinner, card hover always run | `index.css` | `@media (prefers-reduced-motion: reduce)` |
| D-04 | **Hero has no CTAs** — missed conversion | `Home.tsx:60–76` | Add "Browse stories" + "Submit a tale" (writer-gated) |
| D-05 | **`hero.png` asset unused** — wasted visual opportunity | `src/assets/hero.png` | Optional hero background or OG image |
| D-06 | **Footer is minimal** — no nav links, legal, or social | `Footer.tsx` | Add compact sitemap + 18+ disclaimer |
| D-07 | **Reading progress bar above navbar** — z-index 200 vs navbar 100 | `index.css:275`, `69–72` | Put progress at top edge below navbar (top: navbar height) or integrate into navbar |
| D-08 | **Mobile nav backdrop transparent** — menu floats without dimming | `index.css:431–434` | `background: rgba(0,0,0,0.6)` |
| D-09 | **Native `<select>` styling** — inconsistent across OS/browsers | `StoryFilters.tsx`, forms | Custom select or consistent `appearance` rules |
| D-10 | **Story paragraph `text-align: justify`** — poor readability on narrow screens | `index.css:288` | `justify` only ≥768px; `left` on mobile |
| D-11 | **theme-color mismatch** — `#0a0a0a` vs `--bg-deep: #080808` | `index.html:8` | Align to `--bg-deep` |
| D-12 | **No loading skeletons** — every page shows spinner | all pages | Card skeleton grid, story header skeleton |
| D-13 | **Empty states lack illustration/icon** — dashed box only | `index.css:417–421` | Consistent empty-state component with icon |
| D-14 | **Modal sizing** — crop modal 640px, review 720px; no mobile header stickiness polish | modals | Full-bleed mobile modals, sticky footer actions |
| D-15 | **Typography scale not systematic** — ad-hoc `clamp` and rem values | `index.css` | Type scale tokens: `--text-xs` … `--text-3xl` |
| D-16 | **Spacing scale not systematic** — mixed rem values | `index.css` | `--space-1` … `--space-8` (4px base) |

---

## P3 — Accessibility

| ID | Issue | Fix |
|----|-------|-----|
| A-01 | Modals lack **focus trap** and **focus restore** | Add `focus-trap` utility or `@radix-ui/react-dialog` pattern |
| A-02 | Modal overlay click closes without confirmation during crop | Consider "Discard changes?" if transform changed |
| A-03 | Gallery keyboard nav is **global** — arrow keys work even when focus is in story text | Gate on gallery `tabIndex={0}` focus |
| A-04 | Skip-to-main link missing | Add visually hidden skip link in `MainLayout` |
| A-05 | Status badges rely on color alone | Add text + `aria-label` |
| A-06 | `role="listbox"` on thumb strip but no keyboard selection | Use `role="tablist"` consistently (gallery already does) |
| A-07 | Form errors not linked via `aria-describedby` | Wire `form-error` id to inputs |

---

## P4 — Performance & robustness

| ID | Issue | Fix |
|----|-------|-----|
| P-01 | Stories page loads all rows into memory | Pagination |
| P-02 | Home fetches count + data in parallel (good) but re-fetches on every category change | Consider stale-while-revalidate cache |
| P-03 | No error boundary — runtime errors white-screen | Add `ErrorBoundary` in `main.tsx` |
| P-04 | No route-level code splitting | `React.lazy` for Admin, Submit, EditStory |
| P-05 | Image crop test harness uncommitted | Keep `scripts/crop-test/` for regression |

---

## Proposed design system (rebuild target)

### Layout regions

```
┌─────────────────────────────────────────────────────────┐
│  [Reading progress — optional, 2px, below navbar]       │
├─────────────────────────────────────────────────────────┤
│  STICKY NAV  Brand | Home Stories [Profile Submit Admin]│
│              ─────────────────────────────  Sign in     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   PAGE HERO (optional) — title, subtitle, actions       │
│                                                         │
│   CONTENT AREA — max 1200px (grid) / 720px (reading)    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  FOOTER — brand, links, 18+, copyright, ad slot         │
└─────────────────────────────────────────────────────────┘
```

### Token additions (extend `:root`)

```css
/* Spacing */
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;

/* Type scale */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 2rem;

/* Layout */
--navbar-height: 3.25rem;
--content-padding-x: clamp(1rem, 4vw, 1.5rem);

/* Focus */
--focus-ring: 0 0 0 2px var(--bg-deep), 0 0 0 4px var(--accent-gold-soft);

/* Surfaces */
--surface-0: var(--bg-deep);
--surface-1: var(--bg-primary);
--surface-2: var(--bg-card);
--surface-3: var(--bg-elevated);
```

### Component targets

| Component | Rebuild priority | Key changes |
|-----------|-------------------|-------------|
| `Navbar` | High | Visible mobile overlay, animated drawer, styled auth loading |
| `StoryCard` | High | Image placeholder, consistent aspect ratio, optional badge |
| `Profile` | High | Fix grid: avatar + info row, stats row, full-width CTA |
| `StoryFilters` | Medium | Results meta, clear-filters chip, sticky on desktop |
| `StoryForm` | Medium | Inline validation, section dividers, sticky submit bar |
| `StoryMediaUploader` | High | Re-crop, persisted cover selection, discard crop warning |
| `StoryReviewModal` | Medium | Full gallery, writer email, word count |
| `AgeGate` | Low | Subtle entrance animation, focus trap |
| `Footer` | Medium | Multi-column links |
| `EmptyState` | Medium | New shared component |
| `PageHeader` | Medium | New shared component (title, subtitle, actions slot) |
| `Skeleton` | Medium | Card + text line variants |

---

## Implementation phases

### Phase 1 — Bug fixes (1 day) ✅ DONE
**Goal:** Nothing visibly broken.

- [x] B-01 Fix `profile-card` grid (`grid-template-columns: auto 1fr;` + responsive stack)
- [x] B-02 Consolidate `.my-submission-card` rules; enforce row layout ≥640px
- [x] B-03 Edit cancel → `/profile` for writers
- [x] B-04 Rejected stories: show "Edit & resubmit" when `status === 'rejected'`
- [x] B-05 Crop dismiss: remove draft or block submit until cover cropped
- [x] B-06 Use `SafeImage` in `StoryMediaGallery`
- [x] B-07 Add `story-card-image` placeholder in `StoryCard`
- [x] B-08 Add `.auth-loading` styles
- [x] B-09 Add `StoryMediaGallery` or thumb strip in `StoryReviewModal`
- [x] B-10 Centralize scroll-lock in `useBodyScrollLock(count)` hook

**Files:** `index.css`, `Profile.tsx`, `EditStory.tsx`, `StoryCard.tsx`, `StoryMediaGallery.tsx`, `StoryMediaUploader.tsx`, `StoryReviewModal.tsx`, `Navbar.tsx`, new `hooks/useBodyScrollLock.ts`

---

### Phase 2 — Workflow polish (1 day) ✅ DONE
**Goal:** Every user path has a clear next step.

- [x] W-01 Unify search: move search to `/stories` only OR add server `ilike` query
- [x] W-02 Home shows max 8 latest; link "View all →"
- [x] W-03 Add results count component (`ResultsMeta`)
- [x] W-04 Paginate stories (24 per page, load-more)
- [x] W-05 Success screens with explicit buttons (no auto-redirect)
- [x] W-06 Edit success navigation links
- [x] W-07–W-08 Cover selection for all thumbs + re-crop
- [x] W-09 Reset `signingIn` on `user` change
- [x] W-11 Form draft autosave (`sessionStorage`)
- [x] W-12 Clear filters on empty state (Stories + Home)

**Files:** `Home.tsx`, `Stories.tsx`, new `components/ResultsMeta.tsx`, `Submit.tsx`, `EditStory.tsx`, `StoryMediaUploader.tsx`, `StoryForm.tsx`, `Navbar.tsx`

---

### Phase 3 — Design system & a11y (1–2 days) ✅ DONE
**Goal:** Professional, accessible, cohesive.

- [ ] D-01 Split CSS or add CSS modules (incremental) — deferred; tokens added to `index.css`
- [x] D-02–D-03 Focus-visible + reduced-motion
- [x] D-04 Hero CTAs
- [x] D-06 Footer links
- [x] D-07 Reading progress position fix
- [x] D-08 Mobile nav overlay
- [x] D-10 Responsive text alignment
- [x] D-11 theme-color fix
- [x] D-12–D-13 Skeleton + EmptyState components
- [x] D-15–D-16 Token scale
- [x] A-01 Focus trap (`useFocusTrap`) on modals
- [x] A-03 Gallery keyboard gated on focus
- [x] A-04 Skip-to-main link
- [x] A-05 Status badge `aria-label`
- [x] A-06 Thumb strip uses `role="tablist"`
- [ ] A-02 Crop discard confirmation — deferred
- [ ] A-07 Form `aria-describedby` — deferred

**Files:** `index.css` (or split), `index.html`, `Home.tsx`, `Footer.tsx`, `MainLayout.tsx`, new `components/EmptyState.tsx`, `components/Skeleton.tsx`, `components/PageHeader.tsx`

---

### Phase 4 — Layout rebuild (1–2 days, optional polish) — PARTIAL
**Goal:** Magazine-quality reading site.

- [x] Home: featured story hero card (latest)
- [ ] Stories: sidebar filters on desktop, drawer on mobile
- [ ] Story detail: share button, improved related section
- [x] Profile: tabbed sections (All / Live / Pending / Rejected)
- [ ] Admin: table view option + bulk actions (future)
- [ ] OG/meta tags per story route (requires small SEO helper)
- [x] Error boundary + lazy routes

---

## File change map

| File | Phase | Changes |
|------|-------|---------|
| `src/index.css` | 1–3 | Bug fixes, tokens, focus, layout corrections |
| `src/pages/Profile.tsx` | 1–2 | Rejected flow, layout |
| `src/pages/EditStory.tsx` | 1–2 | Cancel route, success UI |
| `src/pages/Home.tsx` | 2–4 | Limit results, hero CTAs |
| `src/pages/Stories.tsx` | 2 | Pagination, results meta |
| `src/components/StoryCard.tsx` | 1 | Image fallback |
| `src/components/StoryMediaGallery.tsx` | 1 | SafeImage |
| `src/components/StoryMediaUploader.tsx` | 1–2 | Crop workflow |
| `src/components/StoryReviewModal.tsx` | 1 | Gallery preview |
| `src/components/Navbar.tsx` | 1–3 | Auth loading, overlay |
| `src/components/Footer.tsx` | 3 | Nav links |
| `src/components/MainLayout.tsx` | 3 | Skip link |
| `src/hooks/useBodyScrollLock.ts` | 1 | **New** — scroll lock |
| `src/components/EmptyState.tsx` | 3 | **New** |
| `src/components/Skeleton.tsx` | 3 | **New** |
| `src/components/PageHeader.tsx` | 3 | **New** |
| `src/components/ResultsMeta.tsx` | 2 | **New** |

---

## Verification checklist

After each phase, manually verify:

1. **Mobile (375px):** Nav open/close, story read, form submit, crop modal drag/zoom
2. **Tablet (768px):** Grid columns, profile card, admin tabs
3. **Desktop (1280px):** Full layout, reading width, modal centering
4. **Keyboard:** Tab through nav, forms, modals; Escape closes modals
5. **Auth flows:** Sign in → submit → profile → edit pending → admin approve
6. **Edge cases:** Story without image, rejected story, broken image URL, age gate first visit
7. **Build:** `npm run lint` + `npm run build` pass
8. **Crop regression:** `node scripts/test-crop-modal.mjs` (if Playwright available)

---

## Quick wins (< 2 hours)

If time is limited, do these first for maximum visible improvement:

1. Fix profile card grid (B-01)
2. Fix my-submission card CSS conflict (B-02)
3. Add story card image placeholder (B-07)
4. Add hero CTAs (D-04)
5. Mobile nav dark backdrop (D-08)
6. Add `:focus-visible` rings (D-02)
7. Rejected story edit button (B-04)

---

## Open questions for product owner

1. **Home vs Stories:** Should home search be removed entirely?
2. **Rejected stories:** Can writers edit and auto-resubmit to pending, or need new submission?
3. **Author attribution:** Show writer username on published stories?
4. **Design direction:** Keep dark romance aesthetic or shift toward editorial/magazine (lighter accents, more whitespace)?
5. **Pagination:** Infinite scroll or numbered pages?

---

## Related uncommitted work

Git shows in-progress crop modal fixes (good direction):

- `ImageCropModal.tsx` — `useLayoutEffect` + non-passive wheel listener (fixes scroll/zoom)
- `index.css` — `overscroll-behavior: contain` on crop viewport
- `scripts/crop-test/` — Playwright regression harness

**Action:** Commit crop fixes as part of Phase 1 B-05/B-10 work.

---

*This document is the working artifact. Check off items as implemented; update grades after each phase.*