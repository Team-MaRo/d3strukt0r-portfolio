#!/usr/bin/env node
// Sync LinkedIn "Download your data" CSV archive → content/linkedin/*.de.yml.
// Reads data/linkedin/<Topic>.csv, normalizes each row into the shared schema,
// writes YAML. Run with:
//   pnpm run sync:linkedin:csv

import type {FileHeader} from './schema';
import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import process from 'node:process';

import {parse} from 'csv-parse/sync';
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
import {preserveEducationLocation} from './preserve';
import {writeYaml} from './yaml';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'data', 'linkedin');
const OUT_DIR = join(ROOT, 'content', 'linkedin');

function findCsv(filename: string): string | null {
  const p = join(SRC_DIR, filename);
  return existsSync(p) ? p : null;
}

function parseCsv(path: string): Array<Record<string, string>> {
  const raw = readFileSync(path, 'utf8');
  return parse(raw, {columns: true, skip_empty_lines: true, trim: true});
}

function load<T>(filename: string, normalize: (row: Record<string, string>) => T): T[] {
  const path = findCsv(filename);
  if (!path) {
    console.warn(`[linkedin] ${filename}: not found, skipping`);
    return [];
  }
  return parseCsv(path).map(normalize);
}

const header: FileHeader = {source: 'csv', generatedAt: new Date().toISOString()};

const positions = sortByRecent(load('Positions.csv', normalizePosition));
const education = preserveEducationLocation(
  join(OUT_DIR, 'education.de.yml'),
  sortByRecent(load('Education.csv', normalizeEducation)),
);
const certifications = sortByRecent(load('Certifications.csv', normalizeCertification));
const languages = load('Languages.csv', normalizeLanguage);
const skills = load('Skills.csv', normalizeSkill);
const projects = sortByRecent(load('Projects.csv', normalizeProject));
const profileRows = load('Profile.csv', normalizeProfile);
const profile = profileRows[0] ?? null;

writeYaml(join(OUT_DIR, 'positions.de.yml'), positions, header);
writeYaml(join(OUT_DIR, 'education.de.yml'), education, header);
writeYaml(join(OUT_DIR, 'certifications.de.yml'), certifications, header);
writeYaml(join(OUT_DIR, 'languages.de.yml'), languages, header);
writeYaml(join(OUT_DIR, 'skills.de.yml'), skills, header);
writeYaml(join(OUT_DIR, 'projects.de.yml'), projects, header);
if (profile) {
  writeYaml(join(OUT_DIR, 'profile.de.yml'), profile, header);
}
