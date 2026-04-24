import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useLocation, useNavigate} from 'react-router';
import {smoothScrollToAnchor} from '~/hooks/useInternalLinkNav';
import {useTheme} from '~/hooks/useTheme';

export function TaNav() {
  const {t, i18n} = useTranslation();
  const {theme, toggle} = useTheme();
  const loc = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState<string>('--:-- CET');
  const [open, setOpen] = useState(false);

  const onHashLink = (hash: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    if (loc.pathname === '/') {
      if (smoothScrollToAnchor(hash)) {
        e.preventDefault();
        window.history.pushState(null, '', `/#${hash}`);
      }
      return;
    }
    e.preventDefault();
    void navigate(`/#${hash}`);
  };

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname, loc.hash]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${mm} CET`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const lang = i18n.resolvedLanguage ?? i18n.language;
  const setLang = (l: 'en' | 'de') => void i18n.changeLanguage(l);

  return (
    <nav className={`ta-nav${open ? ' open' : ''}`}>
      <div className="ta-nav-inner ta-glass">
        <Link to="/" className="ta-nav-brand cursor-hover">
          <span className="ta-cursor-blink">▌</span>
          <span>
            manuele<span className="ta-dim">@ch</span>:~$
          </span>
        </Link>
        <div className="ta-nav-links">
          <Link to="/#about" onClick={onHashLink('about')} className="ta-nav-link cursor-hover">{t('nav.about')}</Link>
          <Link to="/#stack" onClick={onHashLink('stack')} className="ta-nav-link cursor-hover">{t('nav.stack')}</Link>
          <Link to="/#work" onClick={onHashLink('work')} className="ta-nav-link cursor-hover">{t('nav.work')}</Link>
          <Link to="/blog" className="ta-nav-link cursor-hover">{t('nav.blog')}</Link>
          <Link to="/cv" className="ta-nav-link cursor-hover">{t('nav.cv')}</Link>
          <Link to="/#contact" onClick={onHashLink('contact')} className="ta-nav-link cursor-hover">{t('nav.contact')}</Link>
        </div>
        <div className="ta-nav-controls">
          <span className="ta-time">{time}</span>
          <button
            type="button"
            className="ta-pill cursor-hover"
            onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
            aria-label="toggle language"
          >
            <span className={lang === 'en' ? 'on' : ''}>en</span>|
            <span className={lang === 'de' ? 'on' : ''}>de</span>
          </button>
          <button
            type="button"
            className="ta-icon cursor-hover"
            onClick={toggle}
            aria-label="toggle theme"
          >
            {theme === 'dark' ? '◐' : '◑'}
          </button>
          <button
            type="button"
            className="ta-icon ta-nav-toggle cursor-hover"
            onClick={() => setOpen((v) => !v)}
            aria-label="toggle menu"
            aria-expanded={open}
          >
            {open ? '✕' : '≡'}
          </button>
        </div>
      </div>
    </nav>
  );
}
