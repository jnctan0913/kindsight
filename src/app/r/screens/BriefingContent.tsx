'use client';

import React, {useRef, useState} from 'react';
import {Swiper, SwiperSlide} from 'swiper/react';
import type {Swiper as SwiperType} from 'swiper';

import 'swiper/css';

import {asset} from '@/config';
import {components} from '@/components';
import {LanguageToggle, useT} from '@/i18n';
import type {StringKey} from '@/i18n';
import {useRoomStore} from '@/stores/room';

const SLIDE_COUNT = 3;

const frames: {label: StringKey; stem: StringKey; good: StringKey}[] = [
  {label: 'frame.moment.label', stem: 'frame.moment.stem', good: 'briefing.moment.good'},
  {label: 'frame.strength.label', stem: 'frame.strength.stem', good: 'briefing.strength.good'},
  {label: 'frame.wish.label', stem: 'frame.wish.stem', good: 'briefing.wish.good'},
];

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--white-color)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-soft)',
  padding: 16,
  marginTop: 14,
};

const illustrationStyle: React.CSSProperties = {
  display: 'block',
  width: '60%',
  maxWidth: 320,
  height: 'auto',
  margin: '0 auto',
};

export const BriefingContent: React.FC = () => {
  const t = useT();
  const mode = useRoomStore((s) => s.mode);
  const [index, setIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  // Slide 2 tells players how targets are chosen; the copy differs by mode.
  const modeB = mode === 'free_select';
  const slide2 = modeB
    ? {
        img: 'onboarding-rotate-transparent.png',
        title: 'player.briefing.slide2b.title' as StringKey,
        body: 'player.briefing.slide2b.body' as StringKey,
      }
    : {
        img: 'onboarding-rotate-transparent.png',
        title: 'player.briefing.slide2a.title' as StringKey,
        body: 'player.briefing.slide2a.body' as StringKey,
      };

  const renderDots = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        marginBottom: 10,
      }}
    >
      {Array.from({length: SLIDE_COUNT}).map((_, i) => (
        <div
          key={i}
          style={{
            width: 22,
            height: 6,
            borderRadius: 4,
            backgroundColor: index === i ? 'var(--main-color)' : 'var(--border-color)',
            transition: 'background-color 150ms ease-in-out',
          }}
        />
      ))}
    </div>
  );

  const renderSlide1 = () => (
    <>
      <img
        src={asset('/assets/kindsight/onboarding-write-transparent.png')}
        alt=''
        aria-hidden='true'
        style={illustrationStyle}
      />
      <h2 style={{marginTop: 12, textAlign: 'center'}}>{t('player.briefing.slide1.title')}</h2>
      <p className='t16' style={{marginTop: 8, textAlign: 'center'}}>
        {t('player.briefing.slide1.body')}
      </p>

      {frames.map((frame) => (
        <div key={frame.label} style={cardStyle}>
          <components.FrameTag label={t(frame.label)} />
          <p
            style={{
              marginTop: 10,
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--main-color)',
              fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
            }}
          >
            {t(frame.stem)}
          </p>
          <p className='t14' style={{marginTop: 6, fontStyle: 'italic'}}>
            {t(frame.good)}
          </p>
        </div>
      ))}

      <div style={cardStyle}>
        <span className='t12'>{t('briefing.example.vagueLabel')}</span>
        <p className='t14' style={{marginTop: 4, textDecoration: 'line-through'}}>
          {t('briefing.moment.vague')}
        </p>
        <span className='t12' style={{display: 'block', marginTop: 12, color: 'var(--accent-deep)'}}>
          {t('briefing.example.betterLabel')}
        </span>
        <p className='t14' style={{marginTop: 4, color: 'var(--main-color)'}}>
          {t('briefing.moment.better')}
        </p>
      </div>
    </>
  );

  const renderSlide2 = () => (
    <>
      <img
        src={asset(`/assets/kindsight/${slide2.img}`)}
        alt=''
        aria-hidden='true'
        style={illustrationStyle}
      />
      <h2 style={{marginTop: 12, textAlign: 'center'}}>{t(slide2.title)}</h2>
      <p className='t16' style={{marginTop: 8, textAlign: 'center'}}>
        {t(slide2.body)}
      </p>
    </>
  );

  const renderSlide3 = () => (
    <>
      <img
        src={asset('/assets/kindsight/onboarding-reveal-transparent.png')}
        alt=''
        aria-hidden='true'
        style={illustrationStyle}
      />
      <h2 style={{marginTop: 12, textAlign: 'center'}}>{t('player.briefing.slide3.title')}</h2>
      <p className='t16' style={{marginTop: 8, textAlign: 'center'}}>
        {t('player.briefing.slide3.body')}
      </p>

      <div style={{...cardStyle, marginTop: 24}}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 600,
            lineHeight: 1.5,
            color: 'var(--main-color)',
            fontFamily: 'var(--font-dosis), var(--font-noto-sc), sans-serif',
          }}
        >
          {t('player.briefing.anonymity')}
        </p>
      </div>
    </>
  );

  const slides = [renderSlide1, renderSlide2, renderSlide3];

  return (
    <components.Screen>
      <components.Header title={t('player.briefing.title')} rightSlot={<LanguageToggle />} />
      {renderDots()}

      <div style={{flex: 1, minHeight: 0}}>
        <Swiper
          style={{width: '100%', height: '100%'}}
          spaceBetween={16}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        >
          {slides.map((renderSlide, i) => (
            <SwiperSlide key={i} style={{height: '100%'}}>
              <div className='container scrollable' style={{height: '100%', paddingBottom: 20}}>
                {renderSlide()}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <footer style={{padding: 20, minHeight: 'var(--footer-height)'}}>
        {index < SLIDE_COUNT - 1 ? (
          <components.Button
            label={t('common.continue')}
            onClick={() => swiperRef.current?.slideNext()}
            colorScheme='secondary'
            style={{
              textTransform: 'none',
              boxShadow: 'var(--shadow-soft), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            }}
          />
        ) : (
          <p className='t16' style={{textAlign: 'center'}}>
            {t('player.briefing.footer')}
          </p>
        )}
      </footer>
    </components.Screen>
  );
};
