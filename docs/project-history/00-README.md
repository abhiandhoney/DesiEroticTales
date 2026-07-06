# DesiEroticTales — Project History (AI Handoff Index)

> **Read this folder first** if you are a new AI agent picking up this project.
> These files document every major step taken during initial development.

## Quick facts

| Item | Value |
|------|-------|
| **Project** | DesiEroticTales — Telugu + Desi erotic story platform |
| **Repo** | https://github.com/abhiandhoney/DesiEroticTales.git |
| **Local path** | `/media/sf_X_DRIVE/DesiEroticTales` (moved from `/home/troy/DesiEroticTales`) |
| **Stack** | Vite 8 + React 19 + TypeScript + Supabase + React Router |
| **Deploy target** | Cloudflare Pages (static `dist/`) |
| **Domain (planned)** | desierotictales.qd.je / desierotictales.work.gd (tunnel) |

## Document index

| File | What it covers |
|------|----------------|
| [01-project-overview.md](./01-project-overview.md) | Goals, features, tech stack |
| [02-initial-scaffold.md](./02-initial-scaffold.md) | First Vite project creation |
| [03-clean-reset.md](./03-clean-reset.md) | Full cleanup and fresh scaffold |
| [04-full-application-build.md](./04-full-application-build.md) | Pages, components, styling |
| [05-supabase-setup.md](./05-supabase-setup.md) | SQL migration, RLS, storage |
| [06-auth-and-routes.md](./06-auth-and-routes.md) | Google OAuth, protected routes |
| [07-cloudflare-deployment.md](./07-cloudflare-deployment.md) | Pages config, tunnel, headers |
| [08-move-to-x-drive.md](./08-move-to-x-drive.md) | VM → shared folder migration |
| [09-current-state-and-next-steps.md](./09-current-state-and-next-steps.md) | What's done vs pending |
| [10-git-commit-history.md](./10-git-commit-history.md) | All commits and branches |
| [11-folder-structure.md](./11-folder-structure.md) | Full file tree explained |
| [12-environment-variables.md](./12-environment-variables.md) | `.env` keys and where used |
| [13-vboxsf-npm-fix.md](./13-vboxsf-npm-fix.md) | **npm EPERM/symlink fix for X_DRIVE** |
| [14-status-report.md](./14-status-report.md) | **Full honest project status report** |

## First commands for a new agent

```bash
cd /media/sf_X_DRIVE/DesiEroticTales
npm install          # node_modules not on shared drive — must reinstall
npm run dev          # http://localhost:5173
npm run build        # outputs dist/ for Cloudflare Pages
```

## Critical pending items (as of last session)

1. **Supabase SQL migration** — run `supabase/migrations/001_initial_schema.sql` in dashboard if not done
2. **Google OAuth** — enable in Supabase Auth providers
3. **Admin email** — `abhi.and.honey@gmail.com` (set in Cloudflare Build vars too)
4. **Cloudflare tunnel credentials** — `~/.cloudflared/*.json` was missing last check
5. **GitHub push** — commits exist locally; push attempted multiple times; user logged into `gh` CLI