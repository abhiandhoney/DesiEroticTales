# Next Phase — Implementation TODO

**Last updated:** July 7, 2026  
**Prerequisite:** Run Supabase migrations `004`–`009` before testing social features.

---

## P1 — Core social & profile

- [x] P1-01 Avatar upload on Edit Profile (WebP, storage)
- [x] P1-02 Migration `008_follows.sql` (follow writers)
- [x] P1-03 `useFollow` hook + Follow button on writer profile
- [x] P1-04 Following list on private profile page

**Status:** ✅ Complete

---

## P2 — Discovery & sharing

- [x] P2-01 Story of the Month section on Home
- [x] P2-02 Share button on Story Detail (copy link + native share)
- [x] P2-03 Per-story SEO (`usePageMeta` — title, description, OG)

**Status:** ✅ Complete

---

## P3 — Header, footer, homepage polish

- [x] P3-01 Header: Writers link, avatar in user menu, cleaner nav
- [x] P3-02 Footer: organized columns, writers link, 18+ note
- [x] P3-03 Home: monthly pick, editor's choice, CTA strip, section rhythm

**Status:** ✅ Complete

---

## P4 — Verification

- [x] P4-01 `npm run lint` passes
- [x] P4-02 `npm run build` passes
- [x] P4-03 No regressions in auth, submit, admin flows

**Status:** ✅ Complete

---

## P5 — Edit flow, teaser & permissions (July 7)

- [x] P5-01 Writers: Edit only on pending/rejected (not approved) — UI + `EditStory.tsx`
- [x] P5-02 Admin: can edit any story + change status — `StoryForm` admin status field
- [x] P5-03 RLS: writers update own pending/rejected only — migration `009_story_edit_rls.sql`
- [x] P5-04 Teaser field in Submit/Edit form, StoryCard, Home, Stories search
- [x] P5-05 Save confirmation on edit (`window.confirm`)
- [x] P5-06 Cancel button in edit mode (reuses `StoryForm`)
- [x] P5-07 `updated_at` on stories + display on Profile/Admin
- [x] P5-08 Admin email masked in UI (`src/lib/privacy.ts`)
- [ ] P5-09 E2E smoke test on live Supabase (submit → edit pending → reject → resubmit)

**Status:** 🔄 Code complete — needs live DB test

---

## Deploy checklist

- [x] Run migrations `004`–`009` in Supabase SQL Editor (in order)
- [x] Smoke test: sign-in, edit profile + avatar, follow writer, share story
- [x] Confirm Cloudflare env vars (`VITE_SUPABASE_*`, `VITE_ADMIN_EMAIL`) — never commit real email
- [x] Upload admin avatar: `public/assets/admin-avatar-unisex.jpg`