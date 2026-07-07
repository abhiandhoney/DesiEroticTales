import { useCallback, useEffect, useState } from 'react';

export type FontSize = 'sm' | 'md' | 'lg';

const STORAGE_KEY = 'det-reading-font';

export function useReadingPrefs() {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'sm' || saved === 'lg' ? saved : 'md';
  });

  useEffect(() => {
    document.documentElement.dataset.readingFont = fontSize;
    localStorage.setItem(STORAGE_KEY, fontSize);
  }, [fontSize]);

  const setFontSize = useCallback((size: FontSize) => setFontSizeState(size), []);

  return { fontSize, setFontSize };
}