declare module 'virtual:sealed-secrets' {
  import type {SealedSecrets} from '~/lib/seal';

  const value: SealedSecrets;
  export default value;
}

declare module 'virtual:sealed-photos' {
  import type {SealedPhotoMeta} from '~/lib/seal';

  const value: Record<string, SealedPhotoMeta>;
  export default value;
}
