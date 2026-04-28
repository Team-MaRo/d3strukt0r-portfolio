import {decode as blurhashDecode} from 'blurhash';
import {useEffect, useRef, useSyncExternalStore} from 'react';
import {useTranslation} from 'react-i18next';
import {getPhotoMeta, getPhotoUrl, getState, subscribe} from '~/lib/seal';
import {LockIcon} from './icons/LockIcon';

interface Props {
  /** Photo id declared under `photos:` in `content/linkedin/sensitive.yml`. */
  id: string;
  alt: string;
  className?: string;
  /** Width of the rendered placeholder canvas. Aspect ratio comes from meta. */
  placeholderWidth?: number;
  onLockedClick?: () => void;
}

function useSealState() {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function SealedImage({id, alt, className, placeholderWidth = 96, onLockedClick}: Props) {
  const meta = getPhotoMeta(id);
  const state = useSealState();
  const {t} = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (state.unlocked) {
      return;
    }
    if (meta == null || canvasRef.current == null) {
      return;
    }
    if (meta.w === 0 || meta.h === 0) {
      // No decoded dimensions (non-jpeg fallback) — leave canvas blank, the
      // CSS aspect-ratio + blur covers the surface enough.
      return;
    }
    const w = placeholderWidth;
    const h = Math.round((meta.h / meta.w) * w);
    const pixels = blurhashDecode(meta.hash, w, h);
    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx == null) {
      return;
    }
    const imgData = ctx.createImageData(w, h);
    imgData.data.set(pixels);
    ctx.putImageData(imgData, 0, 0);
  }, [state.unlocked, meta, placeholderWidth]);

  if (meta == null) {
    return null;
  }

  if (state.unlocked) {
    const url = getPhotoUrl(id);
    if (url != null) {
      return <img src={url} alt={alt} className={className} loading="eager" decoding="async" />;
    }
  }

  return (
    <button
      type="button"
      className={`ta-sealed-img cursor-hover${className != null && className.length > 0 ? ` ${className}` : ''}`}
      onClick={onLockedClick}
      aria-label={t('seal.locked_label')}
    >
      <canvas ref={canvasRef} className="ta-sealed-canvas" />
      <span className="ta-sealed-img-lock" aria-hidden="true"><LockIcon size={32} /></span>
    </button>
  );
}
