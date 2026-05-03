import {useEffect, useState} from 'react';

const KEY = 'd3strukt0rs-portfolio:theme';
type Theme = 'dark' | 'light';

function getInitial(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'dark' || v === 'light') {
      return v;
    }
  } catch {}
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, theme);
    } catch {}
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('light', theme === 'light');
      document.body.classList.toggle('dark', theme !== 'light');
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return {theme, setTheme, toggle};
}
