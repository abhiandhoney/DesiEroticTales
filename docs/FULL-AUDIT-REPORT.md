# DesiEroticTales — Full A→Z Audit Report

**Date:** July 7, 2026  
**Scope:** `src/`, `supabase/migrations/`, `docs/`, build/lint  
**Build:** `npm run build` ✅ · **Lint:** 11 warnings, 0 errors

---

## Executive Summary

The app is well-structured (React 19, Supabase, themed UI, custom confirm/toast). The **most critical risk** was users self-promoting to `admin` via `profiles.role` UPDATE — **fixed in migration `011_security_hardening.sql`**. Second priority: run pending migrations **`010`** and **`011`** on live Supabase.

This audit covers bugs, UI/UX, hooks, security, performance, native dialogs, schema, and lint.

---

## Fixes Applied in This Session (July 7)

| Issue | Fix |
|-------|-----|
| Native `window.confirm` on edit save | Themed `useConfirm` modal |
| Mobile menu unclickable | Z-index stack: backdrop 110, menu 120, toggle 130, navbar 200 |
| Text size buttons broken | Removed broken UI; kept readable default serif sizing |
| Like button visibility | Header + footer “Enjoyed this tale?” bar; single shared reaction state |
| Related stories | `RelatedStoriesSection` with Popular + More, paginated (4/page) |
| Share feedback | Themed toast instead of inline text |
| Duplicate reaction API calls | Lifted `useStoryReaction` to `StoryDetail` |
| Gallery arrow keys hijacking scroll | Keys only when gallery focused |
| Profile role escalation | Migration `011` trigger |
| Storage upload to any folder | Migration `011` INSERT policy |
| `.env.production` in git risk | Added to `.gitignore` |

---

## 1. Bugs & Logic Errors

| Sev | Finding | Location | Status |
|-----|---------|----------|--------|
| **Critical** | Users could set `profiles.role = 'admin'` via client UPDATE | `001_initial_schema.sql` | ✅ Fixed `011` |
| **High** | `card_image_url` column missing if `010` not run | `StoryForm.tsx` | ⏳ Run migration |
| **Medium** | PostgREST search breaks on commas in query | `Stories.tsx:52` | Open |
| **Medium** | Stories pagination race (no abort) | `Stories.tsx` | Open |
| **Medium** | `navigate()` during render in onboarding | `OnboardingUsername.tsx` | Open |
| **Low** | View count double-increment in StrictMode dev | `StoryDetail.tsx` | Open |
| **Low** | Docs say `VITE_ADMIN_EMAIL` grants admin; code uses `role` only | `docs/` | Open |

---

## 2. UI/UX

| Sev | Finding | Status |
|-----|---------|--------|
| **Fixed** | Mobile nav backdrop covered menu links | ✅ Z-index |
| **Medium** | Mobile nav no focus trap | Open |
| **Medium** | Age gate no focus trap | Open |
| **Fixed** | Gallery arrow keys global | ✅ Focus-gated |
| **Low** | Toast z-index below modals | ✅ Toast 10002 |
| **Low** | Reading progress under navbar | Acceptable |
| **Low** | User menu keyboard a11y | Open |

---

## 3. React Hooks & Memory

| Sev | Finding | Count |
|-----|---------|-------|
| **Medium** | `exhaustive-deps` on fetch functions | 6 files |
| **Medium** | `RelatedStoriesSection` no unmount cancel | 1 |
| **Low** | `setTimeout` without cleanup on navigate | Admin, EditProfile |
| **Low** | Fast Refresh warnings (hooks in providers) | 4 |

**Good patterns:** `useBodyScrollLock` ref-count, `useFocusTrap` cleanup, `AuthProvider` subscription cleanup, crop modal URL revoke.

---

## 4. Security

| Sev | Finding | Status |
|-----|---------|--------|
| **Critical** | Profile role self-escalation | ✅ `011` |
| **High** | `.env.production` may be tracked | ✅ `.gitignore` |
| **Medium** | Storage INSERT any path | ✅ `011` |
| **Medium** | `increment_story_views` no rate limit | Open |
| **Medium** | Public `profiles.role` visible | Open |
| **Low** | No CSP header | Open |
| **OK** | No `dangerouslySetInnerHTML`; story text escaped | — |

---

## 5. Performance

| Sev | Finding |
|-----|---------|
| **High** | List queries use `select('*')` including full `content` |
| **Medium** | Search fires every keystroke (no debounce) |
| **Medium** | Reaction count trigger full COUNT per change |
| **Fixed** | Duplicate reaction hooks on story page |
| **Low** | Home refetches rankings on category change |

---

## 6. Native Browser Dialogs

| Status | Notes |
|--------|-------|
| ✅ | No `alert` / `confirm` / `prompt` in `src/` |
| ✅ | Edit save uses themed confirm modal |
| ✅ | Share uses toast |
| ✅ | Age gate uses custom overlay |

---

## 7. Migrations Checklist

Run in Supabase SQL Editor **in order**:

| # | File | Purpose |
|---|------|---------|
| 004 | `004_profiles_social.sql` | Profiles, usernames |
| 005 | `005_story_reactions.sql` | Likes |
| 006 | `006_rankings.sql` | Editor's choice, leaderboard |
| 007 | `007_username_admin_rules.sql` | Admin username rules |
| 008 | `008_follows.sql` | Follow writers |
| 009 | `009_story_edit_rls.sql` | Edit RLS, `updated_at` |
| 010 | `010_card_cover.sql` | `card_image_url` |
| 011 | `011_security_hardening.sql` | Role escalation + storage |

---

## 8. Lint / Build

- **11 warnings** (exhaustive-deps + fast-refresh exports)
- **0 errors**
- **TypeScript + Vite build pass**

---

## Top 15 Remaining Actions (Priority)

1. **P0** — Run migrations `010` + `011` on live Supabase  
2. **P0** — Remove `.env.production` from git history if ever pushed; rotate keys  
3. **P1** — List queries: `select` without `content` column  
4. **P1** — Debounce Stories search (300ms)  
5. **P1** — Sanitize PostgREST `or` filter input  
6. **P1** — Fix `useCallback` + exhaustive-deps on data fetchers  
7. **P2** — Focus trap on mobile navbar + age gate  
8. **P2** — Abort controllers on async list loads  
9. **P2** — Fix onboarding render-time `navigate()`  
10. **P2** — Rate-limit `increment_story_views` RPC  
11. **P2** — Hide `role` from public profile SELECT  
12. **P2** — Add CSP to `public/_headers`  
13. **P3** — Admin panel: use toast instead of inline feedback  
14. **P3** — E2E smoke test checklist (auth, submit, like, share)  
15. **P3** — Re-crop existing stories for full vs card image split  

---

## File Inventory (src/)

| Area | Files | Health |
|------|-------|--------|
| Pages | 14 | Good; hooks deps warnings |
| Components | 25+ | Good; mobile nav fixed |
| Hooks | 8 | Good; provider export warnings |
| Lib | 12 | Good |
| Migrations | 11 | 010–011 pending deploy |

---

*Generated from line-by-line review, `npm run lint`, `npm run build`, and subagent codebase scan.*