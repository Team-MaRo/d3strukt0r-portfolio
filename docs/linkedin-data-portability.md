# LinkedIn Member Data Portability — setup

Alternative to the ZIP archive export: use LinkedIn's official **Member Data Portability (MDP) API** to pull your own profile data (positions, education, certifications, languages, skills, …) via an authenticated HTTPS call. Output is JSON, so a build-time script can drop the content straight into `app/lib/data.ts` / `content/steps/*.md`.

**Eligibility:** LinkedIn members located in the **EEA or Switzerland** only (DMA-mandated). Location is derived from the `Geo Location` on your profile — set it to Switzerland if you aren't already.

## 1. Create the developer app

1. Go to <https://www.linkedin.com/developers/apps/> → **Create app**.
2. **Company page**: pick the shared page **"Member Data Portability (Member) Default Company"** (<https://www.linkedin.com/company/member-data-portability-member-default-company>). **Do not** create a new company page — requesting the MDP product only works if the app is linked to that default page.
3. Fill the rest (app name, logo, privacy policy URL = your site, T&C checkbox). Submit.

## 2. Request the MDP product

1. Open the app → **Products** tab.
2. Find **Member Data Portability API (Member)** → **Request access** → accept T&C.
3. Access is granted instantly for eligible accounts (no multi-day review for self-serve member access).

## 3. Generate an access token

Manual one-shot via LinkedIn's token tool (easiest, no callback URL dance):

1. Developer portal → **Docs and tools** → **OAuth Token Tools** → **Create token**.
2. Select your app.
3. Scope: **`r_dma_portability_self_serve`**.
4. **Request access token** → login → **Allow** consent.
5. Copy the resulting bearer token. (Short-lived — typically 60 days for self-serve; regenerate as needed.)

For a fully programmatic flow use the [Authorization Code flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow) with the same scope and your app's redirect URI.

## 4. Call the Snapshot API

Snapshot returns point-in-time data by domain. API is versioned — send a `LinkedIn-Version: YYYYMM` header.

```bash
TOKEN="<paste token>"
curl -sS 'https://api.linkedin.com/rest/memberSnapshotData?q=criteria&domain=POSITIONS' \
  -H "Authorization: Bearer $TOKEN" \
  -H "LinkedIn-Version: 202511" \
  -H "Content-Type: application/json"
```

Domains relevant to this portfolio (call one at a time):

| Domain             | What it contains                                      | Maps to                                           |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| `PROFILE`          | Name, headline, summary, geo                          | `SOCIALS`, hero copy                              |
| `POSITIONS`        | Jobs (company, title, dates, description)             | `EXPERIENCE` in `app/lib/data.ts` + `content/steps/*.md` |
| `EDUCATION`        | Schools, degrees, dates                               | `content/steps/*.md`                              |
| `CERTIFICATIONS`   | Name, issuer, year                                    | `CERTIFICATES` in `app/lib/data.ts`               |
| `LANGUAGES`        | Language + self-rated proficiency                     | `LANGUAGES` in `app/lib/data.ts`                  |
| `SKILLS`           | Skill names                                           | `SKILL_GROUPS` (partial)                          |
| `PROJECTS`         | Side projects                                         | `PROJECTS_FALLBACK` (optional)                    |

Full domain list: <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/snapshot-domain?view=li-dma-data-portability-2025-11>.

**Pagination:** responses include `paging.links[rel=next]`; keep calling until you get a "No data found" error (the `total` field is not reliable).

**Response shape:**

```json
{
  "paging": {"start": 0, "count": 10, "total": 2, "links": [...]},
  "elements": [
    {
      "snapshotDomain": "POSITIONS",
      "snapshotData": [
        {"Company Name": "IWF Web Solutions", "Title": "Junior Web Developer",
         "Started On": "Jan 2022", "Finished On": "", "Description": "..."}
      ]
    }
  ]
}
```

## 5. Wire into the build

Not usable from the browser at runtime — LinkedIn doesn't set CORS for `api.linkedin.com`, and shipping a long-lived token to a static site would leak it. Run the fetch at build time, commit the resulting JSON (or regenerate on each deploy).

Minimal build hook (sketch — not yet wired in this repo):

The repo ships two syncers in `bin/linkedin/` that both write the same YAML files under `content/linkedin/` — pick whichever is convenient:

- `pnpm run sync:linkedin:csv` — reads local export from `data/linkedin/{basic,full}/`.
- `pnpm run sync:linkedin:api` — reads from the MDP API using `LINKEDIN_DMA_TOKEN` (loaded via `node --env-file=.env`).

Historical reference sketch (superseded by `bin/linkedin/from-api.ts`):

```ts
// bin/fetch-linkedin.mjs — run via `node bin/fetch-linkedin.mjs`
import fs from 'node:fs/promises';

const TOKEN = process.env.LINKEDIN_DMA_TOKEN;
const VERSION = '202511';
const domains = ['PROFILE', 'POSITIONS', 'EDUCATION', 'CERTIFICATIONS', 'LANGUAGES', 'SKILLS'];

for (const domain of domains) {
  const all = [];
  let url = `https://api.linkedin.com/rest/memberSnapshotData?q=criteria&domain=${domain}`;
  while (url) {
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'LinkedIn-Version': VERSION,
      },
    });
    if (!r.ok) break;
    const body = await r.json();
    all.push(...(body.elements?.[0]?.snapshotData ?? []));
    const next = body.paging?.links?.find((l) => l.rel === 'next')?.href;
    url = next ? `https://api.linkedin.com${next}` : null;
  }
  await fs.writeFile(`content/linkedin/${domain.toLowerCase()}.json`, JSON.stringify(all, null, 2));
}
```

Then either:
- **Build step**: a second script reads `content/linkedin/*.json` and writes `app/lib/data.generated.ts`, imported by `data.ts`. Commit the generated file so Pages builds don't need the token.
- **Manual**: open the JSONs, paste values into `data.ts` / new step markdowns. Slower but zero secrets in CI.

Prefer the manual merge for a personal site — full export runs maybe once a year, and it keeps the CI graph dependency-free.

## Caveats

- **Token lifetime** (60 days typical for self-serve). Regenerate before each sync.
- **EEA/CH only** — if LinkedIn ever thinks you're outside, the `Allow` step won't produce a token.
- **Versioned header is mandatory** — omitting `LinkedIn-Version` returns 400.
- **Rate limit**: undocumented but generous for self-serve; well within personal-site usage.
- **Changelog API** (separate from Snapshot) only returns the last 28 days of activity — not useful here.
- **Not live in-browser** — static site cannot call `api.linkedin.com` directly (CORS + token exposure). Always a build-time / CI step.

## Links

- Member-facing MDP overview: <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/member-data-portability-member/?view=li-dma-data-portability-2025-11>
- Snapshot API reference: <https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/member-snapshot-api?view=li-dma-data-portability-2025-11>
- LinkedIn help article (data export): <https://www.linkedin.com/help/linkedin/answer/a6214075>
- Developer portal: <https://www.linkedin.com/developers>
