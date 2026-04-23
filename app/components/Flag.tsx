// Inline SVG country flags. Regional-indicator emoji (🇩🇪, 🇬🇧, …) don't
// render as flags on Windows because Segoe UI Emoji deliberately shows the
// letter pair. Ship SVGs so rendering is identical across platforms.

import type {ReactNode} from 'react';

const base = {
  'aria-hidden': true as const,
  preserveAspectRatio: 'xMidYMid slice' as const,
};

const FLAGS: Record<string, ReactNode> = {
  de: (
    <svg {...base} viewBox="0 0 5 3">
      <rect width="5" height="1" fill="#000" />
      <rect width="5" height="1" y="1" fill="#DD0000" />
      <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
  ),
  es: (
    <svg {...base} viewBox="0 0 3 2">
      <rect width="3" height="2" fill="#AA151B" />
      <rect width="3" height="1" y="0.5" fill="#F1BF00" />
    </svg>
  ),
  gb: (
    <svg {...base} viewBox="0 0 60 30">
      <clipPath id="flag-gb-t">
        <path d="M30,15 h30 v15 z v-15 h-30 z h-30 v-15 z v15 h30 z" />
      </clipPath>
      <path d="M0,0 h60 v30 h-60 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-gb-t)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  ),
  it: (
    <svg {...base} viewBox="0 0 3 2">
      <rect width="1" height="2" fill="#009246" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#CE2B37" />
    </svg>
  ),
  fr: (
    <svg {...base} viewBox="0 0 3 2">
      <rect width="1" height="2" fill="#002654" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ED2939" />
    </svg>
  ),
};

export function Flag({code, className}: {code: string; className?: string}) {
  return <span className={className}>{FLAGS[code] ?? '🏳️'}</span>;
}
