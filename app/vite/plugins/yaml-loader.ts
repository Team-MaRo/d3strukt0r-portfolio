import type {Plugin} from 'vite';
import {readFile} from 'node:fs/promises';
import yaml from 'js-yaml';

// Parse *.yml?parsed imports at build time so js-yaml stays out of the client
// bundle and the runtime receives a plain JS object/array.
export function yamlLoader(): Plugin {
  return {
    name: 'yaml-loader',
    enforce: 'pre',
    async load(id) {
      const [filepath, query] = id.split('?');
      if (!filepath?.endsWith('.yml') || query !== 'parsed') {
        return null;
      }
      this.addWatchFile(filepath);
      const raw = await readFile(filepath, 'utf8');
      const data = yaml.load(raw);
      return `export default ${JSON.stringify(data)};`;
    },
  };
}
