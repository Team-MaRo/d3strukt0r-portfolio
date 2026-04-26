import {useTranslation} from 'react-i18next';

export function TaFooter() {
  const {t} = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="ta-footer">
      <div>
        <span className="ta-dim">$</span> exit 0 ·{' '}
        <time dateTime={String(year)}>© {year}</time> manuele
      </div>
      <div className="ta-dim">
        {t('footer.tip_prefix')} <kbd>~</kbd> {t('footer.tip_or')} <kbd>sudo</kbd> {t('footer.tip_suffix')}
      </div>
    </footer>
  );
}
