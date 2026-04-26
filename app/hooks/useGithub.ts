import {useEffect, useMemo, useState} from 'react';
import {isNonEmpty} from '~/lib/guards';

export interface GhUser {
  name: string | null;
  login: string;
  bio: string | null;
  avatar: string;
  followers: number;
  following: number;
  public_repos: number;
  created_at: string;
}

export interface GhRepo {
  name: string;
  full: string;
  desc: string;
  stars: number;
  forks: number;
  lang: string | null;
  url: string;
  updated: string;
  topics: string[];
}

function fromCache<T>(key: string): T | null {
  try {
    const v = sessionStorage.getItem(key);
    return isNonEmpty(v) ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function toCache(key: string, val: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function useGithubUser(user = 'D3strukt0r') {
  const [data, setData] = useState<GhUser | null>(null);
  useEffect(() => {
    const key = `gh:user:${user}`;
    const cached = fromCache<GhUser>(key);
    if (cached) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- async fetch + sessionStorage cache; state must update post-mount
      setData(cached);
      return;
    }
    fetch(`https://api.github.com/users/${user}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        const slim: GhUser = {
          name: d.name, login: d.login, bio: d.bio, avatar: d.avatar_url,
          followers: d.followers, following: d.following,
          public_repos: d.public_repos, created_at: d.created_at,
        };
        setData(slim);
        toCache(key, slim);
      })
      .catch(() => {});
  }, [user]);
  return data;
}

export interface GhReposResult {
  list: GhRepo[];
  totalStars: number;
  totalForks: number;
}

export function useGithubRepos(user = 'D3strukt0r') {
  const [repos, setRepos] = useState<GhReposResult | null>(null);
  useEffect(() => {
    const key = `gh:repos:v2:${user}`;
    const cached = fromCache<GhReposResult>(key);
    if (cached) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- async fetch + sessionStorage cache; state must update post-mount
      setRepos(cached);
      return;
    }
    fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=100`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: any[]) => {
        const own = data.filter((r) => !r.fork && !r.archived);
        const totalStars = own.reduce((s, r) => s + (r.stargazers_count ?? 0), 0);
        const totalForks = own.reduce((s, r) => s + (r.forks_count ?? 0), 0);
        const list: GhRepo[] = own
          .sort((a, b) => (b.stargazers_count - a.stargazers_count)
            || (new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()))
          .slice(0, 12)
          .map((r) => ({
            name: r.name, full: r.full_name, desc: r.description ?? '',
            stars: r.stargazers_count, forks: r.forks_count, lang: r.language,
            url: r.html_url, updated: r.pushed_at, topics: r.topics ?? [],
          }));
        const result: GhReposResult = {list, totalStars, totalForks};
        setRepos(result);
        toCache(key, result);
      })
      .catch(() => {});
  }, [user]);
  return repos;
}

export interface GhContrib {
  total: number;
  // 26-week grid (cols 0..25 = oldest..newest), 7 days each (row 0 = Sun, row 6 = Sat)
  weeks: number[][];
}

interface JogruberEntry {date: string; count: number; level: number}
interface JogruberResp {total: Record<string, number>; contributions: JogruberEntry[]}

export function useContributions(user = 'D3strukt0r') {
  const [data, setData] = useState<GhContrib | null>(null);
  useEffect(() => {
    const key = `gh:contrib:v3:${user}`;
    const cached = fromCache<GhContrib>(key);
    if (cached) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- async fetch + sessionStorage cache; state must update post-mount
      setData(cached);
      return;
    }
    fetch(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`)
      .then(async (r) => (r.ok ? (r.json() as Promise<JogruberResp>) : Promise.reject(r.status)))
      .then((resp) => {
        const weeksCount = 26;
        const days = 7;
        const sorted = [...resp.contributions].sort((a, b) => a.date.localeCompare(b.date));
        const grid: number[][] = [];
        for (let w = 0; w < weeksCount; w++) {
          const row: number[] = [];
          for (let d = 0; d < days; d++) {
            row.push(0);
          }
          grid.push(row);
        }
        // Row 0 = Monday, row 6 = Sunday. Column 25 = current week.
        const lastDate = sorted.length ? new Date(`${sorted.at(-1)!.date}T00:00:00Z`) : new Date();
        // Anchor: Monday of the last week shown (week 25).
        const anchor = new Date(lastDate);
        const lastDow = (anchor.getUTCDay() + 6) % 7; // Mon=0..Sun=6
        anchor.setUTCDate(anchor.getUTCDate() - lastDow - (weeksCount - 1) * days);
        for (const e of sorted) {
          const date = new Date(`${e.date}T00:00:00Z`);
          const offset = Math.floor((date.getTime() - anchor.getTime()) / 86400000);
          if (offset < 0 || offset >= weeksCount * days) {
            continue;
          }
          const w = Math.floor(offset / days);
          const d = offset % days;
          grid[w]![d] = Math.max(0, Math.min(4, e.level));
        }
        const total = Number(Object.values(resp.total ?? {})[0]) || sorted.reduce((s, e) => s + e.count, 0);
        const slim: GhContrib = {total, weeks: grid};
        setData(slim);
        toCache(key, slim);
      })
      .catch(() => {});
  }, [user]);
  return data;
}

function placeholderGrid(): number[][] {
  const weeks = 26;
  const days = 7;
  const seed = (w: number, d: number) => {
    const v = Math.sin(w * 9.7 + d * 3.3) * 10000;
    return Math.abs(v - Math.floor(v));
  };
  const grid: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: number[] = [];
    for (let d = 0; d < days; d++) {
      const r = seed(w, d);
      row.push(r > 0.75 ? 4 : r > 0.55 ? 3 : r > 0.35 ? 2 : r > 0.18 ? 1 : 0);
    }
    grid.push(row);
  }
  return grid;
}

export function useContribGraph(contrib: GhContrib | null) {
  return useMemo(() => contrib?.weeks ?? placeholderGrid(), [contrib]);
}
