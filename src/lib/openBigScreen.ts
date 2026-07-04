import {BASE_PATH} from '../config';

/** Opens the read-only big-screen tab for a room code (basePath-aware). */
export function openBigScreen(code: string): void {
  if (typeof window === 'undefined') return;
  const normalized = code.trim().toUpperCase();
  const path = `${BASE_PATH}/screen/?code=${encodeURIComponent(normalized)}`;
  window.open(path, '_blank', 'noopener,noreferrer');
}

// `preview` marks the console's embedded projector iframe so the big screen can
// stay silent there (no music arm overlay, transport, or channel subscription):
// the preview is a mirror, not a speaker.
export function bigScreenUrl(code: string, opts?: {preview?: boolean}): string {
  const normalized = code.trim().toUpperCase();
  const qs = `code=${encodeURIComponent(normalized)}${opts?.preview ? '&preview=1' : ''}`;
  if (typeof window === 'undefined') {
    return `${BASE_PATH}/screen/?${qs}`;
  }
  return new URL(`${BASE_PATH}/screen/?${qs}`, window.location.origin).href;
}
