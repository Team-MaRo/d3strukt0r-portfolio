import type {
  Certification, Education, Language, Position, Profile, Project, Skill,
} from './schema';
import {isNonEmpty} from '~/lib/guards';

// "Jan 2022" | "Nov 2015" → "2022-01"; "" → null.
const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

const MONTH_YEAR_RE = /^([a-z]{3})\s+(\d{4})$/i;
const YEAR_MONTH_RE = /^\d{4}-\d{2}$/;
const YEAR_RE = /^\d{4}$/;

export function parseDate(raw: string | null | undefined): string | null {
  if (!isNonEmpty(raw)) {
    return null;
  }
  const s = raw.trim();
  if (s === '') {
    return null;
  }
  const m = MONTH_YEAR_RE.exec(s);
  if (m) {
    const key = m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1).toLowerCase();
    const mo = MONTHS[key];
    return isNonEmpty(mo) ? `${m[2]}-${mo}` : null;
  }
  if (YEAR_MONTH_RE.test(s)) {
    return s;
  }
  if (YEAR_RE.test(s)) {
    return `${s}-01`;
  }
  return null;
}

// LinkedIn proficiency string → 1–5 stars.
// Matches the five rungs of LinkedIn's German picker:
//   1 Grundkenntnisse                        → "Elementary proficiency"
//   2 Gute Kenntnisse                        → "Limited working proficiency"
//   3 Fließend                                → "Professional working proficiency"
//   4 Verhandlungssicher                      → "Full professional proficiency"
//   5 Muttersprache oder zweisprachig         → "Native or bilingual proficiency"
// Order matters: "full professional" must be checked before "professional working".
export function proficiencyToStars(prof: string): number {
  const p = (prof || '').toLowerCase();
  if (p.includes('native') || p.includes('bilingual')) {
    return 5;
  }
  if (p.includes('full professional')) {
    return 4;
  }
  if (p.includes('professional working') || p.startsWith('professional ')) {
    return 3;
  }
  if (p.includes('limited working')) {
    return 2;
  }
  if (p.includes('elementary')) {
    return 1;
  }
  return 1;
}

// LinkedIn's CSV export has exhibited locale-mangled location strings for
// this account (Cyrillic / Italian variants of Swiss place names). Map the
// known bad values back to their canonical German forms so the source of
// truth stays correct across re-exports.
const LOCATION_FIXES: Record<string, string> = {
  Праттельн: 'Pratteln, Schweiz',
  'Pratteln, Basel-Landschaft, Schweiz': 'Pratteln, Schweiz',
  'Distretto di Arlesheim': 'Arlesheim, Schweiz',
  'Distretto di Rheinfelden': 'Rheinfelden, Schweiz',
};

// Collapse any remaining "City, Canton/Region, Country" down to "City, Country"
// by dropping the middle part. Assumes the city is the first comma-separated
// segment and the country is the last — matches how LinkedIn exports locations
// for this account. Single-segment values (e.g. "Schweiz") pass through.
function stripRegion(raw: string): string {
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 2) {
    return parts.join(', ');
  }
  return `${parts[0]}, ${parts.at(-1)}`;
}

function fixLocation(raw: string): string {
  const s = raw.trim();
  return stripRegion(LOCATION_FIXES[s] ?? s);
}

export function normalizePosition(row: Record<string, string>): Position {
  return {
    company: row['Company Name'] ?? '',
    title: row.Title ?? '',
    location: fixLocation(row.Location ?? ''),
    startedOn: parseDate(row['Started On']),
    finishedOn: parseDate(row['Finished On']),
    description: (row.Description ?? '').trim(),
  };
}

export function normalizeEducation(row: Record<string, string>): Education {
  return {
    school: row['School Name'] ?? '',
    degree: row['Degree Name'] ?? '',
    startedOn: parseDate(row['Start Date']),
    finishedOn: parseDate(row['End Date']),
    notes: (row.Notes ?? '').trim(),
    activities: (row.Activities ?? '').trim(),
  };
}

export function normalizeCertification(row: Record<string, string>): Certification {
  return {
    name: row.Name ?? '',
    authority: row.Authority ?? '',
    url: row.Url ?? '',
    licenseNumber: row['License Number'] ?? '',
    startedOn: parseDate(row['Started On']),
    finishedOn: parseDate(row['Finished On']),
  };
}

export function normalizeLanguage(row: Record<string, string>): Language {
  const proficiency = row.Proficiency ?? '';
  return {
    name: row.Name ?? '',
    proficiency,
    stars: proficiencyToStars(proficiency),
  };
}

export function normalizeSkill(row: Record<string, string>): Skill {
  return {name: row.Name ?? ''};
}

export function normalizeProject(row: Record<string, string>): Project {
  return {
    title: row.Title ?? '',
    description: (row.Description ?? '').trim(),
    url: row.Url ?? '',
    startedOn: parseDate(row['Started On']),
    finishedOn: parseDate(row['Finished On']),
  };
}

export function normalizeProfile(row: Record<string, string>): Profile {
  // Intentionally omits Last Name, Address, Birth Date, Zip Code, Phone-like
  // columns, Twitter/Website/IM handles — all either private or already
  // surfaced elsewhere (SOCIALS in data.ts).
  return {
    firstName: row['First Name'] ?? '',
    headline: (row.Headline ?? '').trim(),
    summary: (row.Summary ?? '').trim(),
    industry: row.Industry ?? '',
    geoLocation: row['Geo Location'] ?? '',
  };
}

// Sort newest first; ongoing (null finishedOn) come before any past entries.
export function sortByRecent<T extends {startedOn: string | null; finishedOn: string | null}>(
  list: T[],
): T[] {
  const score = (d: string | null) => (d ?? '9999-99');
  return [...list].sort((a, b) => score(b.finishedOn).localeCompare(score(a.finishedOn))
    || score(b.startedOn).localeCompare(score(a.startedOn)));
}
