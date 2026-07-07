# Next Phase — Implementation TODO

**Last updated:** July 7, 2026  
**Prerequisite:** Run Supabase migrations `004`–`008` before testing social features.

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

## Deploy checklist

- [ ] Run migrations `004`–`008` in Supabase SQL Editor (in order)
- [ ] Smoke test: sign-in, edit profile + avatar, follow writer, share story
- [ ] Confirm Cloudflare env vars (`VITE_SUPABASE_*`, `VITE_ADMIN_EMAIL`)