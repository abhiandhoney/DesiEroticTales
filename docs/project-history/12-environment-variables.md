# 12 — Environment Variables

## `.env` (local — gitignored)

```env
VITE_SUPABASE_URL=https://totwotuotvhpwturwgkc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_1bouZE0Nz3MVLiQmH4hW8Q_obbNmhAl
VITE_ADMIN_EMAIL=abhi.and.honey@gmail.com
```

## Variable reference

| Variable | Required | Used in | Purpose |
|----------|----------|---------|---------|
| `VITE_SUPABASE_URL` | Yes | `src/lib/supabase.ts` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | `src/lib/supabase.ts` | Public anon/publishable key |
| `VITE_ADMIN_EMAIL` | Recommended | `src/hooks/useAuth.ts` | Grants admin access by email match |

## TypeScript types

Declared in `src/vite-env.d.ts`:
```typescript
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ADMIN_EMAIL: string;
}
```

## Cloudflare Pages

Set the same three variables in **Cloudflare Pages → Settings → Environment variables** for production builds.

## Security rules

- ✅ Use `anon` / publishable key in frontend
- ❌ Never put `service_role` key in `.env` with `VITE_` prefix
- ❌ Never commit `.env` to git (in `.gitignore`)

## `.env.example` (committed)

```env
VITE_SUPABASE_URL=https://totwotuotvhpwturwgkc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_ADMIN_EMAIL=abhi.and.honey@gmail.com
```

## Action required

Admin email is set to `abhi.and.honey@gmail.com` — also add this in Cloudflare Build variables.