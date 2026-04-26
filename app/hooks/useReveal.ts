import {useEffect} from 'react';

export function useReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        }
      },
      {threshold: 0.15},
    );
    const scan = () => document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)').forEach((el) => obs.observe(el));
    scan();
    const m = new MutationObserver(scan);
    m.observe(document.body, {childList: true, subtree: true});
    return () => {
      m.disconnect(); obs.disconnect();
    };
  }, []);
}
