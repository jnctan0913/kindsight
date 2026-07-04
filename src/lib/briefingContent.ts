import type {StringKey} from '../i18n';
import type {RoomMode} from './types';

export type BriefingFrameKey = 'moment' | 'strength' | 'wish';
export type BriefingSlideId = 'write' | 'targets' | 'reveal';

export type BriefingFrameCard = {
  frame: BriefingFrameKey;
  label: StringKey;
  stem: StringKey;
  good: StringKey;
};

export type BriefingSlide = {
  id: BriefingSlideId;
  image: string;
  title: StringKey;
  body: StringKey;
};

export const BRIEFING_FRAME_CARDS: BriefingFrameCard[] = [
  {
    frame: 'moment',
    label: 'frame.moment.label',
    stem: 'frame.moment.stem',
    good: 'briefing.moment.good',
  },
  {
    frame: 'strength',
    label: 'frame.strength.label',
    stem: 'frame.strength.stem',
    good: 'briefing.strength.good',
  },
  {
    frame: 'wish',
    label: 'frame.wish.label',
    stem: 'frame.wish.stem',
    good: 'briefing.wish.good',
  },
];

export const BRIEFING_SLIDE_COUNT = 3;

export function normalizeBriefingIndex(index: number): number {
  if (!Number.isFinite(index)) return 0;
  return Math.max(0, Math.min(BRIEFING_SLIDE_COUNT - 1, Math.round(index)));
}

export function getBriefingSlide(index: number, mode: RoomMode): BriefingSlide {
  const normalized = normalizeBriefingIndex(index);
  if (normalized === 0) {
    return {
      id: 'write',
      image: '/assets/kindsight/onboarding-write-transparent.png',
      title: 'player.briefing.slide1.title',
      body: 'player.briefing.slide1.body',
    };
  }

  if (normalized === 1) {
    return {
      id: 'targets',
      image: '/assets/kindsight/onboarding-rotate-transparent.png',
      title:
        mode === 'free_select'
          ? 'player.briefing.slide2b.title'
          : 'player.briefing.slide2a.title',
      body:
        mode === 'free_select'
          ? 'player.briefing.slide2b.body'
          : 'player.briefing.slide2a.body',
    };
  }

  return {
    id: 'reveal',
    image: '/assets/kindsight/onboarding-reveal-transparent.png',
    title: 'player.briefing.slide3.title',
    body: 'player.briefing.slide3.body',
  };
}
