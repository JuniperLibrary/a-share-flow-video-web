import { useEffect } from 'react';

interface ShortcutMap {
  prevDate: () => void;
  nextDate: () => void;
  refresh: () => void;
  generate: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function useKeyboardShortcuts({
  prevDate,
  nextDate,
  refresh,
  generate,
  hasPrev,
  hasNext,
}: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (hasPrev) prevDate();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (hasNext) nextDate();
          break;
        case 'r':
        case 'R':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            refresh();
          }
          break;
        case 'g':
        case 'G':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            generate();
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prevDate, nextDate, refresh, generate, hasPrev, hasNext]);
}
