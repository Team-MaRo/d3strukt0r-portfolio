import {describe, expect, it} from 'vitest';
import {formatDuration} from './linkedin';

// `now` fixed at 2026-06-15 UTC for every case — the whole point is that the
// result depends only on the passed-in `now`, never on the wall clock, so
// server and client render identical strings (no React #418).
const NOW = Date.UTC(2026, 5, 15); // 2026-06-15

describe('formatDuration', () => {
  it('is deterministic for an ongoing position (uses the passed now)', () => {
    expect(formatDuration('2022-01', null, 'de', NOW)).toBe('4 Jahre 6 Monate');
    expect(formatDuration('2022-01', null, 'en', NOW)).toBe('4 years 6 months');
  });

  it('ignores the wall clock — same now, same output regardless of when called', () => {
    const a = formatDuration('2021-09', null, 'en', NOW);
    const b = formatDuration('2021-09', null, 'en', NOW);
    expect(a).toBe(b);
    expect(a).toBe('4 years 10 months');
  });

  it('uses the finished date when present (now is irrelevant)', () => {
    expect(formatDuration('2020-01', '2021-12', 'de', NOW)).toBe('2 Jahre');
    expect(formatDuration('2020-01', '2021-12', 'en', Date.UTC(2030, 0, 1))).toBe('2 years');
  });

  it('singular vs plural labels', () => {
    expect(formatDuration('2026-05', null, 'de', NOW)).toBe('2 Monate');
    expect(formatDuration('2026-06', null, 'en', NOW)).toBe('1 month');
    expect(formatDuration('2025-06', null, 'de', NOW)).toBe('1 Jahr 1 Monat');
  });

  it('returns empty when there is no start date', () => {
    expect(formatDuration(null, null, 'en', NOW)).toBe('');
  });
});
