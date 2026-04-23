import type {FileHeader} from './schema';
import {mkdirSync, writeFileSync} from 'node:fs';
import {basename, dirname} from 'node:path';
import yaml from 'js-yaml';

export function writeYaml(path: string, data: unknown, header: FileHeader): void {
  mkdirSync(dirname(path), {recursive: true});
  const banner
    = `# content/linkedin/${basename(path)}\n`
      + `# generated from ${header.source} @ ${header.generatedAt}\n`
      + `# DO NOT EDIT generated keys; German overrides (e.g. \`titleDe\`) are safe to add by hand.\n`;
  const body = yaml.dump(data, {lineWidth: 100, noRefs: true, sortKeys: false});
  writeFileSync(path, banner + body);
  console.log(`[linkedin] wrote ${path} (${Array.isArray(data) ? `${data.length} entries` : 'object'})`);
}
