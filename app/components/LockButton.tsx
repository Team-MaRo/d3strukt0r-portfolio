import {useEffect, useState, useSyncExternalStore} from 'react';
import {useTranslation} from 'react-i18next';
import {getState, hydrate, lock, subscribe} from '~/lib/seal';
import {registerLockModalOpener} from '~/lib/seal-modal';
import {LockIcon} from './icons/LockIcon';
import {LockModal} from './LockModal';

function useSealState() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function LockButton() {
  const state = useSealState();
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void hydrate();
  }, []);

  useEffect(() => {
    return registerLockModalOpener(() => setOpen(true));
  }, []);

  const handleClick = () => {
    if (state.unlocked) {
      lock();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-md border border-input bg-background/40 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-hover"
        onClick={handleClick}
        aria-label={state.unlocked ? t('seal.relock') : t('seal.unlock')}
        title={state.unlocked ? t('seal.relock') : t('seal.unlock')}
      >
        <LockIcon open={state.unlocked} size={16} />
      </button>
      <LockModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
