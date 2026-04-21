// Shared hooks and utilities for both portfolio variants.
// Depends on React being loaded globally.

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── Language toggle ─────────────────────────────────────────
function useLang(defaultLang = 'en') {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('portfolio:lang') || defaultLang; } catch { return defaultLang; }
  });
  useEffect(() => {
    try { localStorage.setItem('portfolio:lang', lang); } catch {}
    document.documentElement.lang = lang;
  }, [lang]);
  // Sync with shell's language toggle (ta-shell.js dispatches 'ta:lang').
  useEffect(() => {
    const onShellLang = (e) => { if (e?.detail?.lang) setLang(e.detail.lang); };
    window.addEventListener('ta:lang', onShellLang);
    return () => window.removeEventListener('ta:lang', onShellLang);
  }, []);
  const t = useCallback((obj) => {
    if (obj == null) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] ?? obj.en ?? '';
  }, [lang]);
  return { lang, setLang, t };
}

// ─── Theme (dark/light) ──────────────────────────────────────
function useTheme(defaultTheme = 'dark') {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('portfolio:theme') || defaultTheme; } catch { return defaultTheme; }
  });
  useEffect(() => {
    try { localStorage.setItem('portfolio:theme', theme); } catch {}
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return { theme, setTheme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') };
}

// ─── GitHub repos (live fetch, cached in sessionStorage) ─────
function useGitHubRepos(user = 'D3strukt0r') {
  const [repos, setRepos] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const cacheKey = `gh:repos:${user}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) { setRepos(JSON.parse(cached)); return; }
    } catch {}
    fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=100`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const filtered = data
          .filter(r => !r.fork && !r.archived)
          .sort((a, b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)))
          .slice(0, 12)
          .map(r => ({
            name: r.name,
            full: r.full_name,
            desc: r.description || '',
            stars: r.stargazers_count,
            forks: r.forks_count,
            lang: r.language,
            url: r.html_url,
            updated: r.pushed_at,
            topics: r.topics || [],
          }));
        setRepos(filtered);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(filtered)); } catch {}
      })
      .catch(e => setError(e));
  }, [user]);
  return { repos, error };
}

// ─── GitHub user stats ──────────────────────────────────────
function useGitHubUser(user = 'D3strukt0r') {
  const [data, setData] = useState(null);
  useEffect(() => {
    const cacheKey = `gh:user:${user}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) { setData(JSON.parse(cached)); return; }
    } catch {}
    fetch(`https://api.github.com/users/${user}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        const slim = {
          name: d.name, login: d.login, bio: d.bio, avatar: d.avatar_url,
          followers: d.followers, following: d.following, public_repos: d.public_repos,
          created_at: d.created_at,
        };
        setData(slim);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(slim)); } catch {}
      })
      .catch(() => {});
  }, [user]);
  return data;
}

// ─── Fake contribution graph (deterministic from repo pushed_at) ───
function useContribGraph(repos) {
  return useMemo(() => {
    const weeks = 26, days = 7;
    const grid = Array.from({ length: weeks }, () => Array(days).fill(0));
    // seed w/ a pseudo-random but deterministic pattern so the graph always renders
    const seed = (w, d) => {
      const v = Math.sin(w * 9.7 + d * 3.3) * 10000;
      return Math.abs(v - Math.floor(v));
    };
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < days; d++) {
        const r = seed(w, d);
        grid[w][d] = r > 0.75 ? 4 : r > 0.55 ? 3 : r > 0.35 ? 2 : r > 0.18 ? 1 : 0;
      }
    }
    // overlay real activity spikes if we have repos
    if (repos) {
      const now = Date.now();
      for (const r of repos) {
        const pushed = new Date(r.updated).getTime();
        const daysAgo = Math.floor((now - pushed) / 86400000);
        if (daysAgo < weeks * days) {
          const w = weeks - 1 - Math.floor(daysAgo / 7);
          const d = 6 - (daysAgo % 7);
          if (w >= 0 && d >= 0) grid[w][d] = Math.min(4, grid[w][d] + 2);
        }
      }
    }
    return grid;
  }, [repos]);
}

// ─── Custom cursor ───────────────────────────────────────────
function CustomCursor({ color = 'rgba(236, 72, 153, 0.8)', ringColor = 'rgba(99, 102, 241, 0.6)' }) {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const state = useRef({ x: 0, y: 0, rx: 0, ry: 0, hover: false });

  useEffect(() => {
    const onMove = (e) => {
      state.current.x = e.clientX;
      state.current.y = e.clientY;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`;
    };
    const onOver = (e) => {
      const isInteractive = e.target.closest('a, button, [role="button"], input, textarea, .cursor-hover');
      state.current.hover = !!isInteractive;
      if (ringRef.current) {
        ringRef.current.style.width = isInteractive ? '48px' : '28px';
        ringRef.current.style.height = isInteractive ? '48px' : '28px';
        ringRef.current.style.borderColor = isInteractive ? color : ringColor;
        ringRef.current.style.background = isInteractive ? `${color.replace('0.8', '0.1')}` : 'transparent';
      }
    };
    let raf;
    const loop = () => {
      const s = state.current;
      s.rx += (s.x - s.rx) * 0.18;
      s.ry += (s.y - s.ry) * 0.18;
      const size = s.hover ? 48 : 28;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${s.rx - size/2}px, ${s.ry - size/2}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
    };
  }, [color, ringColor]);

  // Only show cursor if pointer supports hover (not touch)
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setEnabled(mq.matches);
    const h = (e) => setEnabled(e.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);
  if (!enabled) return null;

  return (
    <>
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0, width: 28, height: 28, borderRadius: '50%',
        border: `1.5px solid ${ringColor}`, pointerEvents: 'none', zIndex: 9999,
        transition: 'width .18s, height .18s, border-color .18s, background .18s',
        mixBlendMode: 'difference',
      }} />
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0, width: 8, height: 8, borderRadius: '50%',
        background: color, pointerEvents: 'none', zIndex: 10000,
      }} />
    </>
  );
}

// ─── Scroll reveal ───────────────────────────────────────────
function useReveal(ref, { threshold = 0.15, once = true } = {}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setVisible(true);
          if (once) obs.unobserve(e.target);
        } else if (!once) {
          setVisible(false);
        }
      }
    }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold, once]);
  return visible;
}

function Reveal({ children, delay = 0, y = 24, className, style }) {
  const ref = useRef(null);
  const visible = useReveal(ref);
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity .8s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform .8s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

Object.assign(window, { useLang, useTheme, useGitHubRepos, useGitHubUser, useContribGraph, CustomCursor, useReveal, Reveal });
