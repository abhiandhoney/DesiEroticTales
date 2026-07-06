# 04 — Full Application Build

**When:** July 6, 2026 (after clean reset)  
**Commit:** `a4c2336 feat: full DesiEroticTales site — pages, components, Supabase auth`

## Pages built

| File | Route | Purpose |
|------|-------|---------|
| `src/pages/Home.tsx` | `/` | Hero, latest approved stories, search, category chips |
| `src/pages/Stories.tsx` | `/stories` | Full browse, sort newest/popular, filters |
| `src/pages/StoryDetail.tsx` | `/story/:id` | Reading view, view counter RPC, related stories |
| `src/pages/Submit.tsx` | `/submit` | Writer form — title, category, content, image upload |
| `src/pages/Admin.tsx` | `/admin` | Pending/all tabs, approve/reject/unpublish |

## Components built

| File | Purpose |
|------|---------|
| `AgeGate.tsx` | 18+ modal, localStorage persistence |
| `Navbar.tsx` | Brand, nav links, Google sign in/out |
| `Footer.tsx` | Tagline, Adsterra placeholder |
| `StoryCard.tsx` | Grid card with teaser, category, views |
| `ReadingProgress.tsx` | Fixed top progress bar on scroll |
| `ProtectedRoute.tsx` | Guards `/submit` (writer) and `/admin` (admin) |

## Hooks & types

- `src/hooks/useAuth.ts` — session, profile fetch, `isAdmin` / `isWriter`, Google OAuth helpers
- `src/types/index.ts` — `Story`, `Profile`, `STORY_CATEGORIES`, status types

## App wiring

`src/App.tsx` uses `BrowserRouter` with all routes. Age gate wraps entire app.

## Styling

`src/index.css` — full dark theme:
- Colors: deep black `#080808`, accent red `#a61e3c`, gold `#d4af37`
- Fonts: Cormorant Garamond (serif), Inter (sans), Noto Sans Telugu
- Mobile-first responsive breakpoints

## index.html

Google Fonts preconnect + meta description + theme-color `#0a0a0a`

## Adsterra placeholders

Search codebase for `ADSTERRA` — slots in:
- `index.html` (head)
- `App.tsx` (global)
- `Footer.tsx`
- `Home.tsx`, `Stories.tsx`, `StoryDetail.tsx`

## Build result

```
dist/index.html
dist/assets/index-*.css  (~10.6 KB)
dist/assets/index-*.js   (~454 KB)
```

Command: `npm run build` — **passes**