const STORAGE_KEY = 'det-viewer-hash';

export function getViewerHash(): string {
  if (typeof window === 'undefined') return '';
  try {
    let hash = sessionStorage.getItem(STORAGE_KEY);
    if (!hash) {
      hash = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, hash);
    }
    return hash;
  } catch {
    return crypto.randomUUID();
  }
}