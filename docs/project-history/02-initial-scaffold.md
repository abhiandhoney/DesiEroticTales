# 02 — Initial Scaffold (First Build)

**When:** July 6, 2026 (first session)  
**Where:** `/home/troy/DesiEroticTales`

## What was done

1. Created Vite + React + TypeScript project:
   ```bash
   npm create vite@latest . -- --template react-ts
   ```

2. Installed dependencies:
   ```bash
   npm install
   npm install @supabase/supabase-js react-router-dom
   ```

3. Created full folder structure:
   - `src/pages/` — Home, Stories, StoryDetail, Submit, Admin
   - `src/components/` — Navbar, Footer, AgeGate, StoryCard, ReadingProgress, ProtectedRoute
   - `src/lib/supabase.ts`
   - `src/types/index.ts`
   - `src/hooks/useAuth.ts`
   - `supabase/migrations/001_initial_schema.sql`

4. Created `.env` with Supabase keys

5. Added Cloudflare config:
   - `public/_redirects` — SPA fallback `/* /index.html 200`
   - `public/_headers` — security + cache headers

6. Built dark seductive theme in `src/index.css` (~500 lines)

7. Verified production build: `npm run build` → `dist/` OK

8. Git init + first commit:
   ```
   3f7988d Initial DesiEroticTales platform — Vite + React + Supabase
   ```

## What failed in this session

- **GitHub push** — no credentials (`could not read Username for github.com`)
- **Supabase migration** — SQL file created but not confirmed run in dashboard
- **Cloudflare tunnel** — config created at `~/.cloudflared/config.yml` but credentials JSON missing
- **Preview on 8080** — worked locally; tunnel never connected