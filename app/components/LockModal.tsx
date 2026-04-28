import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {createPortal} from 'react-dom';
import {useTranslation} from 'react-i18next';
import {getState, subscribe, unlock} from '~/lib/seal';

function useSealState() {
  return useSyncExternalStore(subscribe, getState, getState);
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LockModal({open, onClose}: Props) {
  const state = useSealState();
  const {t} = useTranslation();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || state.cooldownUntil <= Date.now()) {
      return undefined;
    }
    const id = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [open, state.cooldownUntil]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (state.unlocked && open) {
      onClose();
    }
  }, [state.unlocked, open, onClose]);

  if (!open) {
    return null;
  }

  const cooldownLeft = Math.max(0, state.cooldownUntil - Date.now());
  const locked = cooldownLeft > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || locked || pw.length === 0) {
      return;
    }
    setBusy(true);
    try {
      await unlock(pw);
    } finally {
      setBusy(false);
    }
  };

  let errMsg: string | null = null;
  if (state.lastError === 'wrong') {
    errMsg = locked
      ? t('seal.cooldown', {seconds: Math.ceil(cooldownLeft / 1000)})
      : t('seal.wrong');
  }

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal((
    <div className="ta-seal-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="ta-seal-modal ta-glass"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ta-seal-title"
      >
        <div className="ta-seal-head">
          <span className="ta-dim">$</span> sudo unlock
        </div>
        <h2 id="ta-seal-title" className="ta-seal-title">{t('seal.modal_title')}</h2>
        <p className="ta-seal-sub ta-dim">{t('seal.modal_sub')}</p>
        <form onSubmit={submit} className="ta-seal-form">
          <input
            ref={inputRef}
            type="password"
            className="ta-seal-input"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder={t('seal.placeholder')}
            disabled={busy || locked}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="ta-btn ta-btn-primary cursor-hover" disabled={busy || locked || pw.length === 0}>
            {busy ? t('seal.checking') : t('seal.submit')}
          </button>
        </form>
        {errMsg != null && <div className="ta-seal-err">{errMsg}</div>}
        <button type="button" className="ta-seal-close cursor-hover" onClick={onClose} aria-label={t('seal.close')}>✕</button>
      </div>
    </div>
  ), document.body);
}
