# 01 — Project Overview

## What is DesiEroticTales?

A seductive, high-engagement **Telugu + Desi erotic story platform** built for the free tier:

- **Readers** browse and read approved stories (no login required)
- **Writers** sign in with Google and submit stories for moderation
- **Admin** (one person) approves or rejects submissions
- **Images** stored in Supabase Storage (`story-images` bucket)
- **Ads** — Adsterra placeholder slots in code (not yet wired)
- **UI** — dark mode, slow-burn aesthetic, Telugu + English fonts, 18+ age gate

## Core features implemented

- [x] Home page with hero, story grid, search, category filters
- [x] Stories listing page with sort (newest / popular)
- [x] Story detail page with reading progress bar + related stories
- [x] Submit page (writers) with title, category, content, optional image upload
- [x] Admin moderation panel (approve / reject / unpublish)
- [x] Google OAuth via Supabase (frontend ready; provider must be enabled in dashboard)
- [x] Age gate modal (localStorage `desierotictales_age_verified`)
- [x] Cloudflare Pages ready (`_redirects`, `_headers`, static `dist/` build)
- [ ] AI-generated images per story (placeholder comment in Submit.tsx)
- [ ] Adsterra scripts (placeholder comments only)
- [ ] Production deploy to Cloudflare Pages (config documented, not confirmed live)

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Vite 8 + React 19 + TypeScript |
| Routing | react-router-dom v7 (BrowserRouter) |
| Backend | Supabase (Auth, Postgres, Storage, RLS) |
| Hosting | Cloudflare Pages (static export) |
| Tunnel (dev) | cloudflared → desierotictales.work.gd → localhost:8080 |

## Supabase project (exact credentials)

- **URL:** `https://totwotuotvhpwturwgkc.supabase.co`
- **Project ref:** `totwotuotvhpwturwgkc`
- **Anon key:** `sb_publishable_1bouZE0Nz3MVLiQmH4hW8Q_obbNmhAl`
- **Never expose** `service_role` key in frontend

## Story categories

`Aunty`, `Akka-Chelli`, `Friend`, `Office`, `Fantasy`, `Neighbor`, `Cousin`, `College`, `MILF`, `Other`

## Story statuses

`pending` → `approved` | `rejected`