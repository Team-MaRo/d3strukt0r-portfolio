// Shared content for both portfolio directions — bilingual (EN/DE).
// Edit here and both variants update.

window.PORTFOLIO_CONTENT = {
  name: "Manuele",
  handle: "@d3strukt0r",
  location: { en: "Switzerland", de: "Schweiz" },
  email: "gh-contact@d3st.dev",
  github: "https://github.com/D3strukt0r",
  linkedin: "https://www.linkedin.com/in/d3strukt0r/",
  twitter: "https://x.com/D3strukt0r1",
  blogUrl: "/archive/",

  role: {
    en: "Full-Stack Web Developer",
    de: "Full-Stack Web Developer",
  },

  tagline: {
    en: "I build web software where business logic meets clean code — PHP, Symfony, React, and a BSc in Business IT to bridge the gap.",
    de: "Ich baue Web-Software an der Schnittstelle von Fachlogik und sauberem Code — PHP, Symfony, React, und ein BSc in Wirtschaftsinformatik, der beide Welten verbindet.",
  },

  hero: {
    en: {
      eyebrow: "Swiss full-stack developer",
      title: "Building business-grade web software, one commit at a time.",
      sub: "5+ years shipping production Symfony & React at IWF Web Solutions. Business IT graduate. Five languages. Anime on the second monitor.",
      primary: "See my work",
      secondary: "Get in touch",
    },
    de: {
      eyebrow: "Schweizer Full-Stack Developer",
      title: "Business-Web-Software bauen, ein Commit nach dem anderen.",
      sub: "5+ Jahre Produktions-Symfony & React bei IWF Web Solutions. Wirtschaftsinformatik-Absolvent. Fünf Sprachen. Anime auf dem zweiten Monitor.",
      primary: "Meine Arbeit",
      secondary: "Kontakt",
    },
  },

  about: {
    en: [
      "I'm Manuele — a Swiss full-stack developer. I've spent the last five years at IWF Web Solutions shipping Symfony backends and React frontends for real businesses.",
      "Before code, I trained as a businessman (EFZ + BM) and studied Business IT at FHNW. That mix is the unfair advantage: I can read a balance sheet, scope a feature, and ship it.",
      "Outside of work I'm usually debugging a side project, practising one of the five languages I speak, or catching up on anime.",
    ],
    de: [
      "Ich bin Manuele — Schweizer Full-Stack Developer. Die letzten fünf Jahre habe ich bei IWF Web Solutions Symfony-Backends und React-Frontends für echte Unternehmen gebaut.",
      "Vor dem Coden habe ich den Kaufmann EFZ mit BM gemacht und Wirtschaftsinformatik an der FHNW studiert. Diese Mischung ist mein Vorteil: Ich lese eine Bilanz, scope ein Feature und liefere es aus.",
      "Ausserhalb der Arbeit debugge ich meistens ein Nebenprojekt, übe eine meiner fünf Sprachen oder schaue Anime.",
    ],
  },

  stats: [
    { value: "5+", label: { en: "Years shipping", de: "Jahre Erfahrung" } },
    { value: "5", label: { en: "Languages spoken", de: "Sprachen gesprochen" } },
    { value: "4", label: { en: "Certifications", de: "Zertifizierungen" } },
    { value: "∞", label: { en: "Anime watched", de: "Anime geschaut" } },
  ],

  skills: {
    en: [
      { group: "Backend", items: ["PHP 8.2", "Symfony 5.4", "PhpUnit 9", "CraftCMS", "MySQL", "Twig"] },
      { group: "Frontend", items: ["React 18", "JavaScript ES6", "Less", "SCSS", "HTML5", "CSS3"] },
      { group: "Tools", items: ["Git", "Docker", "Vite.js", "Webpack", "Vagrant", "PhpStorm"] },
      { group: "Business", items: ["SAP S/4HANA", "Scrum (PSD I)", "Req. Engineering", "Accounting"] },
    ],
    de: [
      { group: "Backend", items: ["PHP 8.2", "Symfony 5.4", "PhpUnit 9", "CraftCMS", "MySQL", "Twig"] },
      { group: "Frontend", items: ["React 18", "JavaScript ES6", "Less", "SCSS", "HTML5", "CSS3"] },
      { group: "Tools", items: ["Git", "Docker", "Vite.js", "Webpack", "Vagrant", "PhpStorm"] },
      { group: "Wirtschaft", items: ["SAP S/4HANA", "Scrum (PSD I)", "Req. Engineering", "Buchhaltung"] },
    ],
  },

  // Projects — pulled live from GitHub at runtime; these are hand-picked highlights as fallbacks.
  // Real list comes from github.com/D3strukt0r/repos (public, no auth needed).
  projectsFallback: [
    { name: "personal-site", desc: { en: "This portfolio, open source.", de: "Dieses Portfolio, Open Source." }, stars: 0, lang: "TypeScript" },
    { name: "symfony-starter", desc: { en: "Opinionated Symfony 6 starter.", de: "Opinionated Symfony 6 Starter." }, stars: 12, lang: "PHP" },
    { name: "craft-boilerplate", desc: { en: "CraftCMS + Vite + Docker.", de: "CraftCMS + Vite + Docker." }, stars: 8, lang: "PHP" },
  ],

  blog: [
    { title: { en: "First post", de: "Erster Beitrag" }, date: "2020-10-12", tag: "meta", url: "https://d3strukt0r.github.io/2020/10/12/first-post/" },
  ],

  experience: [
    {
      company: "IWF Web Solutions",
      role: { en: "Junior Web Developer", de: "Junior Web Developer" },
      period: "2022 — Today",
      duration: { en: "4y 4m · part-time", de: "4 Jahre 4 Monate · Teilzeit" },
      stack: ["PHP 8.2", "Symfony 5.4", "React 18", "Vite"],
      location: "Pratteln, BL",
    },
    {
      company: "IWF Web Solutions",
      role: { en: "Web Dev Intern", de: "Praktikant Webentwicklung" },
      period: "2021",
      duration: { en: "1 year", de: "1 Jahr" },
      stack: ["PHP 8.0", "CraftCMS", "Twig", "SCSS"],
      location: "Pratteln, BL",
    },
    {
      company: "FHNW",
      role: { en: "BSc Business IT", de: "BSc Wirtschaftsinformatik" },
      period: "2018 — 2022",
      duration: { en: "Bachelor's degree", de: "Bachelorabschluss" },
      stack: ["Business", "IT", "Web"],
      location: "Basel",
    },
  ],

  certificates: [
    { name: "Professional Scrum Developer I", issuer: "Scrum.org", year: "2023" },
    { name: "SAP Certified App Associate — S/4HANA", issuer: "SAP", year: "2021" },
    { name: "IREB Requirements Engineering", issuer: "SAQ", year: "2019" },
    { name: "Cambridge English CAE (C1)", issuer: "Cambridge English", year: "2018" },
    { name: "DELF B1", issuer: "Ministère de l'Éducation nationale", year: "2015" },
  ],

  languages: [
    { name: { en: "German", de: "Deutsch" }, level: "Native", stars: 5, flag: "🇩🇪" },
    { name: { en: "English", de: "Englisch" }, level: "C1 · CAE", stars: 4, flag: "🇬🇧" },
    { name: { en: "French", de: "Französisch" }, level: "B1 · DELF", stars: 3, flag: "🇫🇷" },
    { name: { en: "Spanish", de: "Spanisch" }, level: "A2", stars: 2, flag: "🇪🇸" },
    { name: { en: "Italian", de: "Italienisch" }, level: "A1", stars: 1, flag: "🇮🇹" },
  ],

  contact: {
    en: {
      eyebrow: "Get in touch",
      title: "Let's build something.",
      sub: "Full-time, freelance, or just to chat about anime — my inbox is open.",
    },
    de: {
      eyebrow: "Kontakt",
      title: "Lass uns etwas bauen.",
      sub: "Festanstellung, Freelance, oder einfach um über Anime zu reden — mein Postfach ist offen.",
    },
  },

  nav: {
    en: ["About", "Skills", "Work", "Writing", "Contact"],
    de: ["Über mich", "Skills", "Projekte", "Blog", "Kontakt"],
  },
};
