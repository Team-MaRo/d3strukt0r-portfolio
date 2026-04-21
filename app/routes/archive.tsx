import type {Route} from './+types/archive';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router';

import {posts} from '~/lib/content';

export function meta(_: Route.MetaArgs) {
  return [{title: 'Archive · Manuele'}];
}

export default function Archive() {
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
    <section className="ta-section">
      <div className="ta-page-head">
        <div className="ta-hnum" data-reveal>~/blog</div>
        <div className="ta-hcode" data-reveal data-delay="1"><span className="ta-dim">$</span> {t('archive.code')}</div>
        <h1 className="ta-h1" data-reveal data-delay="2">{t('archive.title')}</h1>
      </div>

      {years.map((y) => (
        <div key={y}>
          <h2
            className="ta-h2"
            style={{margin: '32px 0 16px', fontFamily: '\'JetBrains Mono\'', fontSize: 16, color: 'var(--accent)'}}
            data-reveal
          >
            <span className="ta-dim">▸</span> {y}/
          </h2>
          <div className="ta-archive-list">
            {grouped.get(y)!.map((p) => (
              <Link key={p.slug} to={`/blog/${p.slug}`} className="ta-blog-entry cursor-hover" data-reveal>
                <div className="ta-blog-date">{p.date}</div>
                <div className="ta-blog-name">{p.title}</div>
                {p.excerpt && (
                  <div className="ta-dim" style={{marginTop: 4, fontSize: 12}}>↳ {p.excerpt}</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
