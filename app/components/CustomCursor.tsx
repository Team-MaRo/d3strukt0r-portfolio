import {useEffect, useRef, useState} from 'react';

const COLOR = 'rgba(34, 211, 238, 0.85)';
const RING = 'rgba(167, 139, 250, 0.6)';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- matchMedia is browser-only, must read after mount
    setEnabled(mq.matches);
    const h = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    document.body.classList.add('custom-cursor-active');
    const s = {x: 0, y: 0, rx: 0, ry: 0, hover: false, seen: false};
    const show = () => {
      if (dotRef.current) {
        dotRef.current.style.opacity = '1';
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = '1';
      }
    };
    const hide = () => {
      if (dotRef.current) {
        dotRef.current.style.opacity = '0';
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = '0';
      }
    };
    const onMove = (e: MouseEvent) => {
      s.x = e.clientX;
      s.y = e.clientY;
      if (!s.seen) {
        // First real position: snap the ring so it doesn't lerp from (0,0).
        s.rx = s.x;
        s.ry = s.y;
        s.seen = true;
      }
      // Re-show on every move — if `window.blur` hid us earlier (e.g. the user
      // clicked into a cross-origin iframe), this is the signal that the
      // pointer is back on our document.
      show();
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 4}px,${e.clientY - 4}px,0)`;
      }
    };
    const onEnter = (e: MouseEvent) => {
      s.x = e.clientX;
      s.y = e.clientY;
      s.rx = s.x;
      s.ry = s.y;
      s.seen = true;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX - 4}px,${e.clientY - 4}px,0)`;
      }
      show();
    };
    const onLeave = () => hide();
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      const hov = !!t?.closest?.('a, button, [role="button"], input, textarea, .cursor-hover');
      s.hover = hov;
      if (ringRef.current) {
        const sz = hov ? '48px' : '28px';
        ringRef.current.style.width = sz;
        ringRef.current.style.height = sz;
        ringRef.current.style.borderColor = hov ? COLOR : RING;
        ringRef.current.style.background = hov ? 'rgba(34,211,238,.1)' : 'transparent';
      }
    };
    let raf = 0;
    const loop = () => {
      s.rx += (s.x - s.rx) * 0.18;
      s.ry += (s.y - s.ry) * 0.18;
      const size = s.hover ? 48 : 28;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${s.rx - size / 2}px,${s.ry - size / 2}px,0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    window.addEventListener('blur', onLeave);
    return () => {
      document.body.classList.remove('custom-cursor-active');
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('blur', onLeave);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }
  return (
    <>
      <div ref={ringRef} aria-hidden className="ta-cursor-ring" />
      <div ref={dotRef} aria-hidden className="ta-cursor-dot" />
    </>
  );
}
