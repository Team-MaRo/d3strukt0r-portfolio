import type {Route} from './+types/not-found';
import {useTranslation} from 'react-i18next';
import {Link, useLocation} from 'react-router';

export function meta(_: Route.MetaArgs) {
  return [{title: '404 · Manuele'}];
}

export default function NotFound() {
  const {t} = useTranslation();
  const loc = useLocation();
  return (
    <section className="ta-section">
      <div className="ta-glass ta-404">
        <pre>{`  _  _    ___  _  _
 | || |  / _ \\| || |
 | || |_| | | | || |_
 |__   _| |_| |__   _|
    |_|  \\___/   |_|`}
        </pre>
        <div className="ta-hcode ta-404-find">
          <span className="ta-dim">$</span> find . -name "{loc.pathname}" ·{' '}
          <span className="ta-err">not found</span>
        </div>
        <h1 className="ta-h1">{t('fourohfour.title')}</h1>
        <p className="ta-contact-sub">{t('fourohfour.sub')}</p>
        <Link to="/" className="ta-email cursor-hover">
          <span className="ta-dim">→</span> {t('fourohfour.home')}
        </Link>
      </div>
    </section>
  );
}
