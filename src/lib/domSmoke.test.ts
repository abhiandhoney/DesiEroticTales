import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sanitizeStoryHtml } from './sanitizeHtml';
import { getViewerHash } from './viewerHash';
import { snapshotFingerprint, type StoryDraftSnapshot } from './storyDraftCache';
import { emptyRichDoc } from './richTextPlain';

const root = join(process.cwd());

describe('DOM smoke (jsdom simulation)', () => {
  it('built index.html has app mount and script tags', () => {
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    expect(doc.getElementById('root')).not.toBeNull();
    expect(doc.querySelector('script[type="module"]')).not.toBeNull();
    expect(doc.title).toMatch(/DesiEroticTales/i);
  });

  it('sanitizeStoryHtml strips script tags from DOM injection', () => {
    const dirty = '<p>Hello</p><script>alert(1)</script><img src=x onerror=alert(1)>';
    const clean = sanitizeStoryHtml(dirty);
    const dom = new JSDOM(`<div id="wrap">${clean}</div>`);
    const wrap = dom.window.document.getElementById('wrap')!;
    expect(wrap.querySelector('script')).toBeNull();
    expect(wrap.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(wrap.textContent).toContain('Hello');
  });

  it('viewerHash uses sessionStorage in jsdom', () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost/',
      pretendToBeVisual: true,
    });
    const g = globalThis as typeof globalThis & { window?: Window; sessionStorage?: Storage };
    g.window = dom.window as unknown as Window;
    g.sessionStorage = dom.window.sessionStorage;

    const a = getViewerHash();
    const b = getViewerHash();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(8);

    delete g.window;
    delete g.sessionStorage;
  });

  it('autosave fingerprint includes cover and collection fields', () => {
    const snap: StoryDraftSnapshot = {
      title: 'Draft',
      teaser: '',
      category: 'Aunty',
      tagsInput: '',
      contentDoc: emptyRichDoc(),
      contentHtml: '',
      authorProfileId: null,
      coverPersistedFullUrl: 'det-draft://story-images-draft/u/c.webp',
      coverPersistedCardUrl: null,
      collectionValue: { mode: 'existing', collectionId: 'c1', partNumber: 1 },
    };

    const fp = snapshotFingerprint(snap);
    expect(fp).toContain('det-draft://');
    expect(fp).toContain('c1');
  });
});