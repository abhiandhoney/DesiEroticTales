# 11 — Folder Structure

**Root:** `/media/sf_X_DRIVE/DesiEroticTales`

```
DesiEroticTales/
├── .env                          # Local secrets (GITIGNORED)
├── .env.example                  # Template for env vars
├── .gitignore
├── index.html                    # Entry HTML + Google Fonts
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── README.md                     # Default Vite readme (not customized)
│
├── docs/
│   └── project-history/          # ← AI handoff documentation (this folder)
│       ├── 00-README.md
│       ├── 01-project-overview.md
│       ├── ... (see index)
│       └── 12-environment-variables.md
│
├── public/
│   ├── _redirects                # Cloudflare SPA routing
│   ├── _headers                  # Security + cache headers
│   ├── favicon.svg
│   └── icons.svg
│
├── supabase/
│   ├── config.toml               # Local Supabase CLI config
│   └── migrations/
│       └── 001_initial_schema.sql
│
└── src/
    ├── main.tsx                  # React entry
    ├── App.tsx                   # Router + layout
    ├── index.css                 # Full dark theme
    ├── vite-env.d.ts             # Vite env types
    │
    ├── lib/
    │   └── supabase.ts           # Supabase client (minimal)
    │
    ├── types/
    │   └── index.ts              # Story, Profile, categories
    │
    ├── hooks/
    │   └── useAuth.ts            # Auth state, Google OAuth, admin check
    │
    ├── components/
    │   ├── AgeGate.tsx
    │   ├── Navbar.tsx
    │   ├── Footer.tsx
    │   ├── StoryCard.tsx
    │   ├── ReadingProgress.tsx
    │   └── ProtectedRoute.tsx
    │
    ├── pages/
    │   ├── Home.tsx
    │   ├── Stories.tsx
    │   ├── StoryDetail.tsx
    │   ├── Submit.tsx
    │   └── Admin.tsx
    │
    └── assets/                   # Default Vite assets (mostly unused)
        ├── hero.png
        ├── react.svg
        └── vite.svg
```

## Generated / not in repo

```
node_modules/     # npm install
dist/             # npm run build
.vite/            # Vite dev cache
```