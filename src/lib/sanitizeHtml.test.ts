import { describe, expect, it } from 'vitest';
import { sanitizeStoryHtml } from './sanitizeHtml';

describe('sanitizeStoryHtml', () => {
  it('strips script tags', () => {
    const out = sanitizeStoryHtml('<p>Hi</p><script>alert(1)</script>');
    expect(out).not.toContain('script');
    expect(out).toContain('Hi');
  });

  it('allows safe formatting tags', () => {
    const out = sanitizeStoryHtml('<p><strong>Bold</strong></p>');
    expect(out).toContain('<strong>');
  });
});