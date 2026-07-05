// Manifest for the shareable-image backgrounds. Each entry pairs a brand
// background (generated art, tall portrait ~9:19.5) with the text-placement
// config the canvas renderer needs: whether text should be light or dark, where
// the calm zone sits vertically, and where to focus a square crop. Drop a new
// PNG in public/assets/kindsight/share-bg/ and add a row here to expose it.

export type ShareFormat = 'wallpaper' | 'square';

export type ShareBackgroundId = 'aurora-night' | 'warm-dawn' | 'inner-light';

export type ShareBackground = {
  id: ShareBackgroundId;
  /** Path under public/, passed through asset() at call time. */
  src: string;
  /** Background tone. 'dark' => light text; 'light' => dark navy text. */
  tone: 'dark' | 'light';
  /** Vertical center (0..1) of the text block on the tall wallpaper. */
  wallpaperAnchor: number;
  /** Vertical center (0..1) of the text block within the square crop. */
  squareAnchor: number;
  /** Vertical focus (0..1) used when cover-cropping the tall art to a square. */
  squareFocus: number;
};

export const SHARE_BACKGROUNDS: ShareBackground[] = [
  {
    id: 'aurora-night',
    src: '/assets/kindsight/share-bg/aurora-night.png',
    tone: 'dark',
    wallpaperAnchor: 0.32,
    squareAnchor: 0.4,
    squareFocus: 0.32,
  },
  {
    id: 'warm-dawn',
    src: '/assets/kindsight/share-bg/warm-dawn.png',
    tone: 'light',
    wallpaperAnchor: 0.44,
    squareAnchor: 0.46,
    squareFocus: 0.42,
  },
  {
    id: 'inner-light',
    src: '/assets/kindsight/share-bg/inner-light.png',
    tone: 'dark',
    wallpaperAnchor: 0.3,
    squareAnchor: 0.38,
    squareFocus: 0.3,
  },
];

export const SHARE_FORMATS: {id: ShareFormat; w: number; h: number}[] = [
  {id: 'wallpaper', w: 1290, h: 2796},
  {id: 'square', w: 1080, h: 1080},
];

export function shareFormatDims(format: ShareFormat) {
  return SHARE_FORMATS.find((f) => f.id === format) ?? SHARE_FORMATS[0];
}
