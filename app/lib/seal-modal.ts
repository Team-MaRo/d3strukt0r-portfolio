// Tiny pub-sub so any component can request the lock modal to open without
// drilling refs through the tree. The LockButton subscribes; consumers call
// `openLockModal()`.

let openModalFn: (() => void) | null = null;

export function registerLockModalOpener(fn: () => void): () => void {
  openModalFn = fn;
  return () => {
    if (openModalFn === fn) {
      openModalFn = null;
    }
  };
}

export function openLockModal(): void {
  openModalFn?.();
}
