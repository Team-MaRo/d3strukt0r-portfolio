import type {ReactNode} from 'react';
import type {Route} from './+types/cv';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {CertLink} from '~/components/CertLink';
import {Flag} from '~/components/Flag';
import {Reveal} from '~/components/Reveal';
import {Sealed} from '~/components/Sealed';
import {SealedImage} from '~/components/SealedImage';
import {Badge} from '~/components/ui/badge';
import {Card} from '~/components/ui/card';
import {useInternalLinkNav} from '~/hooks/useInternalLinkNav';
import {CERTIFICATES, EXPERIENCE, LANGUAGES} from '~/lib/linkedin';
import {openLockModal} from '~/lib/seal-modal';
import {QUALIFICATIONS, SOCIALS} from '~/lib/site';
import {cn} from '~/lib/utils';

export function meta(_: Route.MetaArgs) {
  return [{title: 'CV · Manuele'}];
}

// "Elsewhere" outbound links. `key` indexes into `SOCIALS` for the href.
const ELSEWHERE_LINKS = [
  {key: 'linkedin', label: 'LinkedIn'},
  {key: 'github', label: 'GitHub'},
  {key: 'xing', label: 'Xing'},
] as const satisfies ReadonlyArray<{key: keyof typeof SOCIALS; label: string}>;

function Heading({num, code, title, level = 'h2'}: {num?: string; code: string; title: string; level?: 'h2' | 'h3'}) {
  const Tag = level;
  return (
    <div className="mb-8">
      {num != null && num.length > 0 && <Reveal><div className="mb-1.5 font-mono text-xs text-primary">{num}</div></Reveal>}
      <Reveal delay={0.07}>
        <div className="mb-3 font-mono text-sm text-muted-foreground">
          <span className="opacity-50">$</span> {code}
        </div>
      </Reveal>
      <Reveal delay={0.14}>
        <Tag className={cn('font-display font-medium tracking-tight', level === 'h2' ? 'text-3xl md:text-4xl' : 'text-2xl')}>{title}</Tag>
      </Reveal>
    </div>
  );
}

function Bar({pct}: {pct: number}) {
  return (
    <span className="ta-bar">
      <span style={{'--ta-bar-w': `${pct}%`} as React.CSSProperties} />
    </span>
  );
}

function SkillRow({name, children}: {name: string; children: ReactNode}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 font-mono text-sm">
      <span>{name}</span>
      {children}
    </div>
  );
}

export default function CV() {
  const {t, i18n} = useTranslation();
  const de = i18n.resolvedLanguage === 'de';
  const timelineRef = useRef<HTMLDivElement>(null);
  useInternalLinkNav(timelineRef);

  return (
    <section className="w-full pt-32 pb-20 md:pt-40">
      <div className="container">
        <div className="mb-12">
          <Reveal><div className="mb-1.5 font-mono text-xs text-primary">~/cv</div></Reveal>
          <Reveal delay={0.07}>
            <div className="mb-3 font-mono text-sm text-muted-foreground">
              <span className="opacity-50">$</span> {t('cv_page.code')}
            </div>
          </Reveal>
          <Reveal delay={0.14}>
            <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">{t('cv_page.title')}</h1>
          </Reveal>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <Reveal>
            <Card glass className="ta-content p-8">
              <p className="font-display text-xl leading-snug text-foreground">{t('cv_page.lead')}</p>
              <p>{t('cv_page.body')}</p>
            </Card>
          </Reveal>
          <div className="flex flex-col gap-6">
            <Reveal>
              <Card glass className="overflow-hidden p-4">
                <SealedImage
                  id="profile"
                  alt="Manuele"
                  className="w-full rounded-lg"
                  onLockedClick={openLockModal}
                />
                <div className="mt-3 font-mono text-xs text-muted-foreground">
                  <span className="opacity-50">$</span> file ~/manuele.jpg
                </div>
              </Card>
            </Reveal>
            <Reveal delay={0.1}>
              <Card glass className="p-6">
                <div className="mb-3 font-mono text-xs text-primary">~/identity.json</div>
                <pre className="font-mono text-sm leading-7 text-muted-foreground">{`{
  "from":   "Switzerland",
  "edu":    "BSc Business IT",
  "speaks": ${LANGUAGES.length},
  "ships":  true,
  "anime":  true
}`}
                </pre>
              </Card>
            </Reveal>
          </div>
        </div>

        <div className="mt-16">
          <Heading num="01" code={t('cv_page.timeline_code')} title={t('cv_page.timeline')} />
        </div>

        <div ref={timelineRef} className="flex flex-col gap-3">
          {EXPERIENCE.map((e, i) => {
            const dur = de ? e.durationDe : e.durationEn;
            const emp = de ? e.employmentTypeDe : e.employmentTypeEn;
            const loc = de ? e.locationDe : e.locationEn;
            const role = de ? e.roleDe : e.roleEn;
            return (
              <Reveal key={`${e.company}-${e.sortKey}-${e.endKey}`} delay={(i % 4) * 0.06}>
                <Card glass hover className="grid items-center gap-5 p-6 sm:grid-cols-[10rem_1fr]">
                  <div className="font-mono text-sm text-primary">[{e.period}]</div>
                  <div>
                    <div className="font-display text-lg font-medium">
                      <Sealed value={e.company} onLockedClick={openLockModal} />
                      {' '}
                      <span className="text-muted-foreground">/ {role}</span>
                    </div>
                    <div className="mt-1 mb-3 font-mono text-xs text-muted-foreground">
                      {[dur, emp].filter(Boolean).join(' · ')}
                      {(dur || emp) && loc ? ' · ' : ''}
                      <Sealed value={loc} onLockedClick={openLockModal} />
                    </div>
                    {e.stack.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {e.stack.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                      </div>
                    )}
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-16">
          <Heading num="02" code={t('cv_page.qualifications_code')} title={t('cv_page.qualifications')} />
        </div>

        <Reveal>
          <Card glass className="mb-5 p-5">
            <div className="flex flex-wrap gap-2.5">
              <Badge variant="mono"><span className="text-muted-foreground">{t('cv_page.legend.basic')}</span> · 1</Badge>
              <Badge variant="mono"><span className="text-muted-foreground">{t('cv_page.legend.standard')}</span> · 2</Badge>
              <Badge variant="mono"><span className="text-muted-foreground">{t('cv_page.legend.good')}</span> · 3</Badge>
              <Badge variant="mono"><span className="text-muted-foreground">{t('cv_page.legend.expert')}</span> · 4</Badge>
            </div>
          </Card>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-3">
          <Reveal>
            <Card glass className="h-full p-6">
              <div className="mb-4 font-mono text-xs text-primary">{t('cv_page.languages_title')}</div>
              <div className="space-y-3">
                {LANGUAGES.map((l) => (
                  <div key={l.nameDe} className="flex items-center gap-3">
                    <Flag code={l.flagCode} className="ta-flag shrink-0" />
                    <span className="font-mono text-sm">{de ? l.nameDe : l.nameEn}</span>
                    <span className="ml-auto font-mono text-2xs text-muted-foreground">{l.level}</span>
                    <span className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={cn('h-3 w-1 rounded-sm', n <= l.stars ? 'bg-primary' : 'bg-border')} />
                      ))}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 font-mono text-xs text-muted-foreground">
                {t('cv_page.certs_on_request')}
                <a href={`mailto:${SOCIALS.email}`} className="text-primary cursor-hover hover:underline">{t('cv_page.email_me')}</a>
              </p>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <Card glass className="h-full p-6">
              <div className="mb-4 font-mono text-xs text-primary">{t('cv_page.certs_title')}</div>
              <div className="space-y-3">
                {CERTIFICATES.map((c) => (
                  <div key={c.nameDe} className="grid grid-cols-[2.75rem_1fr] gap-3 border-b border-dashed border-border pb-3 last:border-0 last:pb-0">
                    <span className="font-mono text-sm text-primary">{c.year}</span>
                    <div>
                      <div className="font-display text-sm leading-snug font-medium">
                        <CertLink url={c.url}>{de ? c.nameDe : c.nameEn}</CertLink>
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">↳ {de ? c.issuerDe : c.issuerEn}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.16}>
            <Card glass className="h-full p-6">
              <div className="mb-4 font-mono text-xs text-primary">{t('cv_page.programs_title')}</div>
              <div className="space-y-1">
                {QUALIFICATIONS.programs.map((p) => (
                  <SkillRow key={p.name} name={p.name}><Bar pct={p.stars * 25} /></SkillRow>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>

        <div className="mt-16">
          <Heading code={t('cv_page.stack_code')} title={t('cv_page.tech_stack')} level="h3" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(['languages', 'databases', 'os', 'vcs'] as const).map((cat, gi) => (
            <Reveal key={cat} delay={gi * 0.07}>
              <Card glass className="h-full p-5">
                <div className="mb-4 flex items-center gap-2 font-mono text-sm text-primary">
                  <span className="text-muted-foreground">▸</span> {cat}/
                </div>
                <div className="space-y-1">
                  {QUALIFICATIONS.stack[cat].map((item) => (
                    <SkillRow key={item.name} name={item.name}><Bar pct={item.stars * 25} /></SkillRow>
                  ))}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="mt-16">
          <Heading num="03" code={t('cv_page.elsewhere_code')} title={t('cv_page.elsewhere')} />
        </div>
        <Reveal>
          <p className="mb-4 font-mono text-xs text-muted-foreground">
            {t('cv_page.github_link')}{' '}
            <a href={`${SOCIALS.github}?tab=repositories`} className="text-primary cursor-hover hover:underline">GitHub profile</a> →
          </p>
        </Reveal>
        <Reveal>
          <div className="flex flex-wrap gap-2">
            {ELSEWHERE_LINKS.map((l) => (
              <a
                key={l.key}
                href={SOCIALS[l.key]}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-input bg-background/40 px-3 py-1.5 font-mono text-sm text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground cursor-hover"
              >
                {l.label}
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
