# DesiEroticTales — Project Status Report

**Last updated:** July 6, 2026  
**Repo:** https://github.com/abhiandhoney/DesiEroticTales  
**Local path:** `/media/sf_X_DRIVE/DesiEroticTales`  
**Deploy:** Cloudflare Pages (connected)

> Honest assessment based on code in the repository.  
> **Frontend is built. Backend/dashboard setup must be confirmed on your side.**

---

## Summary

| Layer | Verdict |
|-------|---------|
| Frontend (UI, routes, forms) | ~95% Done |
| Supabase backend (DB, auth, storage) | SQL written — not confirmed deployed |
| Production live & end-to-end tested | Not Done |

---

## 1. Pages & Components Created

### Pages (5)

| Page | Route | Status |
|------|-------|--------|
| **Home** | `/` | Done (code) |
| **Stories** | `/stories` | Done (code) |
| **Story Detail** | `/story/:id` | Done (code) |
| **Submit** | `/submit` | Done (code) |
| **Admin** | `/admin` | Done (code) |

**Note:** There is **no separate Login page**. Login is handled via the **"Sign in with Google"** button in the Navbar.

### Components (6)

| Component | Purpose | Status |
|-----------|---------|--------|
| **Navbar** | Navigation + Google sign in/out | Done (code) |
| **Footer** | Site footer + Adsterra placeholder | Done (code) |
| **AgeGate** | 18+ age verification modal | Done (code) |
| **StoryCard** | Story preview card for grids | Done (code) |
| **ReadingProgress** | Top scroll progress bar on story page | Done (code) |
| **ProtectedRoute** | Route guard for Submit/Admin | Done (code) |

### Supporting Code

| Item | Status |
|------|--------|
| `src/hooks/useAuth.ts` | Done |
| `src/lib/supabase.ts` | Done |
| `src/types/index.ts` | Done |
| `supabase/migrations/001_initial_schema.sql` | Done (file only) |
| `docs/project-history/` (handoff docs) | Done |

---

## 2. Google Login — Fully Working?

**Status: Not Done / Needs Work** (not verified end-to-end)

### Done in code

- `signInWithGoogle()` using Supabase OAuth
- Session persistence via `getSession()` + `onAuthStateChange`
- Profile fetch from `profiles` table after login
- Sign out in Navbar

### Still required (Supabase Dashboard)

- [ ] Enable **Google** provider (Client ID + Secret from Google Cloud Console)
- [ ] Set **Site URL** and **Redirect URLs** (localhost + Cloudflare domain)
- [ ] Run SQL migration (creates `profiles` table + auto-create trigger on signup)

**Until the above is done, login will fail or redirect incorrectly.** A real Google login was not confirmed during development.

---

## 3. Story Submission Form — Saves to Supabase?

**Status: Done (code) | Not verified live**

### Done in code

- Form fields: title, category, content, optional image
- Inserts into `stories` table with `status: 'pending'`
- Validation: title min 5 chars, content min 200 chars
- Redirect to `/stories` after success

### Requires

- User logged in via Google
- Supabase migration run (`stories` table + RLS policies)
- Without DB setup, submission will show errors in the UI

---

## 4. Admin / Moderation Page?

**Status: Done (code) | Not verified live**

### Done in code

- Tabs: Pending stories / All stories
- Actions: Approve, Reject, Unpublish
- Updates `stories.status` in Supabase

### Requires

- Admin access via `profiles.role = 'admin'` **OR** `VITE_ADMIN_EMAIL` matching your Gmail
- Migration run
- At least one pending story to test moderation flow

---

## 5. Stories Fetched on Home / Stories Pages?

**Status: Done (code) | Not verified with real data**

### Done in code

- Fetches from `stories` where `status = 'approved'`
- **Home:** latest 24 stories, search, category filter
- **Stories:** full list, sort by newest or most read

### Will show empty until

- Migration is run in Supabase
- Admin approves at least one story

---

## 6. Image Upload to Supabase Storage?

**Status: Done (code) | Not verified live**

### Done in code

- Upload to `story-images` bucket
- File path: `{user_id}/{timestamp}.{ext}`
- Public URL stored in `image_url` column

### Requires

- Migration run (creates bucket + storage policies)
- User logged in

### Not done

- AI-generated images per story (placeholder comment in `Submit.tsx` only)

---

## 7. Protected Routes?

**Status: Done**

| Route | Guard | Behavior |
|-------|-------|----------|
| `/submit` | `requireWriter` | Any logged-in user |
| `/admin` | `requireAdmin` | Admin role or matching `VITE_ADMIN_EMAIL` |
| Both | — | Not logged in → redirect to `/` |

---

## 8. Still Missing or Not Working

| Item | Status |
|------|--------|
| Supabase SQL migration run in dashboard | Not confirmed |
| Google OAuth enabled in Supabase | Not confirmed |
| `VITE_ADMIN_EMAIL` set to abhi.and.honey@gmail.com | Done (code/docs) — set in Cloudflare Build vars too |
| Admin role assigned in `profiles` table | Not confirmed |
| Cloudflare Pages env vars (`VITE_SUPABASE_URL`, etc.) | Not confirmed |
| Adsterra ad scripts | Not Done (placeholders only) |
| AI-generated story images | Not Done |
| Cloudflare tunnel credentials JSON | Not Done |
| Project-specific README | Not Done (default Vite README) |
| Telugu/character fixes pushed to GitHub | Not confirmed |
| End-to-end test (login → submit → approve → read) | Not Done |

---

## 9. Known Bugs & Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| No dedicated Login page | Low | By design — Navbar handles auth |
| `useAuth.ts` import order | Low | Works but imports are messy |
| vboxsf / X_DRIVE `npm install` | Medium | Symlink errors; fixed with `.npmrc` + direct script paths |
| Empty story lists without DB | Expected | Until migration + approved stories exist |
| OAuth redirect on wrong domain | Medium | If Supabase URLs don't match Cloudflare domain |
| No browser console testing by dev | Unknown | Check console after deploy |

**No known logic bugs in React code from code review**, but nothing was fully tested against live Supabase during development.

---

## Telugu Text on Site (Reference)

| Telugu | English meaning | Where used |
|--------|-----------------|------------|
| రహస్య కథలు | Secret stories | Home hero |
| కథలు | Stories | Footer |
| అన్ని కథలు | All stories | Stories page |
| మీ కథను పంచుకోండి | Share your story | Submit page |
| వయస్సు నిర్ధారణ | Age verification | Age gate |

Telugu text uses `Noto Sans Telugu` via `.telugu-text` class. Hover tooltips show English translations.

---

## Git Commit History (Local)

| Hash | Message |
|------|---------|
| `3f7988d` | Initial DesiEroticTales platform — Vite + React + Supabase |
| `a4c2336` | feat: full DesiEroticTales site — pages, components, Supabase auth |
| `b83598f` | fix: simplify supabase client per spec |
| `1e6a91de` | fix: vboxsf npm + docs/project-history for AI handoff |

Additional commits may exist locally (Telugu/character fixes) — verify with `git log`.

---

## Fastest Path to "Actually Working"

1. **Run migration** — paste `supabase/migrations/001_initial_schema.sql` into Supabase SQL Editor → Run
2. **Enable Google OAuth** — Supabase → Authentication → Providers → Google
3. **Set redirect URLs** — `http://localhost:5173` + your Cloudflare domain
4. **Set env vars** — `.env` locally + Cloudflare Pages dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL` (your real Gmail)
5. **Make yourself admin** — after first login:
   ```sql
   UPDATE profiles SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'abhi.and.honey@gmail.com');
   ```
6. **Test flow** — Sign in → Submit story → Approve in Admin → See on Home

---

## Cloudflare Pages Settings

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 18+ |
| Custom domain | `desierotictales.qd.je` (via `public/CNAME`) |

---

## For the Next AI Agent

Read these files in order:

1. `docs/project-history/00-README.md` — index
2. `docs/project-history/14-status-report.md` — this file
3. `docs/project-history/09-current-state-and-next-steps.md` — checklist
4. `docs/project-history/05-supabase-setup.md` — database setup

```bash
cd /media/sf_X_DRIVE/DesiEroticTales
npm install    # required on vboxsf shared folder
npm run dev    # http://localhost:5173
npm run build  # outputs dist/
```

---

*Report generated from codebase review. Update this file when major milestones are completed.*