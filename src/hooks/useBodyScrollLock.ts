import { useEffect } from 'react';

/**
 * useBodyScrollLock
 * Central scroll lock to avoid conflicts when multiple modals/menus open.
 * Uses a ref-count so nested or overlapping locks restore correctly.
 */
let lockCount = 0;
let originalOverflow = '';

function acquireLock() {
  if (lockCount === 0) {
    originalOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function releaseLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = originalOverflow;
  }
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    acquireLock();
    return () => {
      releaseLock();
    };
  }, [locked]);
}
