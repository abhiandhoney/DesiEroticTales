# 05 — Supabase Setup

## Migration file

**Path:** `supabase/migrations/001_initial_schema.sql`

Run in **Supabase Dashboard → SQL Editor** (or `supabase db push` if CLI linked).

## Tables

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | References `auth.users(id)` |
| username | TEXT UNIQUE | Auto-set from Google name on signup |
| role | TEXT | `'writer'` or `'admin'`, default `'writer'` |
| created_at | TIMESTAMPTZ | Auto |

### `stories`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| title | TEXT | Required |
| content | TEXT | Required |
| category | TEXT | From STORY_CATEGORIES |
| status | TEXT | `pending`, `approved`, `rejected` |
| user_id | UUID FK | References `auth.users` |
| image_url | TEXT | Optional, from Storage |
| views | INTEGER | Default 0 |
| created_at | TIMESTAMPTZ | Auto |

## RLS policies

| Policy | Rule |
|--------|------|
| Public read approved | Anyone can SELECT where `status = 'approved'` |
| Writers read own | Users can see their own stories any status |
| Admins read all | Users with `profiles.role = 'admin'` see everything |
| Writers insert | `auth.uid() = user_id` AND `status = 'pending'` |
| Writers update own pending | Only while `status = 'pending'` |
| Admins update any | Role check on `profiles` |

## Storage

- **Bucket:** `story-images` (public)
- **Upload path pattern:** `{user_id}/{timestamp}.{ext}`
- Policies: public read; authenticated insert; owner update/delete

## Functions & triggers

- `handle_new_user()` — auto-creates `profiles` row on `auth.users` INSERT
- `increment_story_views(story_id)` — SECURITY DEFINER RPC called from StoryDetail page

## Config file

`supabase/config.toml` — project ref `totwotuotvhpwturwgkc`, site_url, Google auth stub

## Manual steps still required

1. Run migration SQL in dashboard
2. **Authentication → Providers → Google** — enable, add OAuth Client ID/Secret
3. **URL Configuration:**
   - Site URL: production domain
   - Redirect URLs: `http://localhost:5173`, production URL
4. Promote admin after first login:
   ```sql
   UPDATE profiles SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = '<your-admin-email>');
   ```