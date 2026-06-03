import type {Route} from './+types/blog';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router';
import {Reveal} from '~/components/Reveal';
import {posts, postUrl} from '~/lib/content';

export function meta(_: Route.MetaArgs) {
  return [{title: 'Blog · Manuele'}];
}

export default function Blog() {
  const {t} = useTranslation();
  const grouped = new Map<string, typeof posts>();
  for (const p of posts) {
    const year = p.date.slice(0, 4) || 'unknown';
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year)!.push(p);
  }
  const years = Array.from(grouped.keys()).sort().reverse();

  return (
    <section className="w-full pt-32 pb-20 md:pt-40">
      <div className="container">
        <div className="mb-12">
          <Reveal><div className="mb-1.5 font-mono text-xs text-primary">~/blog</div></Reveal>
          <Reveal delay={0.07}>
            <div className="mb-3 font-mono text-sm text-muted-foreground">
              <span className="opacity-50">$</span> {t('blog_page.code')}
            </div>
          </Reveal>
          <Reveal delay={0.14}>
            <h1 className="font-display text-4xl font-medium tracking-tight md:text-5xl">{t('blog_page.title')}</h1>
          </Reveal>
        </div>

        {years.map((y) => (
          <div key={y}>
            <Reveal>
              <h2 className="mt-8 mb-4 font-mono text-base text-primary">
                <span className="text-muted-foreground">▸</span> {y}/
              </h2>
            </Reveal>
            <div className="flex flex-col gap-2.5">
              {grouped.get(y)!.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 4) * 0.06}>
                  <Link
                    to={postUrl(p)}
                    className="block rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 cursor-hover"
                  >
                    <div className="text-xs text-primary">{p.date}</div>
                    <div className="mt-1">{p.title}</div>
                    {p.excerpt && <div className="mt-1 text-muted-foreground">↳ {p.excerpt}</div>}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
