import type {ReactNode} from 'react';
import type {Route} from './+types/home';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router';
import {Flag} from '~/components/Flag';
import {Reveal} from '~/components/Reveal';
import {Sealed} from '~/components/Sealed';
import {Avatar, AvatarFallback, AvatarImage} from '~/components/ui/avatar';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {Card} from '~/components/ui/card';
import {Separator} from '~/components/ui/separator';
import {useContribGraph, useContributions, useGithubRepos, useGithubUser} from '~/hooks/useGithub';
import {posts, postUrl} from '~/lib/content';
import {CERTIFICATES, EXPERIENCE, LANGUAGES} from '~/lib/linkedin';
import {openLockModal} from '~/lib/seal-modal';
import {PROJECTS_FALLBACK, SKILL_GROUPS, SOCIALS, STATS} from '~/lib/site';
import {cn} from '~/lib/utils';

export function meta(_: Route.MetaArgs) {
  return [{title: 'Manuele · Full-Stack Web Developer'}];
}

const ASCII_NAME = String.raw`  __  __                        _
 |  \/  | __ _ _ __  _   _  ___| | ___
 | |\/| |/ _\`| '_ \| | | |/ _ \ |/ _ \
 | |  | | (_| | | | | |_| |  __/ |  __/
 |_|  |_|\__,_|_| |_|\__,_|\___|_|\___|`;

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

// Full-bleed section + the scrollbar-aware snapping container.
function Section({id, className, children}: {id?: string; className?: string; children: ReactNode}) {
  return (
    <section id={id} className={cn('w-full', className)}>
      <div className="container">{children}</div>
    </section>
  );
}

function SectionLabel({num, code, children}: {num: string; code: string; children: ReactNode}) {
  return (
    <div className="mb-10">
      <Reveal><div className="mb-1.5 font-mono text-xs text-primary">{num}</div></Reveal>
      <Reveal delay={0.07}>
        <div className="mb-3 font-mono text-sm text-muted-foreground">
          <span className="opacity-50">$</span> {code}
        </div>
      </Reveal>
      <Reveal delay={0.14}>
        <h2 className="font-display text-3xl font-medium tracking-tight md:text-4xl">{children}</h2>
      </Reveal>
    </div>
  );
}

function Hero() {
  const {t} = useTranslation();
  const user = useGithubUser();
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
    }, 65);
    return () => window.clearInterval(id);
  }, [full]);

  const date = new Date().toISOString().slice(0, 10);

  return (
    <Section id="top" className="pt-32 pb-16 md:pt-40 md:pb-20">
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div>
          <Reveal>
            <Badge variant="mono" className="mb-6 gap-2 py-1">
              <span className="size-1.5 animate-ta-pulse-dot rounded-full bg-primary" />
              {t('location')}
            </Badge>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="text-balance font-display text-4xl leading-[1.05] font-medium tracking-tight md:text-6xl">
              {t('hero.title')}
            </h1>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">{t('hero.sub')}</p>
          </Reveal>
          <Reveal delay={0.22}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gradient" size="lg" className="font-mono">
                <a href="#work">
                  {t('hero.cta_work')} <span aria-hidden>→</span>
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-mono">
                <a href="#contact">{t('hero.cta_contact')}</a>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-xs text-muted-foreground">
              <span><span className="text-primary">●</span> {t('hero.online')}</span>
              {user && <span><b className="text-foreground">{user.public_repos}</b> {t('github.repos')}</span>}
              {user && <span><b className="text-foreground">{user.followers}</b> {t('github.followers')}</span>}
              <span><b className="text-foreground">{LANGUAGES.length}</b> {t('stats.languages')}</span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.18}>
          <Card glass className="overflow-hidden p-0">
            <div className="flex items-center gap-1.5 border-b border-border/70 bg-background/20 px-4 py-3">
              <span className="size-3 rounded-full bg-[var(--mac-red)]" />
              <span className="size-3 rounded-full bg-[var(--mac-yellow)]" />
              <span className="size-3 rounded-full bg-[var(--mac-green)]" />
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">manuele@portfolio — ~</span>
            </div>
            <div className="p-5 font-mono text-[13px]">
              <div className="text-foreground">
                <span className="text-primary">→</span> {typed}
                <span className="animate-ta-blink text-primary">▌</span>
              </div>
              <pre className="mt-3 overflow-hidden bg-[linear-gradient(120deg,var(--primary),var(--aurora-2),var(--aurora-3))] bg-clip-text font-mono text-[10px] leading-tight whitespace-pre text-transparent select-none">
                {ASCII_NAME}
              </pre>
              <ul className="mt-4 space-y-1 text-muted-foreground">
                {nowItems.map((item, i) => (
                  // eslint-disable-next-line react/no-array-index-key -- nowItems are translation strings keyed by stable position
                  <li key={i}>
                    <span className="text-primary/80">{['✓', '✓', '→', '◎'][i] ?? '·'}</span> {item}
                  </li>
                ))}
                <li className="text-primary">● {t('hero.online')} · {date}</li>
              </ul>
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

function Stats() {
  const {t} = useTranslation();
  return (
    <Section className="py-4">
      <Reveal>
        <Card glass className="grid grid-cols-2 gap-2 p-2 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.labelKey} className="rounded-lg px-4 py-5 text-center transition-colors duration-200 hover:bg-accent/40">
              <div className="bg-[linear-gradient(135deg,var(--primary),var(--aurora-2))] bg-clip-text font-display text-3xl font-medium tracking-tight text-transparent md:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">{t(s.labelKey)}</div>
            </div>
          ))}
        </Card>
      </Reveal>
    </Section>
  );
}

function About() {
  const {t} = useTranslation();
  const paragraphs = t('about.paragraphs', {returnObjects: true}) as string[];
  const chips = ['Business + IT', 'Symfony', 'React', 'Scrum', 'SAP', 'Anime'];
  return (
    <Section id="about" className="py-20 md:py-28">
      <SectionLabel num={t('about.num')} code={t('about.code')}>{t('about.title')}</SectionLabel>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Card glass className="p-8">
          {paragraphs.map((p, i) => (
            // eslint-disable-next-line react/no-array-index-key -- about paragraphs are translation strings keyed by stable position
            <Reveal key={i} delay={i * 0.08}>
              <p className={cn(
                'leading-relaxed text-muted-foreground',
                i === 0 ? 'mb-4 font-display text-xl leading-snug font-normal text-foreground' : 'mb-4 last:mb-0',
              )}
              >
                {p}
              </p>
            </Reveal>
          ))}
        </Card>
        <Reveal delay={0.12}>
          <Card glass hover className="p-6">
            <div className="mb-3 font-mono text-xs text-primary">{t('about.identity_title')}</div>
            <pre className="font-mono text-[13px] leading-7 text-muted-foreground">{`{
  "from":   "Switzerland",
  "edu":    "BSc Business IT",
  "speaks": ${LANGUAGES.length},
  "ships":  true,
  "anime":  true
}`}
            </pre>
            <Separator className="my-5" />
            <div className="flex flex-wrap gap-2">
              {chips.map((x) => <Badge key={x} variant="secondary">{x}</Badge>)}
            </div>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

function Skills() {
  const {t} = useTranslation();
  return (
    <Section id="stack" className="py-20 md:py-28">
      <SectionLabel num={t('skills.num')} code={t('skills.code')}>{t('skills.title')}</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SKILL_GROUPS.map((g, gi) => (
          <Reveal key={g.key} delay={gi * 0.07}>
            <Card glass hover className="h-full p-5">
              <div className="mb-4 flex items-center gap-2 font-mono text-sm text-primary">
                <span className="text-muted-foreground">▸</span> {t(`skills.groups.${g.key}`)}/
              </div>
              <ul className="space-y-1.5 font-mono text-[13px]">
                {g.items.map((item, i) => (
                  <li key={item} className="flex items-center gap-3 text-foreground/90 transition-colors duration-200 hover:text-foreground">
                    <span className="text-[11px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Github() {
  const {t} = useTranslation();
  const user = useGithubUser();
  const contrib = useContributions();
  const grid = useContribGraph(contrib);
  const lvl = ['bg-muted/60', 'bg-primary/20', 'bg-primary/45', 'bg-primary/70', 'bg-primary'];
  return (
    <Section className="py-8">
      <Reveal>
        <Card glass className="p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="size-14 border border-border/70">
                <AvatarImage src={user?.avatar} alt="" />
                <AvatarFallback className="font-display">M</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-mono text-sm text-muted-foreground">
                  <span className="opacity-50">$</span> {t('github.code')}
                </div>
                <h3 className="font-display text-2xl font-medium tracking-tight">
                  github.com/<span className="text-primary">D3strukt0r</span>
                </h3>
              </div>
            </div>
            {user && (
              <div className="flex gap-7">
                <div className="text-center">
                  <div className="font-display text-2xl font-medium">{user.public_repos}</div>
                  <div className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">{t('github.repos')}</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-medium">{user.followers}</div>
                  <div className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">{t('github.followers')}</div>
                </div>
                {contrib && (
                  <div className="text-center">
                    <div className="font-display text-2xl font-medium">{contrib.total}</div>
                    <div className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">{t('github.contributions')}</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="font-display text-2xl font-medium">{user.created_at?.slice(0, 4)}</div>
                  <div className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">{t('github.joined')}</div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-[3px] overflow-x-auto pb-2">
            {grid.map((week, wi) => (
              // eslint-disable-next-line react/no-array-index-key -- contribution grid is a fixed-size weeks/days matrix; index is the position
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((v, di) => (
                  // eslint-disable-next-line react/no-array-index-key -- contribution grid is a fixed-size weeks/days matrix; index is the position
                  <div key={di} className={cn('size-3 rounded-[3px] transition-colors duration-200', lvl[v])} />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span>{t('github.weeks')}</span>
            {lvl.map((c, i) => (
              // eslint-disable-next-line react/no-array-index-key -- legend cells are a fixed 5-level scale keyed by position
              <div key={i} className={cn('size-2.5 rounded-[3px]', c)} />
            ))}
          </div>
        </Card>
      </Reveal>
    </Section>
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
    <Section id="work" className="py-20 md:py-28">
      <SectionLabel num={t('work.num')} code={t('work.code')}>{t('work.title')}</SectionLabel>
      {!repos && (
        <Reveal>
          <div className="mb-5 font-mono text-xs text-muted-foreground">{`> ${t('github.fetching')}`}</div>
        </Reveal>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.slice(0, 9).map((r, i) => (
          <Reveal key={r.name} delay={(i % 3) * 0.07}>
            <a href={r.url} target="_blank" rel="noreferrer" className="group block h-full cursor-hover">
              <Card glass hover className="flex h-full flex-col p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-primary">{String(i + 1).padStart(2, '0')}</span>
                  <span className="truncate font-mono text-sm font-medium">
                    <span className="text-muted-foreground">~/</span>{r.name}
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-muted-foreground">★ {r.stars}</span>
                </div>
                <p className="mb-4 line-clamp-2 min-h-10 font-mono text-[13px] leading-relaxed text-muted-foreground">
                  {r.desc || t('work.no_desc')}
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <Badge variant="mono">{r.lang ?? 'misc'}</Badge>
                  <span className="ml-auto text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" aria-hidden>↗</span>
                </div>
              </Card>
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function Experience() {
  const {t, i18n} = useTranslation();
  const de = i18n.resolvedLanguage === 'de';
  return (
    <Section className="py-20 md:py-28">
      <SectionLabel num={t('career.num')} code={t('career.code')}>{t('career.title')}</SectionLabel>
      <div className="flex flex-col gap-3">
        {[...EXPERIENCE]
          .sort((a, b) => b.endKey.localeCompare(a.endKey))
          .slice(0, 3)
          .map((e, i) => {
            const dur = de ? e.durationDe : e.durationEn;
            const emp = de ? e.employmentTypeDe : e.employmentTypeEn;
            const loc = de ? e.locationDe : e.locationEn;
            const role = de ? e.roleDe : e.roleEn;
            return (
              <Reveal key={`${e.company}-${e.sortKey}-${e.endKey}`} delay={i * 0.08}>
                <Card glass hover className="grid items-center gap-5 p-6 sm:grid-cols-[160px_1fr]">
                  <div className="font-mono text-sm text-primary">[{e.period}]</div>
                  <div>
                    <div className="font-display text-lg font-medium">
                      <Sealed value={e.company} onLockedClick={openLockModal} />
                      {' '}
                      <span className="text-muted-foreground">/ {role}</span>
                    </div>
                    <div className="mt-1 mb-3 font-mono text-[11px] text-muted-foreground">
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
    </Section>
  );
}

function Meta() {
  const {t, i18n} = useTranslation();
  const de = i18n.resolvedLanguage === 'de';
  return (
    <Section id="meta" className="py-20 md:py-28">
      <SectionLabel num={t('meta_section.num')} code={t('meta_section.code')}>{t('meta_section.title')}</SectionLabel>
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal>
          <Card glass className="h-full p-6">
            <div className="mb-4 font-mono text-xs text-primary">{t('meta_section.languages')}</div>
            <div className="space-y-3">
              {LANGUAGES.map((l) => (
                <div key={l.nameDe} className="flex items-center gap-3">
                  <Flag code={l.flagCode} className="ta-flag shrink-0" />
                  <span className="font-mono text-sm">{de ? l.nameDe : l.nameEn}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">{l.level}</span>
                  <span className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={cn('h-3 w-1 rounded-sm', n <= l.stars ? 'bg-primary' : 'bg-border')} />
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card glass className="h-full p-6">
            <div className="mb-4 font-mono text-xs text-primary">{t('meta_section.certificates')}</div>
            <div className="space-y-3">
              {CERTIFICATES.map((c) => (
                <div key={c.nameDe} className="grid grid-cols-[44px_1fr] gap-3 border-b border-dashed border-border pb-3 last:border-0 last:pb-0">
                  <span className="font-mono text-sm text-primary">{c.year}</span>
                  <div>
                    <div className="font-display text-sm leading-snug font-medium">{de ? c.nameDe : c.nameEn}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">↳ {de ? c.issuerDe : c.issuerEn}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>
        <Reveal delay={0.16}>
          <Card glass className="flex h-full flex-col p-6">
            <div className="mb-4 font-mono text-xs text-primary">{t('meta_section.writing')}</div>
            <div className="space-y-3">
              {posts.slice(0, 3).map((p) => (
                <Link
                  key={p.slug}
                  to={postUrl(p)}
                  className="block rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 cursor-hover"
                >
                  <div className="text-[11px] text-primary">{p.date}</div>
                  <div className="mt-1 truncate">{p.title}</div>
                  {p.excerpt && <div className="mt-1 line-clamp-1 text-muted-foreground">↳ {p.excerpt}</div>}
                </Link>
              ))}
            </div>
            <Button asChild variant="ghost" size="sm" className="mt-auto justify-start px-2 pt-4 font-mono text-primary">
              <Link to="/blog">{t('meta_section.open_blog')}</Link>
            </Button>
          </Card>
        </Reveal>
      </div>
    </Section>
  );
}

// Outbound social buttons in the Contact section. `key` doubles as the
// `SOCIALS` href field and the `contact.<key>` i18n label key.
const CONTACT_SOCIALS = [
  {key: 'github'},
  {key: 'linkedin'},
  {key: 'twitter'},
] as const satisfies ReadonlyArray<{key: keyof typeof SOCIALS}>;

function Contact() {
  const {t} = useTranslation();
  return (
    <Section id="contact" className="py-20 md:py-28">
      <Reveal>
        <Card glass className="p-10 text-center md:p-16">
          <div className="font-mono text-sm text-muted-foreground"><span className="opacity-50">$</span> {t('contact.code')}</div>
          <h2 className="mx-auto mt-4 max-w-2xl text-balance font-display text-4xl font-medium tracking-tight md:text-5xl">
            {t('contact.title')}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{t('contact.sub')}</p>
          <div className="mt-8 flex flex-col items-center gap-5">
            <Button asChild variant="gradient" size="lg" className="font-mono">
              <a href={`mailto:${SOCIALS.email}`}>
                <span aria-hidden className="opacity-70">→</span> {SOCIALS.email}
              </a>
            </Button>
            <div className="flex flex-wrap justify-center gap-2">
              {CONTACT_SOCIALS.map((s) => (
                <Button key={s.key} asChild variant="outline" size="sm">
                  <a href={SOCIALS[s.key]} target="_blank" rel="noreferrer">{t(`contact.${s.key}`)}</a>
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </Reveal>
    </Section>
  );
}
