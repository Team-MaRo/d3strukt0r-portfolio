// Runtime access to hand-authored portfolio data. The source of truth is
// `content/site.yml`; this module just imports it (via
// `@modyfi/vite-plugin-yaml`) and re-exports typed slices so `~/lib/data` is
// no longer needed. LinkedIn-derived data lives in `~/lib/linkedin` instead.

import site from '../../content/site.yml';

export interface SocialLinks {
  email: string;
  github: string;
  linkedin: string;
  twitter: string;
  xing: string;
}

export interface StatEntry {
  value: string;
  labelKey: string;
}

export interface DailyStackEntry {
  name: string;
  pct: number;
}

export interface SkillGroup {
  key: string;
  items: readonly string[];
}

export interface ProjectFallbackEntry {
  name: string;
  descEn: string;
  descDe: string;
  stars: number;
  lang: string | null;
  url: string;
}

export interface StarEntry {
  name: string;
  stars: number;
}

export interface Qualifications {
  programs: readonly StarEntry[];
  stack: {
    languages: readonly StarEntry[];
    databases: readonly StarEntry[];
    os: readonly StarEntry[];
    vcs: readonly StarEntry[];
  };
}

interface SiteData {
  socials: SocialLinks;
  stats: readonly StatEntry[];
  dailyStack: readonly DailyStackEntry[];
  skillGroups: readonly SkillGroup[];
  projectsFallback: readonly ProjectFallbackEntry[];
  qualifications: Qualifications;
}

const data = site as unknown as SiteData;

export const SOCIALS = data.socials;
export const STATS = data.stats;
export const DAILY_STACK = data.dailyStack;
export const SKILL_GROUPS = data.skillGroups;
export const PROJECTS_FALLBACK = data.projectsFallback;
export const QUALIFICATIONS = data.qualifications;
