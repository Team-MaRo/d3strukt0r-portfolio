import type {Route} from './+types/about';
import {useTranslation} from 'react-i18next';
import {steps} from '~/lib/content';

import {CERTIFICATES, LANGUAGES, QUALIFICATIONS, SOCIALS} from '~/lib/data';

export function meta(_: Route.MetaArgs) {
  return [{title: 'About · Manuele'}];
}

export default function About() {
  const {t, i18n} = useTranslation();
  const de = i18n.resolvedLanguage === 'de';

  return (
    <section className="ta-section">
      <div className="ta-page-head">
        <div className="ta-hnum" data-reveal>~/about</div>
        <div className="ta-hcode" data-reveal data-delay="1">
          <span className="ta-dim">$</span> {t('about_page.code')}
        </div>
        <h1 className="ta-h1" data-reveal data-delay="2">{t('about_page.title')}</h1>
      </div>

      <div className="ta-about-grid">
        <div className="ta-about-main ta-glass ta-content" data-reveal>
          <p className="ta-lead">{t('about_page.lead')}</p>
          <p>{t('about_page.body')}</p>
        </div>
        <div className="ta-about-side">
          <div className="ta-glass ta-profile-card" data-reveal>
            <img
              src="/img/profile-picture-2018.06.23.jpg"
              alt="Manuele"
              className="ta-profile-img"
              loading="eager"
              decoding="async"
            />
            <div className="ta-profile-caption">
              <span className="ta-dim">$</span> file ~/manuele.jpg
            </div>
          </div>
          <div className="ta-glass ta-card-mini" data-reveal data-delay="1">
            <div className="ta-card-head">~/identity.json</div>
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

      <div className="ta-heading" style={{marginTop: 64}}>
        <div className="ta-hnum" data-reveal>01</div>
        <div className="ta-hcode" data-reveal data-delay="1">
          <span className="ta-dim">$</span> {t('about_page.timeline_code')}
        </div>
        <h2 className="ta-h2" data-reveal data-delay="2">{t('about_page.timeline')}</h2>
      </div>

      <div className="ta-timeline">
        {steps.map((s, i) => {
          const d = s.date.slice(0, 7).split('-').reverse().join('/');
          const end = s.enddate ? s.enddate.slice(0, 7).split('-').reverse().join('/') : null;
          return (
            <div key={s.slug} className="ta-glass ta-exp-row cursor-hover" data-reveal data-delay={String(i % 4)}>
              <div className="ta-exp-timestamp">[{d}{end ? ` — ${end}` : ''}]</div>
              <div className="ta-exp-body">
                <div className="ta-exp-company">{s.title}</div>
                <div
                  className="ta-exp-dur ta-content"
                  style={{marginTop: 6}}
                  dangerouslySetInnerHTML={{__html: s.html}}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="ta-heading" style={{marginTop: 64}}>
        <div className="ta-hnum" data-reveal>02</div>
        <div className="ta-hcode" data-reveal data-delay="1">
          <span className="ta-dim">$</span> {t('about_page.qualifications_code')}
        </div>
        <h2 className="ta-h2" data-reveal data-delay="2">{t('about_page.qualifications')}</h2>
      </div>

      <div className="ta-glass ta-about-main" data-reveal style={{marginBottom: 18}}>
        <div className="ta-meta-row" style={{margin: 0, gap: 10}}>
          <span className="ta-chip"><span className="ta-dim">{t('about_page.legend.basic')}</span> · 1</span>
          <span className="ta-chip"><span className="ta-dim">{t('about_page.legend.standard')}</span> · 2</span>
          <span className="ta-chip"><span className="ta-dim">{t('about_page.legend.good')}</span> · 3</span>
          <span className="ta-chip"><span className="ta-dim">{t('about_page.legend.expert')}</span> · 4</span>
        </div>
      </div>

      <div className="ta-meta-grid">
        <div className="ta-glass ta-meta-card" data-reveal>
          <div className="ta-card-head">{t('about_page.languages_title')}</div>
          <div className="ta-lang-list">
            {LANGUAGES.map((l, i) => (
              <div key={i} className="ta-lang-row">
                <span className="ta-lang-flag">{l.flag}</span>
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
          <p className="ta-dim" style={{fontFamily: '\'JetBrains Mono\'', fontSize: 11, margin: '14px 0 0'}}>
            {t('about_page.certs_on_request')}
            <a href={`mailto:${SOCIALS.email}`} className="ta-link cursor-hover">{t('about_page.email_me')}</a>
          </p>
        </div>

        <div className="ta-glass ta-meta-card" data-reveal data-delay="1">
          <div className="ta-card-head">{t('about_page.certs_title')}</div>
          <div className="ta-cert-list">
            {CERTIFICATES.map((c) => (
              <div key={c.name} className="ta-cert-row">
                <span className="ta-cert-year">{c.year}</span>
                <div>
                  <div className="ta-cert-name">{c.name}</div>
                  <div className="ta-dim ta-cert-issuer">↳ {c.issuer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ta-glass ta-meta-card ta-side-skills" data-reveal data-delay="2">
          <div className="ta-card-head">{t('about_page.programs_title')}</div>
          {QUALIFICATIONS.programs.map((p) => (
            <div key={p.name} className="ta-side-skillrow">
              <span>{p.name}</span>
              <span className="ta-bar"><span style={{width: `${p.stars * 25}%`}} /></span>
            </div>
          ))}
        </div>
      </div>

      <div className="ta-heading" style={{marginTop: 40}}>
        <div className="ta-hcode" data-reveal>
          <span className="ta-dim">$</span> {t('about_page.stack_code')}
        </div>
        <h3 className="ta-h2" data-reveal data-delay="1" style={{fontSize: 'clamp(20px, 2.2vw, 26px)'}}>
          {t('about_page.tech_stack')}
        </h3>
      </div>
      <div className="ta-stack-grid">
        {(['languages', 'databases', 'os', 'vcs'] as const).map((cat, gi) => (
          <div key={cat} className="ta-glass ta-stack-card ta-side-skills" data-reveal data-delay={String(gi)}>
            <div className="ta-stack-head"><span className="ta-dim">▸</span> {cat}/</div>
            {QUALIFICATIONS.stack[cat].map((item) => (
              <div key={item.name} className="ta-side-skillrow">
                <span>{item.name}</span>
                <span className="ta-bar"><span style={{width: `${item.stars * 25}%`}} /></span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="ta-heading" style={{marginTop: 64}}>
        <div className="ta-hnum" data-reveal>03</div>
        <div className="ta-hcode" data-reveal data-delay="1">
          <span className="ta-dim">$</span> {t('about_page.elsewhere_code')}
        </div>
        <h2 className="ta-h2" data-reveal data-delay="2">{t('about_page.elsewhere')}</h2>
      </div>
      <p className="ta-dim" data-reveal style={{fontFamily: '\'JetBrains Mono\'', fontSize: 12, margin: '0 0 16px'}}>
        {t('about_page.github_link')}{' '}
        <a href={`${SOCIALS.github}?tab=repositories`} className="ta-link cursor-hover">GitHub profile</a> →
      </p>
      <div className="ta-contact-socials" data-reveal style={{justifyContent: 'flex-start'}}>
        <a href={SOCIALS.linkedin} target="_blank" rel="noreferrer" className="ta-socbtn cursor-hover">LinkedIn</a>
        <a href={SOCIALS.github} target="_blank" rel="noreferrer" className="ta-socbtn cursor-hover">GitHub</a>
        <a href={SOCIALS.xing} target="_blank" rel="noreferrer" className="ta-socbtn cursor-hover">Xing</a>
      </div>
    </section>
  );
}
