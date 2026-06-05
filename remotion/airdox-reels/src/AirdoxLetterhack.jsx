import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const palette = {
  black: '#050608',
  ink: '#090b10',
  paper: '#f5f8ff',
  cyan: '#00f0ff',
  pink: '#ff00aa',
  lime: '#9adf6b',
};

const strips = [
  { top: 126, height: 74, left: -70, rotate: -7, color: palette.paper, text: 'AIRDOX AIRDOX AIRDOX' },
  { top: 265, height: 34, left: 22, rotate: 3, color: palette.cyan, text: 'BERLIN UNDERGROUND TECHNO' },
  { top: 492, height: 96, left: -44, rotate: -2, color: palette.pink, text: 'NO WARM-UP NO WARM-UP' },
  { top: 694, height: 54, left: 18, rotate: 6, color: palette.lime, text: 'PRESSURE SIGNAL' },
  { top: 1464, height: 88, left: -120, rotate: -4, color: palette.paper, text: 'AIRDOX.INFO AIRDOX.INFO' },
];

const letterParts = [
  { letter: 'A', x: 90, y: 728, w: 168, h: 360, delay: 0, rotate: -7 },
  { letter: 'I', x: 245, y: 684, w: 118, h: 410, delay: 5, rotate: 5 },
  { letter: 'R', x: 346, y: 716, w: 184, h: 350, delay: 9, rotate: -3 },
  { letter: 'D', x: 518, y: 690, w: 190, h: 405, delay: 13, rotate: 4 },
  { letter: 'O', x: 700, y: 724, w: 178, h: 350, delay: 17, rotate: -5 },
  { letter: 'X', x: 846, y: 682, w: 190, h: 430, delay: 21, rotate: 7 },
];

const resolveSrc = (src) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return staticFile(src.replace(/^\/+/, ''));
};

const clampInterpolate = (frame, input, output) =>
  interpolate(frame, input, output, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

const NoiseField = ({ frame }) => (
  <>
    {Array.from({ length: 46 }, (_, index) => {
      const top = (index * 131 + frame * 7) % 1920;
      const left = (index * 83 + frame * 11) % 1080;
      const bright = index % 3 === 0 ? palette.cyan : index % 3 === 1 ? palette.pink : palette.paper;
      return (
        <div
          key={index}
          style={{
            position: 'absolute',
            top,
            left,
            width: 10 + (index % 5) * 8,
            height: 2 + (index % 4),
            background: bright,
            opacity: 0.18 + ((index + frame) % 9) * 0.025,
          }}
        />
      );
    })}
  </>
);

const SlapStrip = ({ strip, frame, index }) => {
  const travel = clampInterpolate(frame, [index * 4, index * 4 + 22], [-980, strip.left]);
  return (
    <div
      style={{
        position: 'absolute',
        top: strip.top,
        left: travel,
        width: 1320,
        height: strip.height,
        transform: `rotate(${strip.rotate}deg)`,
        background: strip.color,
        color: palette.black,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 42,
        fontSize: strip.height * 0.48,
        fontWeight: 950,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        boxShadow: `14px 14px 0 ${palette.black}`,
      }}
    >
      {strip.text}
    </div>
  );
};

const CutLetter = ({ part, frame }) => {
  const appear = clampInterpolate(frame, [part.delay + 24, part.delay + 34], [0, 1]);
  const slam = clampInterpolate(frame, [part.delay + 20, part.delay + 35], [180, 0]);
  const glitch = frame % 19 < 3 ? 10 : frame % 29 < 3 ? -8 : 0;
  const color = frame % 37 < 4 ? palette.pink : palette.paper;

  return (
    <div
      style={{
        position: 'absolute',
        left: part.x + glitch,
        top: part.y + slam,
        width: part.w,
        height: part.h,
        opacity: appear,
        transform: `rotate(${part.rotate}deg) skew(${part.rotate * -0.5}deg)`,
        background: color,
        color: palette.black,
        clipPath: 'polygon(8% 0, 96% 7%, 86% 100%, 0 88%)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 216,
        fontWeight: 1000,
        lineHeight: 1,
        boxShadow: `9px 0 0 ${palette.cyan}, -9px 0 0 ${palette.pink}, 0 20px 0 ${palette.black}`,
      }}
    >
      {part.letter}
    </div>
  );
};

const TapeLabel = ({ children, top, left, color = palette.paper }) => (
  <div
    style={{
      position: 'absolute',
      top,
      left,
      background: color,
      color: palette.black,
      padding: '10px 16px',
      fontSize: 27,
      fontWeight: 950,
      textTransform: 'uppercase',
      transform: 'rotate(-2deg)',
    }}
  >
    {children}
  </div>
);

export const AirdoxLetterhack = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioSrc = resolveSrc(props.audioUrl);
  const logoFlash = frame % Math.round(fps * 1.25) < 5 ? 0.72 : 0.12;
  const gate = clampInterpolate(frame, [65, 92], [0, 1]);

  return (
    <AbsoluteFill style={{ background: palette.black, fontFamily: 'Inter, Arial, sans-serif', overflow: 'hidden' }}>
      {audioSrc ? <Audio src={audioSrc} volume={0.92} /> : null}
      <NoiseField frame={frame} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(0deg, transparent 0 18px, rgba(255,255,255,0.045) 19px 20px),
            radial-gradient(circle at 50% 46%, rgba(0,240,255,0.15), transparent 38%)`,
        }}
      />
      <Img
        src={staticFile('brand-assets/daumenkino/airdox-graffiti-logo-clean.png')}
        style={{
          position: 'absolute',
          left: -230,
          top: 570,
          width: 1540,
          opacity: logoFlash,
          filter: 'contrast(1.22) saturate(1.4)',
          transform: `rotate(-8deg) scale(${1.1 + gate * 0.08})`,
        }}
      />
      {strips.map((strip, index) => (
        <SlapStrip key={strip.top} strip={strip} frame={frame} index={index} />
      ))}
      <TapeLabel top={62} left={58} color={palette.cyan}>
        {props.badge}
      </TapeLabel>
      <TapeLabel top={1600} left={64} color={palette.lime}>
        {props.setTitle}
      </TapeLabel>
      <div
        style={{
          position: 'absolute',
          top: 345,
          left: 64,
          width: 930,
          color: palette.paper,
          fontSize: 132,
          fontWeight: 1000,
          lineHeight: 0.88,
          textTransform: 'uppercase',
          textShadow: `8px 0 ${palette.cyan}, -8px 0 ${palette.pink}`,
          transform: `translateX(${frame % 23 < 2 ? -18 : 0}px)`,
        }}
      >
        {props.hook}
      </div>
      {letterParts.map((part) => (
        <CutLetter key={part.letter} part={part} frame={frame} />
      ))}
      <div
        style={{
          position: 'absolute',
          left: 68,
          right: 68,
          bottom: 180,
          display: 'grid',
          gap: 12,
          color: palette.paper,
        }}
      >
        <div style={{ fontSize: 34, color: palette.pink, fontWeight: 950, textTransform: 'uppercase' }}>{props.subline}</div>
        <div style={{ fontSize: 25, color: '#9aa6b2', fontWeight: 800, textTransform: 'uppercase' }}>
          {props.trackArtist} / {props.trackTitle} / {props.timecode}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 60,
          bottom: 74,
          color: palette.paper,
          fontSize: 52,
          fontWeight: 1000,
          textTransform: 'uppercase',
        }}
      >
        {props.cta}
      </div>
    </AbsoluteFill>
  );
};
