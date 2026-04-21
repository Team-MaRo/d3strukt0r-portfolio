// Structured data for the portfolio. Human-readable labels live in locales/*.json;
// this file only holds enumerations + items whose names are either language-neutral
// (tech stack) or where the EN/DE text is identical.

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

export interface ExpEntry {
  company: string;
  period: string;
  roleEn: string;
  roleDe: string;
  durationEn: string;
  durationDe: string;
  stack: string[];
  location: string;
}

export const EXPERIENCE: ExpEntry[] = [
  {
    company: 'IWF Web Solutions', period: '2022 — Today',
    roleEn: 'Junior Web Developer', roleDe: 'Junior Web Developer',
    durationEn: '4y · part-time', durationDe: '4 Jahre · Teilzeit',
    stack: ['PHP 8.2', 'Symfony 5.4', 'React 18', 'Vite'],
    location: 'Switzerland',
  },
  {
    company: 'IWF Web Solutions', period: '2021',
    roleEn: 'Web Dev Intern', roleDe: 'Praktikant Webentwicklung',
    durationEn: '1 year', durationDe: '1 Jahr',
    stack: ['PHP 8.0', 'CraftCMS', 'Twig', 'SCSS'],
    location: 'Switzerland',
  },
  {
    company: 'FHNW', period: '2018 — 2022',
    roleEn: 'BSc Business IT', roleDe: 'BSc Wirtschaftsinformatik',
    durationEn: 'Bachelor\'s degree', durationDe: 'Bachelorabschluss',
    stack: ['Business', 'IT', 'Web'],
    location: 'Switzerland',
  },
];

export const CERTIFICATES = [
  {year: '2023', name: 'Professional Scrum Developer I', issuer: 'Scrum.org'},
  {year: '2021', name: 'SAP Certified App Associate — S/4HANA', issuer: 'SAP'},
  {year: '2019', name: 'IREB Requirements Engineering', issuer: 'SAQ'},
  {year: '2018', name: 'Cambridge English CAE (C1)', issuer: 'Cambridge English'},
  {year: '2015', name: 'DELF B1', issuer: 'Ministère de l\'Éducation nationale'},
] as const;

export const LANGUAGES = [
  {flag: '🇩🇪', nameEn: 'German', nameDe: 'Deutsch', level: 'Native', stars: 5},
  {flag: '🇬🇧', nameEn: 'English', nameDe: 'Englisch', level: 'C1 · CAE', stars: 4},
  {flag: '🇫🇷', nameEn: 'French', nameDe: 'Französisch', level: 'B1 · DELF', stars: 2},
  {flag: '🇪🇸', nameEn: 'Spanish', nameDe: 'Spanisch', level: 'A2', stars: 3},
  {flag: '🇮🇹', nameEn: 'Italian', nameDe: 'Italienisch', level: 'A1', stars: 1},
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
