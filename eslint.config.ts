import {iwfWebStandardTs} from '@iwf-web/eslint-coding-standard';

export default iwfWebStandardTs({},
  {
    ignores: ['build/**', '.react-router/**', 'scripts/**'],
  },
  // The preset's allowDefaultProject glob (`*.ts`) collides with tsconfig's
  // `**/*.ts` include for root files like `vite.config.ts` — typescript-eslint
  // refuses to parse them. Narrow the default project to `*.js` only; every
  // .ts file is already covered by the tsconfig project service.
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js'],
        },
      },
    },
  },
  // The Cloudflare Workers entry (workers/) is excluded from the main tsconfig
  // program so the Workers runtime globals (worker-configuration.d.ts) don't
  // clobber the app's DOM `fetch`/`Response` types. typescript-eslint's project
  // service only auto-discovers files named `tsconfig.json`, so it can't type-
  // resolve files that live solely in tsconfig.cloudflare.json. The worker is a
  // tiny adapter type-checked on its own via that project (see the `typecheck`
  // script), so skip it here rather than fight the project-service resolution.
  {
    ignores: ['workers/**'],
  },
);
