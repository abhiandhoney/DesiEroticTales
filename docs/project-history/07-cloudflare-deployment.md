# 07 — Cloudflare Deployment

## Cloudflare Pages (production target)

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Output directory | `dist` |
| Framework | None (static Vite) |
| Node version | 18+ recommended |

### Environment variables (Cloudflare dashboard)

```
VITE_SUPABASE_URL=https://totwotuotvhpwturwgkc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_1bouZE0Nz3MVLiQmH4hW8Q_obbNmhAl
VITE_ADMIN_EMAIL=<your-admin-email>
```

### SPA routing

`public/_redirects`:
```
/*    /index.html   200
```
Copied to `dist/` on build — required for React Router client-side routes.

### Security headers

`public/_headers` — X-Frame-Options, nosniff, cache rules for assets.

## Cloudflare Tunnel (dev/staging)

**Config:** `~/.cloudflared/config.yml`

```yaml
tunnel: 34e8dac9-b632-4bb1-8c2e-977024d541c1
credentials-file: ~/.cloudflared/34e8dac9-b632-4bb1-8c2e-977024d541c1.json

ingress:
  - hostname: desierotictales.work.gd
    service: http://localhost:8080
  - service: http_status:404
```

### Tunnel status (last session)

- **Failed** — credentials JSON missing at `~/.cloudflared/34e8dac9-...json`
- Preview server on 8080 worked: `npm run build && npm run preview -- --port 8080 --host`
- Dev server default port: `5173`

### To start tunnel

```bash
# Terminal 1 — serve app
cd /media/sf_X_DRIVE/DesiEroticTales
npm run build && npm run preview -- --port 8080 --host

# Terminal 2 — tunnel (after credentials file in place)
cloudflared tunnel run
```

## Domains mentioned

- `desierotictales.qd.je` — planned production
- `desierotictales.work.gd` — tunnel hostname