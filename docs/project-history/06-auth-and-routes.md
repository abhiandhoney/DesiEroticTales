# 06 — Auth & Routes

## Supabase client

**File:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

> User explicitly requested this minimal format (commit `b83598f`).

## Google OAuth flow

1. User clicks **Sign in with Google** in `Navbar.tsx`
2. `signInWithGoogle()` in `useAuth.ts` calls:
   ```typescript
   supabase.auth.signInWithOAuth({
     provider: 'google',
     options: { redirectTo: `${window.location.origin}/` },
   })
   ```
3. Supabase handles OAuth redirect
4. On return, `onAuthStateChange` fires → profile fetched from `profiles` table

## Admin detection

In `useAuth.ts`:
```typescript
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL ?? '';
const isAdmin = profile?.role === 'admin' || user?.email === ADMIN_EMAIL;
```

Either DB role **or** matching email grants admin access.

## Route map

| Path | Component | Access |
|------|-----------|--------|
| `/` | Home | Public |
| `/stories` | Stories | Public |
| `/story/:id` | StoryDetail | Public (approved only) |
| `/submit` | Submit | Logged-in writers (`ProtectedRoute requireWriter`) |
| `/admin` | Admin | Admin only (`ProtectedRoute requireAdmin`) |

## How to log in (user instructions)

1. Open site → accept 18+ age gate
2. Click **Sign in with Google** (top right)
3. Complete Google consent
4. Redirected back — navbar shows username
5. **Submit** link appears for all logged-in users
6. **Admin** link appears only for admin role/email

## Sign out

Navbar **Sign out** button → `supabase.auth.signOut()`