import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useLocation, useNavigate} from 'react-router';
import {LockButton} from '~/components/LockButton';
import {Switch} from '~/components/ui/switch';
import {ToggleGroup, ToggleGroupItem} from '~/components/ui/toggle-group';
import {smoothScrollToAnchor} from '~/hooks/useInternalLinkNav';
import {useTheme} from '~/hooks/useTheme';
import {cn} from '~/lib/utils';

const NAV_ITEMS = [
  {key: 'about', hash: 'about'},
  {key: 'stack', hash: 'stack'},
  {key: 'work', hash: 'work'},
  {key: 'contact', hash: 'contact'},
] as const;

function MoonIcon() {
  return (
    <svg
      className="size-3.5 text-muted-foreground"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function TaNav() {
  const {t, i18n} = useTranslation();
  const {theme, setTheme} = useTheme();
  const loc = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const lang = (i18n.resolvedLanguage ?? i18n.language) === 'de' ? 'de' : 'en';
  const setLang = (l: 'en' | 'de') => void i18n.changeLanguage(l);
  const isDark = theme === 'dark';

  const onHashLink = (hash: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
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
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- nav glass intensity driven by scroll position; must update via state
    const h = () => setScrolled(window.scrollY > 16);
    h();
    window.addEventListener('scroll', h, {passive: true});
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- close menu when route changes
    setOpen(false);
  }, [loc.pathname, loc.hash]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const Brand = (
    <>
      <span className="inline-block h-4 w-2 animate-ta-blink rounded-[1px] bg-primary" aria-hidden />
      <span className="font-mono text-sm font-medium">
        manuele<span className="text-muted-foreground">@ch</span>
      </span>
    </>
  );

  return (
    <>
      <div className="ta-nav-fixed fixed inset-x-0 top-0 z-50 w-full">
        <div className="container">
          <nav
            className={cn(
              'ta-glass-nav mt-4 flex items-center gap-4 rounded-full border px-3 py-2 transition-all duration-200',
              scrolled ? 'border-border/70 shadow-lg' : 'border-border/50',
            )}
          >
            <Link to="/" className="flex items-center gap-2 pl-1 cursor-hover">
              {Brand}
            </Link>

            <div className="mx-auto hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((it) => (
                <Link
                  key={it.key}
                  to={`/#${it.hash}`}
                  onClick={onHashLink(it.hash)}
                  className="rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground cursor-hover"
                >
                  {t(`nav.${it.key}`)}
                </Link>
              ))}
              <Link
                to="/blog"
                className="rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground cursor-hover"
              >
                {t('nav.blog')}
              </Link>
              <Link
                to="/cv"
                className="rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground cursor-hover"
              >
                {t('nav.cv')}
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-2 md:ml-0">
              <div className="hidden items-center gap-2 md:flex">
                <ToggleGroup
                  type="single"
                  value={lang}
                  onValueChange={(v) => v && setLang(v as 'en' | 'de')}
                  variant="outline"
                  size="sm"
                  className="bg-muted/60"
                >
                  <ToggleGroupItem value="en" aria-label="English" className="font-mono text-xs">
                    EN
                  </ToggleGroupItem>
                  <ToggleGroupItem value="de" aria-label="Deutsch" className="font-mono text-xs">
                    DE
                  </ToggleGroupItem>
                </ToggleGroup>
                <div className="flex items-center gap-1.5 no-js:hidden">
                  <MoonIcon />
                  <Switch
                    checked={isDark}
                    onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
                    aria-label="toggle dark mode"
                    className="cursor-hover"
                  />
                </div>
                <LockButton />
              </div>

              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-background/40 text-muted-foreground transition-colors duration-200 hover:text-foreground cursor-hover md:hidden"
                onClick={() => setOpen(true)}
                aria-label="open menu"
                aria-expanded={open}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {open && (
        <div
          className="ta-overlay-fixed fixed inset-0 z-[60] flex items-start justify-center bg-background/70 px-4 pt-6 backdrop-blur-md md:hidden"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="ta-glass-strong w-full max-w-sm overflow-hidden rounded-xl border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 font-mono text-sm">
              <span className="inline-block h-4 w-2 animate-ta-blink rounded-[1px] bg-primary" aria-hidden />
              <span className="font-medium">
                manuele<span className="text-muted-foreground">@ch</span>:~$
              </span>
              <span className="ml-auto flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={lang}
                  onValueChange={(v) => v && setLang(v as 'en' | 'de')}
                  variant="outline"
                  size="sm"
                  className="bg-muted/60"
                >
                  <ToggleGroupItem value="en" aria-label="English" className="font-mono text-xs">
                    en
                  </ToggleGroupItem>
                  <ToggleGroupItem value="de" aria-label="Deutsch" className="font-mono text-xs">
                    de
                  </ToggleGroupItem>
                </ToggleGroup>
                <span className="no-js:hidden">
                  <Switch
                    checked={isDark}
                    onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
                    aria-label="toggle dark mode"
                    className="cursor-hover"
                  />
                </span>
                <LockButton />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="close menu"
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground cursor-hover"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </span>
            </div>
            <nav className="flex flex-col py-2">
              {NAV_ITEMS.map((it) => (
                <Link
                  key={it.key}
                  to={`/#${it.hash}`}
                  onClick={onHashLink(it.hash)}
                  className="px-5 py-3.5 font-mono text-[15px] text-foreground/90 transition-colors duration-200 hover:bg-accent hover:text-primary cursor-hover"
                >
                  {t(`nav.${it.key}`)}
                </Link>
              ))}
              <Link
                to="/blog"
                onClick={() => setOpen(false)}
                className="px-5 py-3.5 font-mono text-[15px] text-foreground/90 transition-colors duration-200 hover:bg-accent hover:text-primary cursor-hover"
              >
                {t('nav.blog')}
              </Link>
              <Link
                to="/cv"
                onClick={() => setOpen(false)}
                className="px-5 py-3.5 font-mono text-[15px] text-foreground/90 transition-colors duration-200 hover:bg-accent hover:text-primary cursor-hover"
              >
                {t('nav.cv')}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
