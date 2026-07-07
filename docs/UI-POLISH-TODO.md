# UI Polish TODO — Story actions & alignment

**Last updated:** July 7, 2026  
**Context:** Appreciate button looked like a dead icon (especially for authors/admins on own stories). Story header/footer actions misaligned on mobile.

---

## P7 — Story action bar (appreciate + share)

- [x] P7-01 `AppreciateButton` React component — interactive, author-readonly, guest, loading variants
- [x] P7-02 `StoryActionBar` — unified appreciate + share row; header + footer layouts
- [x] P7-03 `ShareButton` visual parity — icon + matching `action-btn` styles
- [x] P7-04 Author/own-story UX — clear readonly pill + hint (not a broken icon)
- [x] P7-05 Reaction loading state — skeleton while session/reaction loads
- [x] P7-06 Toast on appreciate failure
- [x] P7-07 Mobile touch targets (min 44px) + full-width stack in story footer
- [x] P7-08 `StoryDetail` — use `StoryActionBar` in header and footer

**Status:** ✅ Complete — commit pending

**Note for admins:** You cannot appreciate your own stories (DB rule). On your stories you see a readonly pill: “X appreciations on your story”. To test the interactive button, open another writer’s approved story.

---

## P8 — Other misaligned / weak UI (audit)

- [x] P8-01 `story-end-footer` — column layout; prompt above actions
- [x] P8-02 Header uses same `StoryActionBar` as footer
- [x] P8-03 `LikeStat` in story cards — smaller icon aligned to meta row
- [x] P8-04 Featured story CTA — `LikeStat` inline (prior session)
- [ ] P8-05 `home-cta-strip` — button alignment on narrow screens (verify on device)
- [ ] P8-06 Navbar user menu keyboard a11y (from full audit)
- [ ] P8-07 Mobile nav focus trap (from full audit)

**Status:** 🔄 Partial — P8-05–07 queued

---

## Verification

- [x] P7-V1 `npm run build` passes
- [ ] P7-V2 Manual: guest sees sign-in CTA; signed-in reader can toggle appreciate
- [ ] P7-V3 Manual: author on own story sees readonly pill with label (not icon-only)
- [ ] P7-V4 Manual: mobile 375px — footer actions stack full-width