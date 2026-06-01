import type {Route} from './+types/not-found';
import {useTranslation} from 'react-i18next';
import {Link, useLocation} from 'react-router';
import {Card} from '~/components/ui/card';

export function meta(_: Route.MetaArgs) {
  return [{title: '404 · Manuele'}];
}

export default function NotFound() {
  const {t} = useTranslation();
  const loc = useLocation();
  return (
    <section className="w-full pt-32 pb-20 md:pt-40">
      <div className="container">
        <Card glass className="px-6 py-20 text-center">
          <pre className="mx-auto mb-6 inline-block max-w-full overflow-hidden bg-[linear-gradient(120deg,var(--primary),var(--aurora-2),var(--aurora-3))] bg-clip-text font-mono text-xs leading-tight whitespace-pre text-transparent">
            {`  _  _    ___  _  _
 | || |  / _ \\| || |
 | || |_| | | | || |_
 |__   _| |_| |__   _|
    |_|  \\___/   |_|`}
          </pre>
          <div className="font-mono text-sm text-muted-foreground">
            <span className="opacity-50">$</span> find . -name "{loc.pathname}" ·{' '}
            <span className="text-primary">not found</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-medium tracking-tight md:text-5xl">{t('fourohfour.title')}</h1>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{t('fourohfour.sub')}</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 font-mono text-primary cursor-hover hover:underline">
            <span aria-hidden>→</span> {t('fourohfour.home')}
          </Link>
        </Card>
      </div>
    </section>
  );
}
