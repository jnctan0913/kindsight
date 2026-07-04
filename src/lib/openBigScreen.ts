import {BASE_PATH} from '../config';

/** Opens the read-only big-screen tab for a room code (basePath-aware). */
export function openBigScreen(code: string): void {
  if (typeof window === 'undefined') return;
  const normalized = code.trim().toUpperCase();
  const path = `${BASE_PATH}/screen/?code=${encodeURIComponent(normalized)}`;
  window.open(path, '_blank', 'noopener,noreferrer');
}

export function bigScreenUrl(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (typeof window === 'undefined') {
    return `${BASE_PATH}/screen/?code=${encodeURIComponent(normalized)}`;
  }
  return new URL(
    `${BASE_PATH}/screen/?code=${encodeURIComponent(normalized)}`,
    window.location.origin,
  ).href;
}
