import type {ReactNode} from 'react';
import {useGsapReveal} from '~/hooks/useGsapReveal';

interface RevealProps {
  children: ReactNode;
  /** Reveal delay in seconds. Default 0. */
  delay?: number;
  /** Vertical travel of the hidden start state, in px. Default 24. */
  y?: number;
  className?: string;
  /** Render element. Default 'div'. Use 'span' for inline reveals. */
  as?: 'div' | 'span';
}

// Thin wrapper around `useGsapReveal`. Wrap any section / element that should
// animate into view. Content is VISIBLE BY DEFAULT — the hidden start state is
// applied imperatively by the hook only when JS runs and motion is allowed, so
// JS-disabled and reduced-motion visitors see everything.
export function Reveal({children, delay = 0, y, className, as = 'div'}: RevealProps) {
  const ref = useGsapReveal<HTMLDivElement>({delay, y});
  if (as === 'span') {
    return (
      <span ref={ref} className={className}>
        {children}
      </span>
    );
  }
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
