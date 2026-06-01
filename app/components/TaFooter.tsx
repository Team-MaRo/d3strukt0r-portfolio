import {useTranslation} from 'react-i18next';

export function TaFooter() {
  const {t} = useTranslation();
  return (
    <footer className="w-full border-t border-border/60 py-8">
      <div className="container flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-muted-foreground">
        <div>
          <span className="opacity-50">$</span> exit 0 ·{' '}
          <time dateTime={__COPYRIGHT_YEARS__}>© {__COPYRIGHT_YEARS__}</time> {__COPYRIGHT_HOLDER__}
        </div>
        <div className="no-js:hidden">
          {t('footer.tip_prefix')}{' '}
          <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5">~</kbd>{' '}
          {t('footer.tip_or')}{' '}
          <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5">sudo</kbd>{' '}
          {t('footer.tip_suffix')}
        </div>
      </div>
    </footer>
  );
}
