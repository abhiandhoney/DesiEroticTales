import { useCallback, useEffect, useRef, useState } from 'react';
import type { StoryStatus } from '../types';
import {
  CACHE_VERSION,
  migrateStoryDraftCache,
  readStoryDraftCache,
  snapshotFingerprint,
  writeStoryDraftCache,
  type StoryDraftSnapshot,
} from '../lib/storyDraftCache';

export type AutosaveStatus = 'idle' | 'local' | 'syncing' | 'saved' | 'error';

const REMOTE_DEBOUNCE_MS = 7000;
const STATUS_HIDE_MS = 4000;

export interface UseStoryAutosaveOptions {
  userId: string;
  storyId?: string;
  storyUpdatedAt?: string | null;
  storyStatus?: StoryStatus;
  mode: 'create' | 'edit';
  snapshot: StoryDraftSnapshot;
  enabled: boolean;
  canSyncRemote: () => string | null;
  onRestore: (snapshot: StoryDraftSnapshot) => void;
  onStoryId: (id: string) => void;
  syncToSupabase: (storyId?: string) => Promise<string>;
}

export function useStoryAutosave({
  userId,
  storyId,
  storyUpdatedAt,
  storyStatus,
  mode,
  snapshot,
  enabled,
  canSyncRemote,
  onRestore,
  onStoryId,
  syncToSupabase,
}: UseStoryAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const remoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLocalFingerprint = useRef<string | null>(null);
  const lastRemoteFingerprint = useRef<string | null>(null);
  const remoteSyncing = useRef(false);
  const restored = useRef(false);
  const storyIdRef = useRef(storyId);
  storyIdRef.current = storyId;

  const clearRemoteTimer = useCallback(() => {
    if (remoteTimer.current) {
      clearTimeout(remoteTimer.current);
      remoteTimer.current = null;
    }
  }, []);

  const scheduleStatusHide = useCallback(() => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => {
      statusTimer.current = null;
      setStatus('idle');
      setStatusMessage('');
    }, STATUS_HIDE_MS);
  }, []);

  const showStatus = useCallback((next: AutosaveStatus, message: string, autoHide = true) => {
    setStatus(next);
    setStatusMessage(message);
    if (autoHide && (next === 'saved' || next === 'local')) {
      scheduleStatusHide();
    }
  }, [scheduleStatusHide]);

  // Baseline or restore newer local draft on first mount.
  useEffect(() => {
    if (!enabled || restored.current) return;
    restored.current = true;

    const cached = readStoryDraftCache(userId, storyId);
    const remoteMs = storyUpdatedAt ? Date.parse(storyUpdatedAt) : 0;
    const currentFp = snapshotFingerprint(snapshot);

    if (cached && cached.updatedAt > remoteMs) {
      onRestore(cached.snapshot);
      const cachedFp = snapshotFingerprint(cached.snapshot);
      lastLocalFingerprint.current = cachedFp;
      lastRemoteFingerprint.current = cachedFp;
      showStatus('local', 'Restored unsaved changes from this device', true);
      return;
    }

    lastLocalFingerprint.current = currentFp;
    lastRemoteFingerprint.current = currentFp;
  }, [enabled, userId, storyId, storyUpdatedAt, snapshot, onRestore, showStatus]);

  const writeLocal = useCallback((fp: string) => {
    const entry = {
      version: CACHE_VERSION,
      userId,
      storyId: storyIdRef.current ?? null,
      updatedAt: Date.now(),
      remoteUpdatedAt: storyUpdatedAt ? Date.parse(storyUpdatedAt) : null,
      snapshot,
    };
    writeStoryDraftCache(entry);
    lastLocalFingerprint.current = fp;
  }, [userId, snapshot, storyUpdatedAt]);

  const runRemoteSync = useCallback(async () => {
    if (!enabled || remoteSyncing.current) return;

    const validationError = canSyncRemote();
    if (validationError) return;

    const fp = snapshotFingerprint(snapshot);
    if (fp === lastRemoteFingerprint.current) return;

    remoteSyncing.current = true;
    showStatus('syncing', 'Saving draft…', false);

    try {
      const id = await syncToSupabase(storyIdRef.current);
      storyIdRef.current = id;
      onStoryId(id);
      migrateStoryDraftCache(userId, id);
      writeStoryDraftCache({
        version: CACHE_VERSION,
        userId,
        storyId: id,
        updatedAt: Date.now(),
        remoteUpdatedAt: Date.now(),
        snapshot,
      });
      lastRemoteFingerprint.current = fp;
      lastLocalFingerprint.current = fp;
      showStatus('saved', 'All changes saved', true);
    } catch {
      showStatus('error', 'Could not sync draft — saved on this device only', true);
    } finally {
      remoteSyncing.current = false;
    }
  }, [
    enabled,
    canSyncRemote,
    snapshot,
    syncToSupabase,
    onStoryId,
    userId,
    showStatus,
  ]);

  const scheduleRemoteSync = useCallback(() => {
    clearRemoteTimer();
    remoteTimer.current = setTimeout(() => {
      remoteTimer.current = null;
      void runRemoteSync();
    }, REMOTE_DEBOUNCE_MS);
  }, [clearRemoteTimer, runRemoteSync]);

  const flushRemote = useCallback(() => {
    clearRemoteTimer();
    void runRemoteSync();
  }, [clearRemoteTimer, runRemoteSync]);

  // Instant localStorage + debounced Supabase on snapshot changes.
  useEffect(() => {
    if (!enabled) return;

    const fp = snapshotFingerprint(snapshot);
    if (fp === lastLocalFingerprint.current) return;

    writeLocal(fp);

    const validationError = canSyncRemote();
    if (!validationError && fp !== lastRemoteFingerprint.current) {
      scheduleRemoteSync();
    } else if (validationError && fp !== lastRemoteFingerprint.current) {
      showStatus('local', 'Saved on this device', true);
    } else if (fp === lastRemoteFingerprint.current) {
      setStatus('idle');
      setStatusMessage('');
    }
  }, [
    enabled,
    snapshot,
    writeLocal,
    canSyncRemote,
    scheduleRemoteSync,
    showStatus,
  ]);

  // Tab close / background: flush pending remote sync.
  useEffect(() => {
    if (!enabled) return;

    const onLeave = () => {
      const fp = snapshotFingerprint(snapshot);
      if (fp !== lastRemoteFingerprint.current && canSyncRemote() === null) {
        void runRemoteSync();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onLeave();
    };

    window.addEventListener('beforeunload', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, snapshot, canSyncRemote, runRemoteSync]);

  useEffect(() => {
    return () => {
      clearRemoteTimer();
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, [clearRemoteTimer]);

  const markRemoteSaved = useCallback((nextSnapshot?: StoryDraftSnapshot) => {
    const fp = snapshotFingerprint(nextSnapshot ?? snapshot);
    lastRemoteFingerprint.current = fp;
    lastLocalFingerprint.current = fp;
    setStatus('idle');
    setStatusMessage('');
  }, [snapshot]);

  const isAutosaveEligible =
    enabled &&
    (mode === 'create' ||
      storyStatus === 'draft' ||
      storyStatus === 'pending' ||
      storyStatus === 'rejected');

  return {
    status,
    statusMessage,
    flushRemote,
    cancelPendingSync: clearRemoteTimer,
    markRemoteSaved,
    isAutosaveEligible,
  };
}