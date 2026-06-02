import LockClosed from '~/assets/icons/lock-closed.svg?react';
import LockOpen from '~/assets/icons/lock-open.svg?react';

interface Props {
  open?: boolean;
  size?: number;
  className?: string;
}

/**
 * Inline padlock icon (currentColor). `open` swaps in the unlocked variant
 *  with the shackle rotated so it lifts off the body. Sized via the `size`
 *  prop or controlled by font-size when `1em` width/height is desired.
 */
export function LockIcon({open = false, size, className}: Props) {
  const dim = size ?? 16;
  const Icon = open ? LockOpen : LockClosed;
  return <Icon width={dim} height={dim} className={className} />;
}
