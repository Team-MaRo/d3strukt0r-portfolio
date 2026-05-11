#!/usr/bin/env node
// Sync via LinkedIn Member Data Portability Snapshot API → content/linkedin/*.de.yml.
// Requires LINKEDIN_DMA_TOKEN in the env (see .env.example + docs/linkedin-data-portability.md).
// Run with:
//   pnpm run sync:linkedin:api
//
// The Snapshot API returns one envelope per domain. Its `snapshotData` rows
// share the same "Human-label" column names as the CSV export, so the same
// normalizers apply.
//
// Failure semantics: if ANY domain returns non-2xx, the script exits non-zero
// WITHOUT writing partial output — the existing YAMLs stay intact. This makes
// the scheduled `.github/workflows/linkedin-sync.yml` turn red on token expiry
// or API outage instead of silently committing wiped data.

import {join} from 'node:path';

import process from 'node:process';
import {isNonEmpty} from '~/lib/guards';
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

const TOKEN = process.env.LINKEDIN_DMA_TOKEN;
// `LinkedIn-Version: YYYYMM`. Microsoft Learn lists 202405 through 202511 as
// active for the Snapshot API, but those versions are only reachable with the
// `r_dma_portability_3rd_party` permission (granted to LinkedIn-approved 3rd
// party apps). The self-serve scope `r_dma_portability_self_serve` documented
// for individual members (see `docs/linkedin-data-portability.md`) is
// server-pinned to the 202312 contract — every newer version returns `426
// NONEXISTENT_VERSION`, confirmed by probing with a freshly regenerated 2026
// token. Override `LINKEDIN_API_VERSION` if LinkedIn ever extends self-serve
// to newer versions.
const VERSION = process.env.LINKEDIN_API_VERSION ?? '202312';
const OUT_DIR = join(process.cwd(), 'content', 'linkedin');

if (!isNonEmpty(TOKEN)) {
  console.error('[linkedin] LINKEDIN_DMA_TOKEN not set. Fill .env (see .env.dist).');
  process.exit(1);
}

interface SnapshotEnvelope {
  paging?: {links?: Array<{rel: string; href: string}>};
  elements?: Array<{
    snapshotDomain: string;
    snapshotData: Array<Record<string, string>>;
  }>;
}

type FetchResult
  = | {ok: true; domain: string; rows: Array<Record<string, string>>}
    | {ok: false; domain: string; status: number; body: string};

async function fetchDomain(domain: string): Promise<FetchResult> {
  const rows: Array<Record<string, string>> = [];
  let url: string | null = `https://api.linkedin.com/rest/memberSnapshotData?q=criteria&domain=${domain}`;
  while (isNonEmpty(url)) {
    const res: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'LinkedIn-Version': VERSION,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      return {ok: false, domain, status: res.status, body: await res.text()};
    }
    const body = await res.json() as SnapshotEnvelope;
    const envelope = body.elements?.[0];
    if (envelope?.snapshotData) {
      rows.push(...envelope.snapshotData);
    }
    const next = body.paging?.links?.find((l) => l.rel === 'next')?.href;
    url = isNonEmpty(next) ? `https://api.linkedin.com${next}` : null;
  }
  return {ok: true, domain, rows};
}

async function main(): Promise<void> {
  const [profileRes, positionsRes, educationRes, certsRes, languagesRes, skillsRes, projectsRes]
    = await Promise.all([
      fetchDomain('PROFILE'),
      fetchDomain('POSITIONS'),
      fetchDomain('EDUCATION'),
      fetchDomain('CERTIFICATIONS'),
      fetchDomain('LANGUAGES'),
      fetchDomain('SKILLS'),
      fetchDomain('PROJECTS'),
    ]);

  const all = [profileRes, positionsRes, educationRes, certsRes, languagesRes, skillsRes, projectsRes];
  const failures = all.filter((r): r is Extract<FetchResult, {ok: false}> => !r.ok);
  if (failures.length > 0) {
    for (const f of failures) {
      console.error(`[linkedin] ${f.domain}: ${f.status} — ${f.body.slice(0, 300)}`);
    }
    if (failures.some((f) => f.body.includes('NONEXISTENT_VERSION'))) {
      console.error(
        `[linkedin] Hint: LinkedIn-Version ${VERSION} not active for this token's scope. The`
        + ' self-serve `r_dma_portability_self_serve` contract is pinned to 202312 by LinkedIn'
        + ' server-side; newer versions require the `r_dma_portability_3rd_party` permission'
        + ' (LinkedIn-approved 3rd party apps only). Set LINKEDIN_API_VERSION=202312 in .env'
        + ' to use the supported version.',
      );
    }
    // Set exitCode + return rather than process.exit() — the latter races
    // libuv's async-handle shutdown on Windows and trips an internal assertion.
    process.exitCode = 1;
    return;
  }

  // All entries are ok here, but the failures check doesn't narrow the
  // destructured names — re-assert by reading .rows after a runtime guard.
  if (
    !profileRes.ok || !positionsRes.ok || !educationRes.ok || !certsRes.ok
    || !languagesRes.ok || !skillsRes.ok || !projectsRes.ok
  ) {
    return;
  }

  const profile = profileRes.rows[0] ? normalizeProfile(profileRes.rows[0]) : null;
  const positions = sortByRecent(positionsRes.rows.map(normalizePosition));
  const education = preserveEducationLocation(
    join(OUT_DIR, 'education.de.yml'),
    sortByRecent(educationRes.rows.map(normalizeEducation)),
  );
  const certifications = sortByRecent(certsRes.rows.map(normalizeCertification));
  const languages = languagesRes.rows.map(normalizeLanguage);
  const skills = skillsRes.rows.map(normalizeSkill);
  const projects = sortByRecent(projectsRes.rows.map(normalizeProject));

  writeYaml(join(OUT_DIR, 'positions.de.yml'), positions);
  writeYaml(join(OUT_DIR, 'education.de.yml'), education);
  writeYaml(join(OUT_DIR, 'certifications.de.yml'), certifications);
  writeYaml(join(OUT_DIR, 'languages.de.yml'), languages);
  writeYaml(join(OUT_DIR, 'skills.de.yml'), skills);
  writeYaml(join(OUT_DIR, 'projects.de.yml'), projects);
  if (profile) {
    writeYaml(join(OUT_DIR, 'profile.de.yml'), profile);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
