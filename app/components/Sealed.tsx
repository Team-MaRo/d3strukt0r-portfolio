import {useSyncExternalStore} from 'react';
import {useTranslation} from 'react-i18next';
import {getState, isSealed, reveal, sealedId, subscribe} from '~/lib/seal';
import {LockIcon} from './icons/LockIcon';

function useSealState() {
  return useSyncExternalStore(subscribe, getState, getState);
}

interface SealedProps {
  /** Possibly-sealed string. Plain strings render as-is. */
  value: string | null | undefined;
  className?: string;
  /** Override the locked-state placeholder (defaults to ••••••••). */
  placeholder?: string;
  /** Optional click target (e.g. open the lock modal). */
  onLockedClick?: () => void;
}

export function Sealed({value, className, placeholder, onLockedClick}: SealedProps) {
  useSealState();
  const {t} = useTranslation();
  const safe = value ?? '';
  if (!isSealed(safe)) {
    return <span className={className}>{safe}</span>;
  }
  const id = sealedId(safe);
  const plain = id != null ? reveal(safe, '') : '';
  if (plain.length > 0) {
    return <span className={className}>{plain}</span>;
  }
  return (
    <span
      className={`ta-sealed cursor-hover${className != null && className.length > 0 ? ` ${className}` : ''}`}
      onClick={onLockedClick}
      data-sealed-id={id ?? ''}
      title={t('seal.locked_hint')}
      role={onLockedClick ? 'button' : undefined}
    >
      <span className="ta-sealed-text" aria-hidden="true">
        {placeholder ?? '••••••••'}
      </span>
      <LockIcon size={12} className="ta-sealed-lock" />
      <span className="sr-only">{t('seal.locked_label')}</span>
    </span>
  );
}
