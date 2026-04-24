import type {Route} from './+types/cv';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';
import profilePicture from '~/assets/profile-picture-2018.06.23.jpg';
import {Flag} from '~/components/Flag';
import {useInternalLinkNav} from '~/hooks/useInternalLinkNav';
import {CERTIFICATES, EXPERIENCE, LANGUAGES} from '~/lib/linkedin';
import {QUALIFICATIONS, SOCIALS} from '~/lib/site';

export function meta(_: Route.MetaArgs) {
  return [{title: 'CV · Manuele'}];
}

export default function CV() {
  const {t, i18n} = useTranslation();
  const de = i18n.resolvedLanguage === 'de';
  const timelineRef = useRef<HTMLDivElement>(null);
  useInternalLinkNav(timelineRef);

  return (
    <section className="ta-section">
      <div className="ta-page-head">
        <div className="ta-hnum" data-reveal>~/cv</div>
        <div className="ta-hcode" data-reveal data-delay="1">
          <span className="ta-dim">$</span> {t('cv_page.code')}
        </div>
        <h1 className="ta-h1" data-reveal data-delay="2">{t('cv_page.title')}</h1>
      </div>

      <div className="ta-about-grid">
        <div className="ta-about-main ta-glass ta-content" data-reveal>
          <p className="ta-lead">{t('cv_page.lead')}</p>
          <p>{t('cv_page.body')}</p>
        </div>
        <div className="ta-about-side">
          <div className="ta-glass ta-profile-card" data-reveal>
            <img
              src={profilePicture}
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
          <span className="ta-dim">$</span> {t('cv_page.timeline_code')}
        </div>
        <h2 className="ta-h2" data-reveal data-delay="2">{t('cv_page.timeline')}</h2>
      </div>

      <div ref={timelineRef} className="ta-timeline">
        {EXPERIENCE.map((e, i) => {
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

      <div className="ta-heading" style={{marginTop: 64}}>
        <div className="ta-hnum" data-reveal>02</div>
        <div className="ta-hcode" data-reveal data-delay="1">
          <span className="ta-dim">$</span> {t('cv_page.qualifications_code')}
        </div>
        <h2 className="ta-h2" data-reveal data-delay="2">{t('cv_page.qualifications')}</h2>
      </div>

      <div className="ta-glass ta-about-main" data-reveal style={{marginBottom: 18}}>
        <div className="ta-meta-row" style={{margin: 0, gap: 10}}>
          <span className="ta-chip"><span className="ta-dim">{t('cv_page.legend.basic')}</span> · 1</span>
          <span className="ta-chip"><span className="ta-dim">{t('cv_page.legend.standard')}</span> · 2</span>
          <span className="ta-chip"><span className="ta-dim">{t('cv_page.legend.good')}</span> · 3</span>
          <span className="ta-chip"><span className="ta-dim">{t('cv_page.legend.expert')}</span> · 4</span>
        </div>
      </div>

      <div className="ta-meta-grid">
        <div className="ta-glass ta-meta-card" data-reveal>
          <div className="ta-card-head">{t('cv_page.languages_title')}</div>
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
          <p className="ta-dim" style={{fontFamily: '\'JetBrains Mono\'', fontSize: 11, margin: '14px 0 0'}}>
            {t('cv_page.certs_on_request')}
            <a href={`mailto:${SOCIALS.email}`} className="ta-link cursor-hover">{t('cv_page.email_me')}</a>
          </p>
        </div>

        <div className="ta-glass ta-meta-card" data-reveal data-delay="1">
          <div className="ta-card-head">{t('cv_page.certs_title')}</div>
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

        <div className="ta-glass ta-meta-card ta-side-skills" data-reveal data-delay="2">
          <div className="ta-card-head">{t('cv_page.programs_title')}</div>
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
          <span className="ta-dim">$</span> {t('cv_page.stack_code')}
        </div>
        <h3 className="ta-h2" data-reveal data-delay="1" style={{fontSize: 'clamp(20px, 2.2vw, 26px)'}}>
          {t('cv_page.tech_stack')}
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
          <span className="ta-dim">$</span> {t('cv_page.elsewhere_code')}
        </div>
        <h2 className="ta-h2" data-reveal data-delay="2">{t('cv_page.elsewhere')}</h2>
      </div>
      <p className="ta-dim" data-reveal style={{fontFamily: '\'JetBrains Mono\'', fontSize: 12, margin: '0 0 16px'}}>
        {t('cv_page.github_link')}{' '}
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
