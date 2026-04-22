// Canonical LinkedIn-derived schema. Both the CSV importer and the API importer
// write files under `content/linkedin/` that match these shapes. The runtime
// (`app/lib/linkedin.ts`) imports the YAMLs and re-exposes typed arrays.

export interface Profile {
  firstName: string;
  headline: string;
  summary: string;
  industry: string;
  geoLocation: string;
}

export interface Position {
  company: string;
  title: string;
  // Optional English / German overrides, added by hand after first import.
  titleEn?: string;
  titleDe?: string;
  location: string;
  // Normalized to `YYYY-MM` or `null` for ongoing.
  startedOn: string | null;
  finishedOn: string | null;
  description: string;
  // Hand-added: tech stack chips to show alongside the row.
  stack?: string[];
  // Hand-added: employment type label ("Full-time", "Part-time", "Internship",
  // "Contract", "Freelance"). LinkedIn CSV doesn't expose this — fill via the
  // `/enrich-linkedin` skill or by hand.
  employmentType?: string;
  employmentTypeDe?: string;
}

export interface Education {
  school: string;
  degree: string;
  startedOn: string | null;
  finishedOn: string | null;
  notes: string;
  activities: string;
}

export interface Certification {
  name: string;
  authority: string;
  url: string;
  licenseNumber: string;
  startedOn: string | null;
  finishedOn: string | null;
}

export interface Language {
  name: string;
  // Optional EN/DE names + flag emoji + concise level label, added by hand
  // after import so the site can render localized rows with flags.
  nameEn?: string;
  nameDe?: string;
  flag?: string;
  level?: string;
  // Original LinkedIn proficiency string ("Native or bilingual proficiency", "Limited working proficiency", …).
  proficiency: string;
  // Derived 1–5 from `proficiency` by the normalizer; hand-editable.
  stars: number;
}

export interface Skill {
  name: string;
}

export interface Project {
  title: string;
  description: string;
  url: string;
  startedOn: string | null;
  finishedOn: string | null;
}

export interface FileHeader {
  source: 'csv' | 'api';
  generatedAt: string;
}
