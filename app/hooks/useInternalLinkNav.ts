import {useEffect, type RefObject} from 'react';
import {useNavigate} from 'react-router';

// Intercept clicks on internal `<a href="/...">` links inside the ref'd element
// so markdown-authored links navigate via the React Router history instead of
// triggering a full-page reload. Scoped to the ref so it never shadows real
// <Link> components elsewhere on the page.
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
      if (!href || !href.startsWith('/') || href.startsWith('//')) {
        return;
      }
      if (a.target === '_blank' || a.hasAttribute('download')) {
        return;
      }
      e.preventDefault();
      void navigate(href);
    }
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [ref, navigate]);
}
