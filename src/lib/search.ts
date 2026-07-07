/** Escape special chars for PostgREST .or() ilike filters. */
export function escapePostgrestIlike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export function buildStorySearchFilter(term: string): string {
  const q = `%${escapePostgrestIlike(term.trim())}%`;
  return `title.ilike.${q},teaser.ilike.${q},category.ilike.${q},content.ilike.${q}`;
}