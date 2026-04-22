#!/usr/bin/env node
// Sync via LinkedIn Member Data Portability Snapshot API → content/linkedin/*.de.yml.
// Requires LINKEDIN_DMA_TOKEN in the env (see .env.example + docs/linkedin-data-portability.md).
// Run with:
//   pnpm run sync:linkedin:api
//
// The Snapshot API returns one envelope per domain. Its `snapshotData` rows
// share the same "Human-label" column names as the CSV export, so the same
// normalizers apply.

import {join} from 'node:path';
import process from 'node:process';

import {
  normalizeCertification,
  normalizeEducation,
  normalizeLanguage,
  normalizePosition,
  normalizeProfile,
  normalizeProject,
  normalizeSkill,
  sortByRecent,
} from './normalize';
import type {FileHeader} from './schema';
import {writeYaml} from './yaml';

const TOKEN = process.env.LINKEDIN_DMA_TOKEN;
const VERSION = process.env.LINKEDIN_API_VERSION ?? '202511';
const OUT_DIR = join(process.cwd(), 'content', 'linkedin');

if (!TOKEN) {
  console.error('[linkedin] LINKEDIN_DMA_TOKEN not set. Fill .env (see .env.example).');
  process.exit(1);
}

interface SnapshotEnvelope {
  paging?: {links?: Array<{rel: string; href: string}>};
  elements?: Array<{
    snapshotDomain: string;
    snapshotData: Array<Record<string, string>>;
  }>;
}

async function fetchDomain(domain: string): Promise<Array<Record<string, string>>> {
  const rows: Array<Record<string, string>> = [];
  let url: string | null = `https://api.linkedin.com/rest/memberSnapshotData?q=criteria&domain=${domain}`;
  while (url) {
    const res: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'LinkedIn-Version': VERSION,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn(`[linkedin] ${domain}: ${res.status} — ${body.slice(0, 200)}`);
      break;
    }
    const body = await res.json() as SnapshotEnvelope;
    const envelope = body.elements?.[0];
    if (envelope?.snapshotData) {
      rows.push(...envelope.snapshotData);
    }
    const next = body.paging?.links?.find((l) => l.rel === 'next')?.href;
    url = next ? `https://api.linkedin.com${next}` : null;
  }
  return rows;
}

const header: FileHeader = {source: 'api', generatedAt: new Date().toISOString()};

const [profileRows, positionRows, educationRows, certRows, langRows, skillRows, projectRows]
  = await Promise.all([
    fetchDomain('PROFILE'),
    fetchDomain('POSITIONS'),
    fetchDomain('EDUCATION'),
    fetchDomain('CERTIFICATIONS'),
    fetchDomain('LANGUAGES'),
    fetchDomain('SKILLS'),
    fetchDomain('PROJECTS'),
  ]);

const profile = profileRows[0] ? normalizeProfile(profileRows[0]) : null;
const positions = sortByRecent(positionRows.map(normalizePosition));
const education = sortByRecent(educationRows.map(normalizeEducation));
const certifications = sortByRecent(certRows.map(normalizeCertification));
const languages = langRows.map(normalizeLanguage);
const skills = skillRows.map(normalizeSkill);
const projects = sortByRecent(projectRows.map(normalizeProject));

writeYaml(join(OUT_DIR, 'positions.de.yml'), positions, header);
writeYaml(join(OUT_DIR, 'education.de.yml'), education, header);
writeYaml(join(OUT_DIR, 'certifications.de.yml'), certifications, header);
writeYaml(join(OUT_DIR, 'languages.de.yml'), languages, header);
writeYaml(join(OUT_DIR, 'skills.de.yml'), skills, header);
writeYaml(join(OUT_DIR, 'projects.de.yml'), projects, header);
if (profile) {
  writeYaml(join(OUT_DIR, 'profile.de.yml'), profile, header);
}
