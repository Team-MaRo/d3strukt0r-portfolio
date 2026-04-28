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
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={dim}
      height={dim}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      {open
        ? <path d="M8 11V7a4 4 0 0 1 7.5-2" />
        : <path d="M8 11V7a4 4 0 0 1 8 0v4" />}
    </svg>
  );
}
