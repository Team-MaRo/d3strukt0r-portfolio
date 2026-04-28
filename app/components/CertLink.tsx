import {useSyncExternalStore} from 'react';
import {useTranslation} from 'react-i18next';
import {getState, isSealed, reveal, subscribe} from '~/lib/seal';
import {openLockModal} from '~/lib/seal-modal';
import {LockIcon} from './icons/LockIcon';

interface Props {
  /** Plaintext or sentinel URL. Empty string means no certificate URL. */
  url: string;
  /** Cert name rendered inline before the chip. */
  children: React.ReactNode;
}

function useSealState() {
  return useSyncExternalStore(subscribe, getState, getState);
}

/**
 * Renders the cert name as plain text followed by a small action chip when
 *  a credential URL exists. The chip explicitly labels its state so users
 *  know there's a verifiable link there even when it's gated.
 */
export function CertLink({url, children}: Props) {
  const state = useSealState();
  const {t} = useTranslation();

  if (url.length === 0) {
    return <>{children}</>;
  }

  const sealed = isSealed(url);
  const realUrl = sealed ? reveal(url, '') : url;
  const showLink = realUrl.length > 0 && (!sealed || state.unlocked);

  if (showLink) {
    return (
      <>
        {children}
        {' '}
        <a
          href={realUrl}
          target="_blank"
          rel="noreferrer"
          className="ta-cred-chip ta-cred-chip--open cursor-hover"
          title={t('seal.open_credential')}
        >
          <span className="ta-cred-chip-arrow" aria-hidden="true">↗</span>
          <span className="ta-cred-chip-label">{t('seal.verify')}</span>
        </a>
      </>
    );
  }

  return (
    <>
      {children}
      {' '}
      <button
        type="button"
        onClick={openLockModal}
        className="ta-cred-chip ta-cred-chip--locked cursor-hover"
        title={t('seal.unlock_to_verify')}
      >
        <LockIcon size={12} className="ta-cred-chip-icon" />
        <span className="ta-cred-chip-label">{t('seal.locked_short')}</span>
      </button>
    </>
  );
}
