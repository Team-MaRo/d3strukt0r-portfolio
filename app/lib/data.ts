// Structured data for the portfolio. LinkedIn-sourced lists (EXPERIENCE,
// CERTIFICATES, LANGUAGES) are re-exported from `./linkedin` which loads the
// generated YAML under `content/linkedin/`. Refresh with:
//   pnpm run sync:linkedin:csv   (from local archive in `data/linkedin/`)
//   pnpm run sync:linkedin:api   (live via Member Data Portability API)
// Everything else below is hand-authored.

export {CERTIFICATES, EXPERIENCE, LANGUAGES} from './linkedin';
export type {CertEntry, ExpEntry, LanguageEntry} from './linkedin';

export const STATS = [
  {value: '5+', labelKey: 'stats.years'},
  {value: '5', labelKey: 'stats.languages'},
  {value: '4', labelKey: 'stats.certs'},
  {value: '∞', labelKey: 'stats.anime'},
] as const;

export const SKILL_GROUPS = [
  {key: 'backend', items: ['PHP 8.2', 'Symfony 5.4', 'PhpUnit 9', 'CraftCMS', 'MySQL', 'Twig']},
  {key: 'frontend', items: ['React 18', 'JavaScript ES6', 'Less', 'SCSS', 'HTML5', 'CSS3']},
  {key: 'tools', items: ['Git', 'Docker', 'Vite.js', 'Webpack', 'Vagrant', 'PhpStorm']},
  {key: 'business', items: ['SAP S/4HANA', 'Scrum (PSD I)', 'Req. Engineering', 'Accounting']},
] as const;

export const DAILY_STACK = [
  {name: 'php', pct: 92},
  {name: 'symfony', pct: 88},
  {name: 'react', pct: 80},
  {name: 'docker', pct: 70},
  {name: 'sap/erp', pct: 60},
] as const;

export const PROJECTS_FALLBACK = [
  {name: 'personal-site', descEn: 'This portfolio, open source.', descDe: 'Dieses Portfolio, Open Source.', stars: 0, lang: 'TypeScript', url: 'https://github.com/D3strukt0r/d3strukt0r.github.io'},
  {name: 'symfony-starter', descEn: 'Opinionated Symfony 6 starter.', descDe: 'Opinionated Symfony 6 Starter.', stars: 12, lang: 'PHP', url: 'https://github.com/D3strukt0r'},
  {name: 'craft-boilerplate', descEn: 'CraftCMS + Vite + Docker.', descDe: 'CraftCMS + Vite + Docker.', stars: 8, lang: 'PHP', url: 'https://github.com/D3strukt0r'},
] as const;

export const SOCIALS = {
  email: 'gh-contact@d3st.dev',
  github: 'https://github.com/D3strukt0r',
  linkedin: 'https://www.linkedin.com/in/d3strukt0r/',
  twitter: 'https://x.com/D3strukt0r1',
  xing: 'https://www.xing.com/profile/Manuele_xx/cv',
} as const;

export const QUALIFICATIONS = {
  programs: [
    {name: 'JetBrains PhpStorm', stars: 4},
    {name: 'Microsoft Word', stars: 4},
    {name: 'Microsoft Excel', stars: 4},
    {name: 'Microsoft PowerPoint', stars: 4},
    {name: 'JetBrains IntelliJ', stars: 3},
    {name: 'Nexus Hospis', stars: 3},
    {name: 'Microsoft VS Code', stars: 2},
  ],
  stack: {
    languages: [
      {name: 'HTML', stars: 4},
      {name: 'PHP (OOP)', stars: 4},
      {name: 'Twig', stars: 4},
      {name: 'CSS', stars: 2},
      {name: 'JavaScript', stars: 2},
      {name: 'SQL', stars: 2},
      {name: 'Java', stars: 2},
    ],
    databases: [{name: 'MySQL', stars: 3}],
    os: [
      {name: 'Windows', stars: 3},
      {name: 'Ubuntu', stars: 2},
    ],
    vcs: [{name: 'Git', stars: 3}],
  },
} as const;
