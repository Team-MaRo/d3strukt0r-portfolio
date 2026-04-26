---
name: enrich-linkedin
description: Enrich `content/linkedin/positions.en.yml` with the fields LinkedIn CSV/API doesn't expose — tech-stack chips (`stack`) and employment type (`employmentType` / `employmentTypeDe`) — by inferring them from each position's `description` in `positions.de.yml`. Trigger when user says "enrich linkedin", "infer stack", "fill employment types", runs `/enrich-linkedin`, or mentions missing stack chips / missing "Teilzeit/Vollzeit" labels on the experience timeline.
---

# Enrich LinkedIn positions (stack + employment type)

LinkedIn's CSV export and Member Snapshot API don't expose `employmentType` or a structured tech stack. Both fields live in the free-text `description` column ("Backend - PHP 8.2 - Symfony 5.4 …" / "Praktikum" / "Teilzeit") or in the job title. This skill reads each position and writes the inferred values into the corresponding entry in `positions.en.yml`.

## Inputs

- `content/linkedin/positions.de.yml` — source of truth for `title`, `description`, `startedOn`, `finishedOn`, `location`.
- `content/linkedin/positions.en.yml` — overlay where stack + employmentType + translations are stored. Preserve existing hand edits.

## Output

Rewrite `positions.en.yml` so that each entry (by index, length must match `.de.yml`) contains — in addition to whatever was already there — an inferred `stack: string[]` and `employmentType: string` + `employmentTypeDe: string` when they can be deduced with high confidence.

## Rules

### Inferring `stack`

Scan the `description` for tech-stack mentions and emit them as chips. Normalize to the forms already used on the site (`PHP 8.2`, `Symfony 5.4`, `React 18`, `Vite`, `CraftCMS`, `Twig`, `SCSS`, `Less`, `Docker`, `Git`, `Vagrant`, `PhpStorm`, `Webpack`, `ESLint`, `PhpUnit 9`, `JavaScript (ES6)`). Keep versions when present in the text. Order chips in the order they appear in the description.

Cap at ~4–6 chips per row to stay visually clean. Prefer the most prominent: primary language, primary framework, primary frontend tech, primary tool. Drop redundant entries ("JavaScript" if "React" already implies it, "ES6" if "JavaScript (ES6)" is already a chip).

Do NOT invent technologies that aren't in the description. For non-dev roles (Buchhaltung, Einkauf, Lager, Patientenabrechnung) leave `stack` absent.

### Inferring `employmentType` + `employmentTypeDe`

LinkedIn's canonical labels (use these verbatim for `employmentType`):
- `Full-time` / `Vollzeit`
- `Part-time` / `Teilzeit`
- `Internship` / `Praktikum`
- `Contract` / `Befristet`
- `Freelance` / `Freiberuflich`
- `Apprenticeship` / `Ausbildung`

Signals to look for:
- Job title contains "Praktikant" / "Intern" → `Internship` / `Praktikum`.
- Job title contains "Aushilfe" / "Assistant" (short stint, odd hours) → `Part-time` / `Aushilfe`.
- Description mentions "Teilzeit" / "part-time" → `Part-time`.
- Description mentions "mit Unterbrechungen" (intermittent) → likely `Part-time` / `Teilzeit`.
- Short duration (< 6 months) in a non-intern role → likely `Contract` / `Befristet`.
- Long-term (> 1 year) without other signals → default to `Full-time` / `Vollzeit`.

If truly ambiguous, omit the field rather than guessing.

### Never touch

- Translated text the user or `/translate-linkedin` already produced (`title`, `location`, `description`).
- Dates, `company`, array ordering.

## Procedure

1. Read `positions.de.yml` and `positions.en.yml`.
2. For each position (by index), decide `stack`, `employmentType`, `employmentTypeDe`.
3. Merge over the existing EN entry (never drop existing keys).
4. Write `positions.en.yml` preserving banner + key order used in the file.
5. Report a one-line summary per entry: `[<i>] <company> / <title> → stack: [..], employment: <type>`.

## Not in scope

- Don't infer stack for education / certification / project YAMLs — only positions.
- Don't commit.
- Don't modify `.de.yml`.
