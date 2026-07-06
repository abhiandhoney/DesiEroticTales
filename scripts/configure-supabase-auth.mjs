#!/usr/bin/env node
/**
 * Configures Supabase Auth redirect URLs for any deployment domain.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=your_token npm run configure-auth
 *
 * Get a token: https://supabase.com/dashboard/account/tokens
 */

const PROJECT_REF = 'totwotuotvhpwturwgkc';
const REDIRECT_URLS = [
  'http://localhost:5173/**',
  'https://**',
];

const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error(`
Supabase Auth must allow redirects from any domain.

Add these Redirect URLs in Supabase Dashboard:
  Authentication → URL Configuration → Redirect URLs

  http://localhost:5173/**
  https://**

Set Site URL to your primary production domain (or keep localhost for dev).

To apply automatically, create a personal access token and run:
  SUPABASE_ACCESS_TOKEN=your_token npm run configure-auth
`);
  process.exit(1);
}

const body = {
  site_url: 'http://localhost:5173',
  uri_allow_list: REDIRECT_URLS.join(','),
};

const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
  {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  },
);

if (!response.ok) {
  const text = await response.text();
  console.error(`Failed to update Supabase Auth config (${response.status}):`, text);
  process.exit(1);
}

const result = await response.json();
console.log('Supabase Auth config updated:');
console.log('  site_url:', result.site_url);
console.log('  uri_allow_list:', result.uri_allow_list);