import type {Route} from './+types/home';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Flag} from '~/components/Flag';
import {useContribGraph, useContributions, useGithubRepos, useGithubUser} from '~/hooks/useGithub';
import {posts} from '~/lib/content';

import {
  CERTIFICATES, DAILY_STACK, EXPERIENCE, LANGUAGES, PROJECTS_FALLBACK,
  SKILL_GROUPS, SOCIALS, STATS,
} from '~/lib/data';

export function meta(_: Route.MetaArgs) {
  return [{title: 'Manuele · Full-Stack Web Developer'}];
}

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <About />
      <Skills />
      <Github />
      <Projects />
      <Experience />
      <Meta />
      <Contact />
    </>
  );
}

function Heading({num, code, title}: {num: string; code: string; title: string}) {
  return (
    <div className="ta-heading">
      <div className="ta-hnum" data-reveal>{num}</div>
      <div className="ta-hcode" data-reveal data-delay="1"><span className="ta-dim">$</span> {code}</div>
      <h2 className="ta-h2" data-reveal data-delay="2">{title}</h2>
    </div>
  );
}

function Hero() {
  const {t, i18n} = useTranslation();
  const lang = i18n.resolvedLanguage ?? 'en';
  const nowItems = t('hero.now', {returnObjects: true}) as string[];
  const [typed, setTyped] = useState('');
  const full = t('hero.whoami_cmd');

  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(id);
      }
    }, 60);
    return () => window.clearInterval(id);
  }, [full]);

  const date = new Date().toISOString().slice(0, 10);

  return (
    <section id="top" className="ta-hero">
      <div className="ta-hero-grid">
        <div className="ta-hero-main">
          <div className="ta-shell ta-glass">
            <div className="ta-shell-head">
              <span className="ta-dot r" /><span className="ta-dot y" /><span className="ta-dot g" />
              <span className="ta-shell-title">zsh — manuele@portfolio — ~</span>
            </div>
            <div className="ta-shell-body">
              <div>
                <span className="ta-prompt">→</span>{' '}
                <span>{typed}<span className="ta-cursor-blink">▌</span></span>
              </div>
              <pre className="ta-ascii">{String.raw`  __  __                         _
 |  \/  | __ _ _ __  _   _  ___| | ___
 | |\/| |/ _\` | '_ \| | | |/ _ \ |/ _ \
 | |  | | (_| | | | | |_| |  __/ |  __/
 |_|  |_|\__,_|_| |_|\__,_|\___|_|\___|`}
              </pre>
              <div className="ta-meta-row">
                <span><span className="ta-key">{t('hero.name_label')}</span>: Manuele</span>
                <span><span className="ta-key">{t('hero.role_label')}</span>: Full-Stack Web Dev</span>
                <span><span className="ta-key">{t('hero.loc_label')}</span>: {t('location')}</span>
                <span className="ta-ok">● {t('hero.online')}</span>
              </div>
            </div>
          </div>

          <h1 className="ta-hero-title">{t('hero.title')}</h1>
          <p className="ta-hero-sub">{t('hero.sub')}</p>

          <div className="ta-hero-cta">
            <a href="#work" className="ta-btn ta-btn-primary cursor-hover">
              <span>{t('hero.cta_work')}</span>
              <span className="ta-btn-arrow">→</span>
            </a>
            <a href="#contact" className="ta-btn ta-btn-ghost cursor-hover">
              {t('hero.cta_contact')}
            </a>
          </div>
        </div>

        <div className="ta-hero-side">
          <div className="ta-sidecard ta-glass">
            <div className="ta-sidecard-head">
              <span>{t('hero.now_title')}</span>
              <span className="ta-dim">· {date}</span>
            </div>
            <ul className="ta-sidecard-list">
              {nowItems.map((item, i) => (
                <li key={i}>
                  <span className="ta-check">{['✓', '✓', '→', '◎'][i] ?? '·'}</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="ta-sidecard ta-glass ta-side-skills">
            <div className="ta-sidecard-head">
              <span>{t('hero.stack_title')}</span>
            </div>
            {DAILY_STACK.map((s) => (
              <div key={s.name} className="ta-side-skillrow">
                <span>{s.name}</span>
                <span className="ta-bar"><span style={{width: `${s.pct}%`}} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* hidden reference to lang to avoid unused warning */}
      <span hidden>{lang}</span>
    </section>
  );
}

function Stats() {
  const {t} = useTranslation();
  return (
    <section className="ta-stats-strip ta-glass">
      {STATS.map((s) => (
        <div key={s.labelKey} className="ta-stat-item">
          <div className="ta-stat-val">{s.value}</div>
          <div className="ta-stat-lab">{t(s.labelKey)}</div>
        </div>
      ))}
    </section>
  );
}

function About() {
  const {t} = useTranslation();
  const paragraphs = t('about.paragraphs', {returnObjects: true}) as string[];
  return (
    <section id="about" className="ta-section">
      <Heading num={t('about.num')} code={t('about.code')} title={t('about.title')} />
      <div className="ta-about-grid">
        <div className="ta-about-main ta-glass">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? 'ta-lead' : ''} data-reveal data-delay={String(i)}>{p}</p>
          ))}
        </div>
        <div className="ta-about-side">
          <div className="ta-glass ta-card-mini">
            <div className="ta-card-head">{t('about.identity_title')}</div>
            <pre className="ta-json">{`{
  "from":    "Switzerland",
  "edu":     "BSc Business IT",
  "speaks":  ${LANGUAGES.length},
  "ships":   "yes",
  "anime":   true
}`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Skills() {
  const {t} = useTranslation();
  return (
    <section id="stack" className="ta-section">
      <Heading num={t('skills.num')} code={t('skills.code')} title={t('skills.title')} />
      <div className="ta-stack-grid">
        {SKILL_GROUPS.map((g, i) => (
          <div key={g.key} className="ta-glass ta-stack-card cursor-hover" data-reveal data-delay={String(i)}>
            <div className="ta-stack-head">
              <span className="ta-dim">▸</span> {t(`skills.groups.${g.key}`)}/
            </div>
            <ul className="ta-stack-list">
              {g.items.map((s, j) => (
                <li key={s}>
                  <span className="ta-dim">{String(j + 1).padStart(2, '0')}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Github() {
  const {t} = useTranslation();
  const user = useGithubUser();
  const contrib = useContributions();
  const grid = useContribGraph(contrib);
  return (
    <section className="ta-section">
      <div className="ta-glass ta-gh" data-reveal>
        <div className="ta-gh-head">
          <div>
            <div className="ta-hcode"><span className="ta-dim">$</span> {t('github.code')}</div>
            <h3 className="ta-gh-title">
              github.com/<span className="ta-accent">D3strukt0r</span>
            </h3>
          </div>
          {user && (
            <div className="ta-gh-stats">
              <div><b>{user.public_repos}</b><span>{t('github.repos')}</span></div>
              <div><b>{user.followers}</b><span>{t('github.followers')}</span></div>
              {contrib && (
                <div><b>{contrib.total}</b><span>{t('github.contributions')}</span></div>
              )}
              <div><b>{user.created_at?.slice(0, 4)}</b><span>{t('github.joined')}</span></div>
            </div>
          )}
        </div>
        <div className="ta-contrib">
          {grid.map((week, wi) => (
            <div key={wi} className="ta-cc-col">
              {week.map((v, di) => (
                <div key={di} className={`ta-cc-cell tl${v}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="ta-gh-legend">
          <span>{t('github.weeks')}</span>
          <div className="ta-legend-cells">
            {[0, 1, 2, 3, 4].map((l) => <div key={l} className={`ta-cc-cell tl${l}`} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Projects() {
  const {t, i18n} = useTranslation();
  const repos = useGithubRepos();
  const de = i18n.resolvedLanguage === 'de';
  const list: Array<{name: string; desc: string; stars: number; lang: string | null; url: string}>
    = repos?.list ?? PROJECTS_FALLBACK.map((p) => ({
      name: p.name, desc: de ? p.descDe : p.descEn, stars: p.stars, lang: p.lang, url: p.url,
    }));

  return (
    <section id="work" className="ta-section">
      <Heading num={t('work.num')} code={t('work.code')} title={t('work.title')} />
      {!repos && (
        <div className="ta-loading" data-reveal>{`> ${t('github.fetching')}`}</div>
      )}
      <div className="ta-proj-grid">
        {list.slice(0, 9).map((r, i) => (
          <a
            key={r.name}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="ta-glass ta-proj cursor-hover"
            data-reveal
            data-delay={String(i % 3)}
          >
            <div className="ta-proj-idx">{String(i + 1).padStart(2, '0')}</div>
            <div className="ta-proj-body">
              <div className="ta-proj-name">
                <span className="ta-dim">~/</span>{r.name}
              </div>
              <p className="ta-proj-desc">{r.desc || t('work.no_desc')}</p>
              <div className="ta-proj-meta">
                <span className="ta-chip">{r.lang ?? 'misc'}</span>
                <span className="ta-dim">★ {r.stars}</span>
                <span className="ta-proj-arrow">↗</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function Experience() {
  const {t, i18n} = useTranslation();
  const de = i18n.resolvedLanguage === 'de';
  return (
    <section className="ta-section">
      <Heading num={t('career.num')} code={t('career.code')} title={t('career.title')} />
      <div className="ta-exp">
        {[...EXPERIENCE]
          .sort((a, b) => b.endKey.localeCompare(a.endKey))
          .slice(0, 3)
          .map((e, i) => {
            const dur = de ? e.durationDe : e.durationEn;
            const emp = de ? e.employmentTypeDe : e.employmentTypeEn;
            const loc = de ? e.locationDe : e.locationEn;
            const meta = [dur, emp, loc].filter(Boolean).join(' · ');
            return (
              <div key={i} className="ta-glass ta-exp-row cursor-hover" data-reveal data-delay={String(i % 4)}>
                <div className="ta-exp-timestamp">[{e.period}]</div>
                <div className="ta-exp-body">
                  <div className="ta-exp-company">
                    {e.company} <span className="ta-dim">/ {de ? e.roleDe : e.roleEn}</span>
                  </div>
                  {meta && <div className="ta-exp-dur">{meta}</div>}
                  {e.stack.length > 0 && (
                    <div className="ta-exp-stack">
                      {e.stack.map((s) => <span key={s} className="ta-chip sm">{s}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}

function Meta() {
  const {t, i18n} = useTranslation();
  const de = i18n.resolvedLanguage === 'de';
  return (
    <section id="meta" className="ta-section">
      <Heading num={t('meta_section.num')} code={t('meta_section.code')} title={t('meta_section.title')} />
      <div className="ta-meta-grid">
        <div className="ta-glass ta-meta-card">
          <div className="ta-card-head">{t('meta_section.languages')}</div>
          <div className="ta-lang-list">
            {LANGUAGES.map((l, i) => (
              <div key={i} className="ta-lang-row">
                <Flag code={l.flagCode} className="ta-lang-flag" />
                <span className="ta-lang-name">{de ? l.nameDe : l.nameEn}</span>
                <span className="ta-lang-level">{l.level}</span>
                <span className="ta-lang-bars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} className={n <= l.stars ? 'on' : ''} />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ta-glass ta-meta-card">
          <div className="ta-card-head">{t('meta_section.certificates')}</div>
          <div className="ta-cert-list">
            {CERTIFICATES.map((c) => (
              <div key={c.nameDe} className="ta-cert-row">
                <span className="ta-cert-year">{c.year}</span>
                <div>
                  <div className="ta-cert-name">{de ? c.nameDe : c.nameEn}</div>
                  <div className="ta-dim ta-cert-issuer">↳ {de ? c.issuerDe : c.issuerEn}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ta-glass ta-meta-card">
          <div className="ta-card-head">{t('meta_section.writing')}</div>
          {posts.slice(0, 3).map((p) => (
            <a key={p.slug} href={`/blog/${p.slug}`} className="ta-blog-entry cursor-hover">
              <div className="ta-blog-date">{p.date}</div>
              <div className="ta-blog-name">{p.title}</div>
            </a>
          ))}
          <div className="ta-writing-foot">
            <a href="/blog" className="ta-link cursor-hover">{t('meta_section.open_blog')}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const {t} = useTranslation();
  return (
    <section id="contact" className="ta-section">
      <div className="ta-glass ta-contact">
        <div className="ta-hcode" data-reveal>
          <span className="ta-dim">$</span> {t('contact.code')}
        </div>
        <h2 className="ta-h1" data-reveal data-delay="1">{t('contact.title')}</h2>
        <p className="ta-contact-sub" data-reveal data-delay="2">{t('contact.sub')}</p>
        <a href={`mailto:${SOCIALS.email}`} className="ta-email cursor-hover" data-reveal data-delay="3">
          <span className="ta-dim">→</span> {SOCIALS.email}
        </a>
        <div className="ta-contact-socials">
          <a href={SOCIALS.github} target="_blank" rel="noreferrer" className="ta-socbtn cursor-hover">{t('contact.github')}</a>
          <a href={SOCIALS.linkedin} target="_blank" rel="noreferrer" className="ta-socbtn cursor-hover">{t('contact.linkedin')}</a>
          <a href={SOCIALS.twitter} target="_blank" rel="noreferrer" className="ta-socbtn cursor-hover">{t('contact.twitter')}</a>
        </div>
      </div>
    </section>
  );
}
