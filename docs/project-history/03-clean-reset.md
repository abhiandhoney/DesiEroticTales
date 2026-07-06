# 03 — Clean Reset

**When:** July 6, 2026 (user requested fresh start for Cloudflare Pages)  
**Where:** `/home/troy/DesiEroticTales`

## Why

User wanted to start completely clean before building properly for Cloudflare Pages. Old folder had partial setup mixed with first build.

## Safe cleanup performed

```bash
cd /home/troy/DesiEroticTales

# Removed (safe — regenerated later)
rm -rf node_modules
rm -rf dist
rm -f .env
rm -f package-lock.json

# Removed old app files (kept .git and supabase/)
rm -rf src public index.html vite.config.ts tsconfig*.json package.json README.md .oxlintrc.json .env.example
```

**Kept intentionally:**
- `.git/` — preserve git history
- `supabase/` — SQL migration and config.toml

## Fresh Vite scaffold

`npm create vite` refused non-empty directory, so scaffold was created in temp and copied:

```bash
npm create vite@latest tmp/desierotictales-fresh -- --template react-ts
cp -r tmp/desierotictales-fresh/* .
rm -rf tmp
npm install
npm install @supabase/supabase-js react-router-dom
```

## Minimal setup after reset

- Recreated `.env` with Supabase keys
- Created `src/lib/supabase.ts` (minimal client)
- Created empty `src/pages/` and `src/components/` with `.gitkeep`
- Simplified `App.tsx` to placeholder
- Added `public/_redirects` for Cloudflare SPA routing
- Build verified OK

## Git state after reset (before full rebuild)

Uncommitted changes vs commit `3f7988d`. User was advised to commit as `"reset: clean Vite + React + TS scaffold"`.