# 10 — Git Commit History

**Remote:** `https://github.com/abhiandhoney/DesiEroticTales.git`  
**Branch:** `main`

## Commits (chronological)

| Hash | Message | What changed |
|------|---------|--------------|
| `3f7988d` | Initial DesiEroticTales platform — Vite + React + Supabase | First full build: all pages, components, supabase migration, styling |
| `a4c2336` | feat: full DesiEroticTales site — pages, components, Supabase auth | Rebuilt on clean scaffold after reset |
| `b83598f` | fix: simplify supabase client per spec | `supabase.ts` minimal format; `ADMIN_EMAIL` moved to `useAuth.ts` |

## Pending commit (this session)

```
docs: add project-history for AI handoff
```

Adds `docs/project-history/*.md` — 13 files documenting full project history.

## Push status

- **Attempt 1:** `Could not resolve host: github.com` (transient DNS)
- **Attempt 2:** `could not read Username for github.com` (no credentials)
- **Attempt 3:** User completed `gh auth login` — push pending this session

## Git config notes

- Committer auto-set as `Troy <troy@troy.troy>` — may want `git config --global user.email` for proper attribution
- `.env` is gitignored — never committed
- `node_modules/`, `dist/`, `.vite/` gitignored

## Files never committed

- `.env` (secrets)
- `node_modules/`
- `dist/`
- `.vite/`