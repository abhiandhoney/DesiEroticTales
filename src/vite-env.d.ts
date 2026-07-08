/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ADMIN_EMAIL: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_DISQUS_SHORTNAME?: string;
  readonly VITE_ADSTERRA_SLOT_TOP?: string;
  readonly VITE_ADSTERRA_SLOT_LIST?: string;
  readonly VITE_ADSTERRA_SLOT_STORY_TOP?: string;
  readonly VITE_ADSTERRA_SLOT_STORY_BOTTOM?: string;
  readonly VITE_ADSTERRA_SLOT_FOOTER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
}