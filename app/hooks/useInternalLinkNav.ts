import {useEffect, type RefObject} from 'react';
import {useNavigate} from 'react-router';

const SCROLL_DURATION_MS = 320;

// rAF-driven scroll with ease-out. Much snappier than the browser's built-in
// `scroll-behavior: smooth` (which runs ~500–1000ms depending on distance).
// Honors `scroll-padding-top` (read from :root) so the target lands below the
// floating nav, and falls back to an instant jump when the user has
// prefers-reduced-motion set.
function smoothScrollToAnchor(id: string): boolean {
  const el = document.getElementById(decodeURIComponent(id));
  if (!el) {
    return false;
  }
  const paddingTop = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const targetY = el.getBoundingClientRect().top + window.scrollY - paddingTop;
  const startY = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 1) {
    return true;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({top: targetY});
    return true;
  }
  const start = performance.now();
  const step = (now: number): void => {
    const t = Math.min(1, (now - start) / SCROLL_DURATION_MS);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    window.scrollTo({top: startY + distance * eased});
    if (t < 1) {
      requestAnimationFrame(step);
    }
  };
  requestAnimationFrame(step);
  return true;
}

// Intercept clicks on internal `<a href="/...">` links inside the ref'd element
// so markdown-authored links navigate via the React Router history instead of
// triggering a full-page reload. In-page `<a href="#...">` links get a fast
// rAF-driven scroll instead of the browser's slow default. Scoped to the ref
// so it never shadows real <Link> components elsewhere on the page.
export function useInternalLinkNav<T extends HTMLElement>(ref: RefObject<T | null>): void {
  const navigate = useNavigate();
  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    function onClick(e: MouseEvent): void {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const a = (e.target as Element | null)?.closest('a');
      if (!a) {
        return;
      }
      const href = a.getAttribute('href');
      if (!href) {
        return;
      }
      if (a.target === '_blank' || a.hasAttribute('download')) {
        return;
      }
      if (href.startsWith('#')) {
        const id = href.slice(1);
        if (!id || !smoothScrollToAnchor(id)) {
          return;
        }
        e.preventDefault();
        history.pushState(null, '', `#${id}`);
        return;
      }
      if (!href.startsWith('/') || href.startsWith('//')) {
        return;
      }
      e.preventDefault();
      void navigate(href);
    }
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [ref, navigate]);
}
