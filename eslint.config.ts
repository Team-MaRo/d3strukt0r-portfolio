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
);
