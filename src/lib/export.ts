// Framework-agnostic wall-to-image export. Ported from spikes/export/index.html
// (M1 export spike). No React, no side effects on import.

export type ExportFrame = 'moment' | 'strength' | 'wish';

export type ExportNote = {
  frame: ExportFrame;
  content: string;
};

export type ExportFonts = {
  // Resolved font-family names as the browser sees them. next/font hashes the
  // family, so the caller reads these off a rendered element's computed style.
  dosis: string;
  leagueSpartan: string;
  notoSC: string;
};

export type ExportStrings = {
  wordmark: string;
  title: string;
  date: string;
  footerEN: string;
  footerZH: string;
  frameLabel: Record<ExportFrame, string>;
};

export type RenderOpts = {
  fonts: ExportFonts;
  strings: ExportStrings;
  mascotSrc?: string;
};

export type SaveOpts = {
  fileName?: string;
  onLongPress?: (dataUrl: string) => void;
};

export type SaveResult = 'shared' | 'downloaded' | 'longpress';

const TOKENS = {
  navy: '#1E2538',
  offWhite: '#F5FAFB',
  teal: '#00C79F',
  auroraBlue: '#1E4FA3',
  auroraCream: '#FFF3D6',
};

const W = 1080;
const PAD = 64;
const CARD_PAD = 40;
const CARD_RADIUS = 20;
const CARD_GAP = 32;
const HEADER_H = 320;
const FOOTER_H = 170;
const NOTE_LINE_H = 50;
const PILL_H = 44;

// Chromium/WebKit cap total canvas area near 16.77M px. Stay just under it.
const SAFE_AREA = 16_000_000;

const CJK_RE = /[⺀-⻿　-〿぀-ヿ㇀-㇯㈀-鿿豈-﫿︰-﹏＀-｠]/u;

function noteFont(fonts: ExportFonts) {
  return `600 34px ${fonts.dosis}, ${fonts.notoSC}, sans-serif`;
}

function pillFont(fonts: ExportFonts) {
  return `600 24px ${fonts.leagueSpartan}, ${fonts.notoSC}, sans-serif`;
}

function tokenize(text: string) {
  const tokens: {t: string; cjk?: boolean; space?: boolean}[] = [];
  let word = '';
  for (const ch of text) {
    if (CJK_RE.test(ch)) {
      if (word) {
        tokens.push({t: word});
        word = '';
      }
      tokens.push({t: ch, cjk: true});
    } else if (ch === ' ') {
      if (word) {
        tokens.push({t: word});
        word = '';
      }
      tokens.push({t: ' ', space: true});
    } else {
      word += ch;
    }
  }
  if (word) tokens.push({t: word});
  return tokens;
}

// CJK breaks per character, Latin per word.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  let lineW = 0;
  for (const tok of tokenize(text)) {
    const w = ctx.measureText(tok.t).width;
    if (tok.space) {
      if (lineW > 0) {
        line += ' ';
        lineW += w;
      }
      continue;
    }
    if (lineW + w > maxWidth && lineW > 0) {
      lines.push(line.trimEnd());
      line = tok.t;
      lineW = w;
    } else {
      line += tok.t;
      lineW += w;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type Laid = {note: ExportNote; lines: string[]; cardH: number};

function layoutNotes(
  ctx: CanvasRenderingContext2D,
  notes: ExportNote[],
  fonts: ExportFonts,
): Laid[] {
  const cardW = W - PAD * 2;
  const textW = cardW - CARD_PAD * 2;
  return notes.map((n) => {
    ctx.font = noteFont(fonts);
    const lines = wrapText(ctx, n.content, textW);
    const cardH = CARD_PAD + PILL_H + 24 + lines.length * NOTE_LINE_H + CARD_PAD - 8;
    return {note: n, lines, cardH};
  });
}

// Fractional clamp, not integer floor: a small wall (about 4M logical px) keeps
// close to 2x here where floor(sqrt(16M/area)) would drop it to 1x.
function computeScale(w: number, h: number) {
  return Math.max(1, Math.min(2, Math.sqrt(SAFE_AREA / (w * h))));
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function ensureFonts(fonts: ExportFonts) {
  const zh = '这间房里的人匿名为你写下时刻强项祝愿';
  try {
    await Promise.all([
      document.fonts.load(`700 64px ${fonts.dosis}`),
      document.fonts.load(`600 34px ${fonts.dosis}`),
      document.fonts.load(`600 44px ${fonts.leagueSpartan}`),
      document.fonts.load(`600 24px ${fonts.leagueSpartan}`),
      document.fonts.load(`500 34px ${fonts.notoSC}`, zh),
      document.fonts.load(`700 34px ${fonts.notoSC}`, zh),
    ]);
    await document.fonts.ready;
  } catch {
    // Font loading is best-effort. Draw with whatever is available.
  }
}

function drawWall(
  notes: ExportNote[],
  opts: RenderOpts,
  mascot: HTMLImageElement | null,
): HTMLCanvasElement {
  const {fonts, strings} = opts;
  const measure = document.createElement('canvas').getContext('2d')!;
  const laid = layoutNotes(measure, notes, fonts);
  const notesH =
    laid.reduce((s, l) => s + l.cardH, 0) + CARD_GAP * (laid.length - 1);
  let H = HEADER_H + CARD_GAP + notesH + CARD_GAP + FOOTER_H;

  const scale = computeScale(W, H);
  let truncated = false;
  if (W * H > SAFE_AREA) {
    H = Math.floor(SAFE_AREA / W);
    truncated = true;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = TOKENS.offWhite;
  ctx.fillRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, W, HEADER_H);
  grad.addColorStop(0, TOKENS.auroraBlue);
  grad.addColorStop(0.55, TOKENS.teal);
  grad.addColorStop(1, TOKENS.auroraCream);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, HEADER_H);

  // White text only on the deep-blue end (DRD section 9 rule 2).
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 64px ${fonts.dosis}, ${fonts.notoSC}, sans-serif`;
  ctx.fillText(strings.wordmark, PAD, 118);
  ctx.font = `600 44px ${fonts.leagueSpartan}, ${fonts.notoSC}, sans-serif`;
  ctx.fillText(strings.title, PAD, 196);
  ctx.font = `500 30px ${fonts.dosis}, ${fonts.notoSC}, sans-serif`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(strings.date, PAD, 246);
  ctx.globalAlpha = 1;

  if (mascot) {
    const mh = HEADER_H - 60;
    const mw = mh * (mascot.naturalWidth / mascot.naturalHeight);
    ctx.drawImage(mascot, W - PAD - mw, 30, mw, mh);
  }

  let y = HEADER_H + CARD_GAP;
  const cardW = W - PAD * 2;
  for (const l of laid) {
    if (truncated && y + l.cardH > H - FOOTER_H) break;
    ctx.save();
    ctx.shadowColor = 'rgba(30,37,56,0.10)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#FFFFFF';
    roundRectPath(ctx, PAD, y, cardW, l.cardH, CARD_RADIUS);
    ctx.fill();
    ctx.restore();

    const label = strings.frameLabel[l.note.frame];
    ctx.font = pillFont(fonts);
    const pillW = ctx.measureText(label).width + 48;
    ctx.fillStyle = TOKENS.teal;
    roundRectPath(ctx, PAD + CARD_PAD, y + CARD_PAD - 8, pillW, PILL_H, PILL_H / 2);
    ctx.fill();
    ctx.fillStyle = TOKENS.navy;
    ctx.fillText(label, PAD + CARD_PAD + 24, y + CARD_PAD - 8 + PILL_H / 2 + 9);

    ctx.font = noteFont(fonts);
    ctx.fillStyle = TOKENS.navy;
    let ty = y + CARD_PAD + PILL_H + 24 + 26;
    for (const line of l.lines) {
      ctx.fillText(line, PAD + CARD_PAD, ty);
      ty += NOTE_LINE_H;
    }
    y += l.cardH + CARD_GAP;
  }

  ctx.fillStyle = TOKENS.navy;
  ctx.fillRect(0, H - FOOTER_H, W, FOOTER_H);
  ctx.fillStyle = TOKENS.offWhite;
  ctx.textAlign = 'center';
  ctx.font = `600 28px ${fonts.dosis}, ${fonts.notoSC}, sans-serif`;
  ctx.fillText(strings.footerEN, W / 2, H - FOOTER_H + 72);
  ctx.font = `500 28px ${fonts.notoSC}, ${fonts.dosis}, sans-serif`;
  ctx.fillText(strings.footerZH, W / 2, H - FOOTER_H + 118);
  ctx.textAlign = 'left';

  return canvas;
}

// ---------------------------------------------------------------------------
// Shareable single-note cards (wallpaper / square) over a brand background.
// ---------------------------------------------------------------------------

export type ShareCardFormat = 'wallpaper' | 'square';

export type ShareCardStrings = {
  wordmark: string;
  attribution: string;
  frameLabel: Record<ExportFrame, string>;
};

export type ShareBackgroundSpec = {
  src: string;
  tone: 'dark' | 'light';
  /** Vertical center (0..1) of the text block for this format. */
  anchor: number;
  /** Vertical focus (0..1) used when cover-cropping to a square. */
  focus: number;
};

export type ShareCardOpts = {
  format: ShareCardFormat;
  fonts: ExportFonts;
  strings: ShareCardStrings;
  background: ShareBackgroundSpec;
};

const SHARE_DIMS: Record<ShareCardFormat, {w: number; h: number}> = {
  wallpaper: {w: 1290, h: 2796},
  square: {w: 1080, h: 1080},
};

const imgCache = new Map<string, Promise<HTMLImageElement | null>>();
function loadImageCached(src: string) {
  let p = imgCache.get(src);
  if (!p) {
    p = loadImage(src);
    imgCache.set(src, p);
  }
  return p;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  W: number,
  H: number,
  focus: number,
) {
  if (!img || !img.naturalWidth) {
    ctx.fillStyle = TOKENS.navy;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const dx = (W - dw) / 2;
  let dy = H / 2 - focus * dh;
  dy = Math.min(0, Math.max(H - dh, dy));
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawShareCard(
  note: ExportNote,
  opts: ShareCardOpts,
  bg: HTMLImageElement | null,
): HTMLCanvasElement {
  const {format, fonts, strings, background} = opts;
  const {w: W, h: H} = SHARE_DIMS[format];

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.textBaseline = 'alphabetic';

  drawCover(ctx, bg, W, H, format === 'square' ? background.focus : 0.5);

  const lightText = background.tone === 'dark';
  const textColor = lightText ? TOKENS.offWhite : TOKENS.navy;

  // Auto-fit: shrink the note until the whole block fits the calm zone.
  const maxW = W * 0.8;
  const pillH = format === 'wallpaper' ? 60 : 52;
  const gapPillNote = format === 'wallpaper' ? 48 : 40;
  const gapNoteMark = format === 'wallpaper' ? 56 : 44;
  const markSize = format === 'wallpaper' ? 34 : 30;
  const subSize = Math.round(markSize * 0.72);
  const zoneMaxH = H * (format === 'wallpaper' ? 0.46 : 0.62);

  let noteSize = format === 'wallpaper' ? 72 : 62;
  const minSize = 34;
  let lines: string[] = [];
  let lineH = 0;
  let blockH = 0;
  while (noteSize >= minSize) {
    ctx.font = `600 ${noteSize}px ${fonts.dosis}, ${fonts.notoSC}, sans-serif`;
    lines = wrapText(ctx, note.content, maxW);
    lineH = noteSize * 1.34;
    blockH =
      pillH +
      gapPillNote +
      lines.length * lineH +
      gapNoteMark +
      markSize +
      subSize * 1.2;
    if (blockH <= zoneMaxH) break;
    noteSize -= 2;
  }

  const anchor = background.anchor;
  const cy = H * anchor;
  const top = cy - blockH / 2;

  // Radial scrim behind the text so legibility never depends on the artwork.
  const scrimR = Math.max(maxW, blockH) * 0.95;
  const rg = ctx.createRadialGradient(W / 2, cy, scrimR * 0.15, W / 2, cy, scrimR);
  if (lightText) {
    rg.addColorStop(0, 'rgba(16, 21, 34, 0.68)');
    rg.addColorStop(1, 'rgba(16, 21, 34, 0)');
  } else {
    rg.addColorStop(0, 'rgba(245, 250, 251, 0.78)');
    rg.addColorStop(1, 'rgba(245, 250, 251, 0)');
  }
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';

  // Frame pill.
  const label = strings.frameLabel[note.frame];
  ctx.font = `600 ${Math.round(pillH * 0.4)}px ${fonts.leagueSpartan}, ${fonts.notoSC}, sans-serif`;
  const pillW = ctx.measureText(label).width + 56;
  ctx.fillStyle = TOKENS.teal;
  roundRectPath(ctx, W / 2 - pillW / 2, top, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = TOKENS.navy;
  ctx.fillText(label, W / 2, top + pillH * 0.68);

  // Note body.
  ctx.fillStyle = textColor;
  ctx.font = `600 ${noteSize}px ${fonts.dosis}, ${fonts.notoSC}, sans-serif`;
  let ty = top + pillH + gapPillNote + noteSize;
  for (const line of lines) {
    ctx.fillText(line, W / 2, ty);
    ty += lineH;
  }

  // Wordmark + anonymity line.
  const my = top + pillH + gapPillNote + lines.length * lineH + gapNoteMark + markSize;
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.92;
  ctx.font = `700 ${markSize}px ${fonts.dosis}, ${fonts.notoSC}, sans-serif`;
  ctx.fillText(strings.wordmark, W / 2, my);
  ctx.globalAlpha = 0.7;
  ctx.font = `500 ${subSize}px ${fonts.dosis}, ${fonts.notoSC}, sans-serif`;
  ctx.fillText(strings.attribution, W / 2, my + subSize * 1.5);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'left';
  return canvas;
}

export async function renderShareImage(
  note: ExportNote,
  opts: ShareCardOpts,
): Promise<Blob> {
  await ensureFonts(opts.fonts);
  const bg = await loadImageCached(opts.background.src);
  return canvasToBlob(drawShareCard(note, opts, bg));
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob returned null'))),
      'image/png',
    );
  });
}

export async function renderWallImage(
  notes: ExportNote[],
  opts: RenderOpts,
): Promise<Blob> {
  await ensureFonts(opts.fonts);
  const mascot = opts.mascotSrc ? await loadImage(opts.mascotSrc) : null;
  const canvas = drawWall(notes, opts, mascot);
  return canvasToBlob(canvas);
}

function detectIOS() {
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function canShareFile(file: File) {
  if (!navigator.canShare) return false;
  try {
    return navigator.canShare({files: [file]});
  } catch {
    return false;
  }
}

// Must run synchronously inside the user gesture. The blob is pre-rendered by
// the caller so no await precedes navigator.share (defeats iOS gesture expiry).
export function saveWallImage(
  blob: Blob,
  opts: SaveOpts = {},
): Promise<SaveResult> {
  const fileName = opts.fileName ?? 'kindsight-wall.png';
  const dataUrl = URL.createObjectURL(blob);
  const file = new File([blob], fileName, {type: 'image/png'});

  const longPress = (): SaveResult => {
    opts.onLongPress?.(dataUrl);
    return 'longpress';
  };

  const download = (): SaveResult => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return 'downloaded';
  };

  if (canShareFile(file)) {
    return navigator
      .share({files: [file]})
      .then(() => 'shared' as SaveResult)
      .catch(() => longPress());
  }

  if (!detectIOS()) {
    return Promise.resolve(download());
  }

  return Promise.resolve(longPress());
}

// Batch save (one image per note). Modern browsers share all files at once;
// otherwise we download them sequentially. Rendering is async so this cannot be
// the iOS synchronous-gesture path; that constraint only applies to single save.
export async function saveImages(
  items: {blob: Blob; fileName: string}[],
): Promise<SaveResult> {
  const files = items.map(
    (i) => new File([i.blob], i.fileName, {type: 'image/png'}),
  );
  if (navigator.canShare) {
    try {
      if (navigator.canShare({files})) {
        await navigator.share({files});
        return 'shared';
      }
    } catch {
      // fall through to download
    }
  }
  for (const item of items) {
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    await new Promise((r) => setTimeout(r, 350));
    URL.revokeObjectURL(url);
  }
  return 'downloaded';
}
