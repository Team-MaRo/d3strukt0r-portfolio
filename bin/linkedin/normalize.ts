import type {
  Certification, Education, Language, Position, Profile, Project, Skill,
} from './schema';

// "Jan 2022" | "Nov 2015" → "2022-01"; "" → null.
const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

export function parseDate(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const s = String(raw).trim();
  if (!s) {
    return null;
  }
  const m = /^([A-Z]{3})\s+(\d{4})$/i.exec(s);
  if (m) {
    const mo = MONTHS[m[1] as keyof typeof MONTHS];
    return mo ? `${m[2]}-${mo}` : null;
  }
  if (/^\d{4}-\d{2}$/.test(s)) {
    return s;
  }
  if (/^\d{4}$/.test(s)) {
    return `${s}-01`;
  }
  return null;
}

// LinkedIn proficiency string → 1–5 stars.
export function proficiencyToStars(prof: string): number {
  const p = (prof || '').toLowerCase();
  if (p.includes('native') || p.includes('bilingual')) {
    return 5;
  }
  if (p.includes('full professional')) {
    return 4;
  }
  if (p.includes('professional working') || p.startsWith('professional ')) {
    return 4;
  }
  if (p.includes('limited working')) {
    return 3;
  }
  if (p.includes('elementary')) {
    return 2;
  }
  return 1;
}

export function normalizePosition(row: Record<string, string>): Position {
  return {
    company: row['Company Name'] ?? '',
    title: row.Title ?? '',
    location: row.Location ?? '',
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
