/** Supabase storage sits behind Cloudflare, which may set __cf_bm on image responses. */
export function remoteImageCrossOrigin(src: string): 'anonymous' | undefined {
  if (!src.startsWith('http')) return undefined;
  try {
    const { hostname } = new URL(src);
    if (hostname.endsWith('.supabase.co')) return 'anonymous';
  } catch {
    /* ignore malformed URLs */
  }
  return undefined;
}