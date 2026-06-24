import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {dump} from 'js-yaml';

export function writeYaml(path: string, data: unknown): void {
  mkdirSync(dirname(path), {recursive: true});
  const banner = '# DO NOT EDIT generated keys; German overrides (e.g. `titleDe`) are safe to add by hand.\n';
  const body = dump(data, {lineWidth: 100, noRefs: true, sortKeys: false});
  writeFileSync(path, banner + body);
  // eslint-disable-next-line no-console -- informational build-tool output
  console.log(`[linkedin] wrote ${path} (${Array.isArray(data) ? `${data.length} entries` : 'object'})`);
}
