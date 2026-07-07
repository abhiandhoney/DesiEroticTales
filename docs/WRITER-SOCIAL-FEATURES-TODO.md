# Writer Social Features — Implementation TODO

**Last updated:** July 6, 2026  
**Artifact:** Living checklist — update checkboxes as phases complete.

---

## Phase A — User menu dropdown

- [x] A-01 Create `UserMenu.tsx` dropdown component
- [x] A-02 Remove Profile from main `navbar-links`
- [x] A-03 Move Sign out into dropdown
- [x] A-04 Style `.user-menu-trigger` / `.user-menu-dropdown`
- [x] A-05 Mobile menu account section

**Status:** ✅ Complete

---

## Phase B — Username onboarding & edit profile

- [x] B-01 Migration `004_profiles_social.sql`
- [x] B-02 Update `Profile` type + `handle_new_user` trigger
- [x] B-03 `src/lib/username.ts` validation + reserved names
- [x] B-04 `OnboardingUsername.tsx` + route `/onboarding/username`
- [x] B-05 `ProtectedRoute` gate until `onboarding_complete`
- [x] B-06 Full `EditProfile.tsx` (username, display name, bio)
- [x] B-07 Username uniqueness check (case-insensitive RPC + fallback)
- [x] B-08 Username change cooldown (30 days)
- [x] B-09 `refreshProfile()` on AuthProvider after save
- [x] B-10 Block any username containing `admin` (except exact `admin` for `VITE_ADMIN_EMAIL`)
- [x] B-11 Migration `007_username_admin_rules.sql` (server-side enforcement)
- [x] B-12 Cooldown bypass when site owner reclaims `@admin`

**Status:** ✅ Complete  
**Deploy note:** Run migrations `004`–`007` in Supabase SQL Editor.

---

## Phase C — Story reactions (likes only in UI)

- [x] C-01 Migration `005_story_reactions.sql` + count triggers
- [x] C-02 Update `Story` type (`like_count`, `dislike_count`)
- [x] C-03 `useStoryReaction.ts` hook
- [x] C-04 `StoryReactions.tsx` — **likes only** (dislikes hidden)
- [x] C-05 Integrate on `StoryDetail.tsx`
- [x] C-06 Like count badge on `StoryCard.tsx`
- [x] C-07 RLS: no self-reactions, approved stories only
- [ ] C-08 Public dislike button (deferred — protect writers)

**Status:** ✅ Complete (likes only)

---

## Phase D — Rankings & competitions

- [x] D-01 Migration `006_rankings.sql` (`is_editors_choice`, leaderboard view)
- [x] D-02 Home: Story of the Week section
- [x] D-03 Home: Editor's Choice row
- [x] D-04 Stories: sort by Top rated / Trending (30d)
- [x] D-05 `/writers` leaderboard page
- [x] D-06 Admin: toggle Editor's Choice on cards
- [x] D-07 `src/lib/rankings.ts` query helpers

**Status:** ✅ Complete

---

## Phase E — Public writer profiles

- [x] E-01 `WriterProfile.tsx` at `/writer/:username`
- [x] E-02 Public stats (stories, total likes, member since)
- [x] E-03 Approved stories grid on writer page
- [x] E-04 `StoryDetail` author link → `/writer/:username`
- [x] E-05 `UserMenu` + Profile link to public profile

**Status:** ✅ Complete

---

## Verification (all phases)

- [x] `npm run lint` passes (warnings only)
- [x] `npm run build` passes
- [ ] Onboarding blocks `/submit` until username set *(requires migration 004 deployed)*
- [ ] Duplicate username rejected *(requires migration 004 deployed)*
- [ ] Like/dislike toggles and counts update *(requires migration 005 deployed)*
- [ ] Writer cannot like own story *(requires migration 005 deployed)*
- [ ] Public writer page loads without auth *(requires migration 004 deployed)*

---

## Decisions locked for implementation

| Decision | Choice |
|----------|--------|
| Dislikes | **Deferred** — likes only in UI; DB ready for future |
| Username cooldown | 30 days between changes |
| Editor's Choice | Admin manual toggle |
| Leaderboard | All-time top writers |

---

## New files created

| File | Phase |
|------|-------|
| `supabase/migrations/004_profiles_social.sql` | B |
| `supabase/migrations/005_story_reactions.sql` | C |
| `supabase/migrations/006_rankings.sql` | D |
| `src/lib/username.ts` | B |
| `src/lib/profile.ts` | B |
| `src/lib/rankings.ts` | D |
| `src/pages/OnboardingUsername.tsx` | B |
| `src/pages/EditProfile.tsx` | B |
| `src/pages/WriterProfile.tsx` | E |
| `src/pages/Writers.tsx` | D |
| `src/hooks/useStoryReaction.ts` | C |
| `src/components/StoryReactions.tsx` | C |

---

## Next step for production

Run in Supabase SQL Editor (in order):

1. `004_profiles_social.sql`
2. `005_story_reactions.sql`
3. `006_rankings.sql`
4. `007_username_admin_rules.sql`

Then test: sign in → onboarding → like a story → admin Editor's Choice → `/writers` leaderboard.