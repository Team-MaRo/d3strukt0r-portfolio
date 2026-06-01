import {useCallback, useSyncExternalStore} from 'react';

const STORAGE_KEY = 'd3strukt0rs-portfolio:theme';

// Shared by the JSX `<meta name="theme-color">` tags in root.tsx, the inline
// bootstrap that runs them on first paint, and `applyTheme` below. sRGB-hex
// renderings of the `--background` token in `app/styles/_tokens.scss`:
// dark `oklch(16.08% 0.0103 285.19deg)` → #0d0d12, light `oklch(100% 0 0)` →
// #ffffff (mobile browser chrome doesn't parse oklch(), so these stay hex).
export const THEME_COLOR_DARK = '#0d0d12';
export const THEME_COLOR_LIGHT = '#ffffff';

export type Theme = 'light' | 'dark';

// Shared subscriber set so every `useTheme` consumer re-renders when the
// theme changes. Without this, each component held its own `useState` copy
// and stayed in sync only because there was a single caller; any new
// consumer (cursor, terminal, …) would desync from the nav toggle.
const subscribers = new Set<() => void>();

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function getSnapshot(): Theme {
  if (typeof document === 'undefined') {
    return 'dark';
  }
  // Theme class lives on <html> (set pre-paint by themeBootstrap in root.tsx).
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

function getServerSnapshot(): Theme {
  return 'dark';
}

function applyTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage may throw in private mode / sandboxed contexts; ignore.
  }
  const root = document.documentElement;
  root.classList.toggle('light', theme === 'light');
  root.classList.toggle('dark', theme !== 'light');
  // Override every `<meta name="theme-color">` regardless of its `media`
  // attribute. Both metas end up with the same value, so whichever one wins
  // the browser's media match shows the chosen theme's chrome colour.
  const color = theme === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute('content', color);
  });
  subscribers.forEach((fn) => {
    fn();
  });
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback(() => {
    applyTheme(getSnapshot() === 'dark' ? 'light' : 'dark');
  }, []);
  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
  }, []);
  return {theme, toggle, setTheme};
}
