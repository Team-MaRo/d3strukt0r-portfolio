import type {Education} from './schema';
import {existsSync, readFileSync} from 'node:fs';
import yaml from 'js-yaml';
import {isNonEmpty} from '~/lib/guards';

// Merge hand-edited fields from an existing education.de.yml onto freshly
// normalized entries. Matched by `startedOn` since that's the most stable key
// across LinkedIn re-exports (school names occasionally get mangled).
export function preserveEducationLocation(outPath: string, entries: Education[]): Education[] {
  if (!existsSync(outPath)) {
    return entries;
  }
  const parsed = yaml.load(readFileSync(outPath, 'utf8'));
  if (!Array.isArray(parsed)) {
    return entries;
  }
  const byKey = new Map<string, Education>();
  for (const e of parsed as Education[]) {
    byKey.set(e.startedOn ?? '', e);
  }
  return entries.map((e) => {
    const prev = byKey.get(e.startedOn ?? '');
    return isNonEmpty(prev?.location) ? {...e, location: prev.location} : e;
  });
}
