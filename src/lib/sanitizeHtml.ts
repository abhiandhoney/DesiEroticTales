import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
  'h2', 'h3', 'a', 'img', 'ul', 'ol', 'li', 'blockquote',
];

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'rel', 'target', 'class'];

export function sanitizeStoryHtml(html: string): string {
  if (!html?.trim()) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
  });
}