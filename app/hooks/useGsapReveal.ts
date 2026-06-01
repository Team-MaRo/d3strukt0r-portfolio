import {useGSAP} from '@gsap/react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useRef} from 'react';
import {useLocation} from 'react-router';

// GSAP is client-only. Register the plugin lazily inside the effect (never at
// module scope) so the SSR image build and the SPA index prerender — which
// render the home route to HTML on the server — never touch the browser-only
// APIs ScrollTrigger relies on. `useGSAP` itself is an isomorphic
// `useIsomorphicLayoutEffect`, so it's a no-op on the server.
let registered = false;

export interface GsapRevealOptions {
  /** Vertical travel of the hidden start state, in px. Default 24. */
  y?: number;
  /** Reveal delay in seconds. Default 0. */
  delay?: number;
}

// Scoped, bidirectional scroll reveal.
//
// Visible-by-default / no-JS-safe: the hidden start state is set IMPERATIVELY
// here via `gsap.set` — it never lives in CSS or inline style, so a visitor
// with JS disabled (or with `prefers-reduced-motion: reduce`, where we add no
// animation at all) sees every element fully visible. The tween plays the
// element in when it enters the viewport and hides it again when it leaves, in
// both scroll directions (`toggleActions` covers enter / leave / leaveBack /
// enterBack).
//
// `ScrollTrigger.refresh()` is fired after fonts settle and one frame after
// mount (layout shifts as the GitHub data lands, the language flips, etc.),
// and again whenever the React Router location changes.
export function useGsapReveal<T extends HTMLElement = HTMLElement>(
  options: GsapRevealOptions = {},
) {
  const {y = 24, delay = 0} = options;
  const ref = useRef<T>(null);
  const loc = useLocation();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) {
        return;
      }
      if (!registered) {
        gsap.registerPlugin(ScrollTrigger, useGSAP);
        registered = true;
      }

      // Skip all motion under reduced-motion — `matchMedia` adds the timeline
      // only when the user has expressed no preference against motion, so the
      // element keeps its visible-by-default state otherwise.
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(el, {opacity: 0, y});
        const tween = gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            end: 'bottom 8%',
            toggleActions: 'play reverse play reverse',
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      const refresh = () => ScrollTrigger.refresh();
      const raf = requestAnimationFrame(refresh);
      if (typeof document !== 'undefined' && document.fonts != null) {
        void document.fonts.ready.then(refresh);
      }

      return () => {
        cancelAnimationFrame(raf);
        mm.revert();
      };
    },
    {scope: ref, dependencies: [loc.pathname, y, delay]},
  );

  return ref;
}
