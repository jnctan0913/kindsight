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
