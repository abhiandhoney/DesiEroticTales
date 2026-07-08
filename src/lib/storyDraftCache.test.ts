import { describe, expect, it } from 'vitest';
import { snapshotFingerprint, type StoryDraftSnapshot } from './storyDraftCache';
import { emptyRichDoc } from './richTextPlain';

const baseSnapshot = (): StoryDraftSnapshot => ({
  title: 'Test Tale',
  teaser: 'A teaser',
  category: 'Aunty',
  tagsInput: 'telugu',
  contentDoc: emptyRichDoc(),
  contentHtml: '<p>Hello</p>',
  authorProfileId: null,
  coverPersistedFullUrl: null,
  coverPersistedCardUrl: null,
  collectionValue: { mode: 'none' },
});

describe('snapshotFingerprint', () => {
  it('returns stable fingerprint for identical snapshots', () => {
    const a = baseSnapshot();
    const b = baseSnapshot();
    expect(snapshotFingerprint(a)).toBe(snapshotFingerprint(b));
  });

  it('changes when title changes', () => {
    const a = baseSnapshot();
    const b = { ...baseSnapshot(), title: 'Different' };
    expect(snapshotFingerprint(a)).not.toBe(snapshotFingerprint(b));
  });

  it('changes when cover or collection changes', () => {
    const a = baseSnapshot();
    const b = {
      ...baseSnapshot(),
      coverPersistedFullUrl: 'det-draft://story-images-draft/u/cover.webp',
      collectionValue: { mode: 'existing' as const, collectionId: 'abc', partNumber: 2 },
    };
    expect(snapshotFingerprint(a)).not.toBe(snapshotFingerprint(b));
  });
});