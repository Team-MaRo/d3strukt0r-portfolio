import {useEffect, useRef, useState} from 'react';

const COLOR = 'rgba(34, 211, 238, 0.85)';
const RING = 'rgba(167, 139, 250, 0.6)';

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setEnabled(mq.matches);
    const h = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mq.addEventListener?.('change', h);
    return () => mq.removeEventListener?.('change', h);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const s = {x: 0, y: 0, rx: 0, ry: 0, hover: false};
    const onMove = (e: MouseEvent) => {
      s.x = e.clientX; s.y = e.clientY;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${e.clientX - 4}px,${e.clientY - 4}px,0)`;
      }
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null;
      const hov = !!t?.closest?.('a, button, [role="button"], input, textarea, .cursor-hover');
      s.hover = hov;
      if (ring.current) {
        const sz = hov ? '48px' : '28px';
        ring.current.style.width = sz;
        ring.current.style.height = sz;
        ring.current.style.borderColor = hov ? COLOR : RING;
        ring.current.style.background = hov ? 'rgba(34,211,238,.1)' : 'transparent';
      }
    };
    let raf = 0;
    const loop = () => {
      s.rx += (s.x - s.rx) * 0.18;
      s.ry += (s.y - s.ry) * 0.18;
      const size = s.hover ? 48 : 28;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${s.rx - size / 2}px,${s.ry - size / 2}px,0)`;
      }
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
  }, [enabled]);

  if (!enabled) {
    return null;
  }
  return (
    <>
      <div
        ref={ring}
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, width: 28, height: 28, borderRadius: '50%',
          border: `1.5px solid ${RING}`, pointerEvents: 'none', zIndex: 9999,
          transition: 'width .18s, height .18s, border-color .18s, background .18s',
          mixBlendMode: 'difference',
        }}
      />
      <div
        ref={dot}
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: 0, width: 8, height: 8, borderRadius: '50%',
          background: COLOR, pointerEvents: 'none', zIndex: 10000,
        }}
      />
    </>
  );
}
