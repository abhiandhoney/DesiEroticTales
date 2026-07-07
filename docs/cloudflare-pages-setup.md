# Cloudflare Workers Builds — Deploy Fix

This project uses **Cloudflare Workers Builds** (not classic Pages-only hosting).

## Required dashboard settings

**Workers & Pages → desierotictales → Settings → Build**

| Setting | Value |
|---------|-------|
| **Build command** | `npm run build` |
| **Deploy command** | `npm run deploy` |
| **Root directory** | *(empty)* |

> Deploy command **cannot be empty** on Workers Builds.  
> Do **NOT** use `npx wrangler deploy` alone — use `npm run deploy` so wrangler runs from `node_modules`.

## Build variables (required for Vite)

Add under **Build variables and secrets**:

```
VITE_SUPABASE_URL=https://totwotuotvhpwturwgkc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_1bouZE0Nz3MVLiQmH4hW8Q_obbNmhAl
VITE_ADMIN_EMAIL=<your-admin-email>
```

These are baked into the JS bundle at build time.

## What `wrangler.toml` does

```toml
[assets]
directory = "./dist"
not_found_handling = "single-page-application"
```

- Serves static files from `dist/` after `npm run build`
- SPA mode: all routes fall back to `index.html` (React Router works)

## Expected successful build log

```
npm run build
✓ built in Xms
Success: Build command completed
npm run deploy
wrangler deploy
Success: Deploy command completed
```

## Push changes then retry deploy

```bash
git add wrangler.toml package.json package-lock.json docs/
git commit -m "fix: add wrangler.toml and deploy script for Cloudflare Workers Builds"
git push origin main
```