import React from 'react';
import { AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const assetRoot = 'brand-assets/airdox-lettering/strobe-proof';
const audioSrc = `${assetRoot}/face2face-demon-0257-60s-140bpm.mp3`;
const bpm = 140;
const strobeMultiplier = 4;

const letters = [
  { id: 'a', src: 'letter-a.png', mask: 'letter-a-solid.png', width: 380, height: 420, top: 178, displayHeight: 258, color: '#00f0ff', delay: 0 },
  { id: 'i', src: 'letter-i.png', mask: 'letter-i-solid.png', width: 200, height: 400, top: 414, displayHeight: 238, color: '#ff00aa', delay: 1 },
  { id: 'r', src: 'letter-r.png', mask: 'letter-r-solid.png', width: 320, height: 410, top: 642, displayHeight: 250, color: '#9adf6b', delay: 2 },
  { id: 'd', src: 'letter-d.png', mask: 'letter-d-solid.png', width: 310, height: 430, top: 884, displayHeight: 252, color: '#00f0ff', delay: 3 },
  { id: 'o', src: 'letter-o.png', mask: 'letter-o-solid.png', width: 295, height: 380, top: 1132, displayHeight: 246, color: '#ff00aa', delay: 4 },
  { id: 'x', src: 'letter-x.png', mask: 'letter-x-solid.png', width: 370, height: 410, top: 1372, displayHeight: 264, color: '#9adf6b', delay: 5 },
];

const framesPerStrobe = (fps) => ((fps * 60) / bpm) / strobeMultiplier;

const beatPhase = (frame, fps) => {
  return Math.floor(frame / framesPerStrobe(fps));
};

const beatPulse = (frame, fps) => {
  const strobe = framesPerStrobe(fps);
  const position = (frame % strobe) / strobe;
  return interpolate(position, [0, 0.12, 1], [1, 0.82, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

const letterStyle = (letter, offset = { x: 0, y: 0 }) => ({
  position: 'absolute',
  left: (1080 - (letter.width / letter.height) * letter.displayHeight) / 2 + offset.x,
  top: letter.top + offset.y,
  width: (letter.width / letter.height) * letter.displayHeight,
  height: letter.displayHeight,
});

const maskStyle = (letter, color, opacity, offset = { x: 0, y: 0 }) => ({
  ...letterStyle(letter, offset),
  background: color,
  opacity,
  WebkitMaskImage: `url(${staticFile(`${assetRoot}/${letter.mask}`)})`,
  maskImage: `url(${staticFile(`${assetRoot}/${letter.mask}`)})`,
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
});

export const AirdoxLetterStrobe = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phase = beatPhase(frame, fps);
  const inverted = phase % 2 === 1;
  const pulse = beatPulse(frame, fps);
  const snap = pulse > 0.66;
  const bg = inverted ? '#f5f8ff' : '#050608';
  const fg = inverted ? '#050608' : '#f5f8ff';
  const paper = inverted ? '#050608' : '#f5f8ff';
  const shadow = inverted ? '#8f99a8' : '#000000';
  const activeIndex = phase % letters.length;
  const accentIndex = Math.floor(frame / framesPerStrobe(fps)) % letters.length;

  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
      <Audio src={staticFile(audioSrc)} volume={0.95} />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${inverted ? 'rgba(5,6,8,0.075)' : 'rgba(245,248,255,0.06)'} 1px, transparent 1px)`,
          backgroundSize: '100% 44px',
          opacity: 0.32,
        }}
      />
      <AbsoluteFill
        style={{
          background: snap
            ? inverted
              ? 'rgba(5,6,8,0.2)'
              : 'rgba(245,248,255,0.22)'
            : 'transparent',
          mixBlendMode: inverted ? 'multiply' : 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 36,
          top: 1682,
          width: 1008,
          height: snap ? 22 : 7,
          background: fg,
          opacity: snap ? 1 : 0.72,
        }}
      />
      {letters.map((letter) => (
        <div key={`${letter.id}-shadow`} style={maskStyle(letter, shadow, inverted ? 0.32 : 0.86, { x: 18, y: 26 })} />
      ))}
      {letters.map((letter) => (
        <div key={`${letter.id}-edge`} style={maskStyle(letter, inverted ? '#f5f8ff' : '#000000', 0.98, { x: 6, y: 6 })} />
      ))}
      {letters.map((letter, index) => {
        const active = index === activeIndex;
        const accent = index === accentIndex;
        const secondary = (phase + letter.delay) % 4 === 0;
        return (
          <React.Fragment key={letter.id}>
            <Img
              src={staticFile(`${assetRoot}/${letter.src}`)}
              style={{
                ...letterStyle(letter),
                objectFit: 'contain',
                filter: inverted ? 'invert(1) contrast(1.85) grayscale(1)' : 'contrast(1.75) grayscale(1)',
                opacity: 0.98,
              }}
            />
            <div style={maskStyle(letter, paper, snap ? 0.98 : 0.62)} />
            <div style={maskStyle(letter, fg, snap ? 0.12 : 0.34)} />
            <div style={maskStyle(letter, letter.color, active || accent ? 0.95 * pulse : secondary ? 0.12 * pulse : 0)} />
          </React.Fragment>
        );
      })}
      {letters.map((letter, index) => {
        const active = index === activeIndex || index === accentIndex;
        return (
          <div
            key={`${letter.id}-flash`}
            style={{
              ...maskStyle(letter, letter.color, active ? 0.58 * pulse : 0),
              filter: `blur(20px) drop-shadow(0 0 42px ${letter.color})`,
              mixBlendMode: inverted ? 'multiply' : 'screen',
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 52,
          right: 52,
          top: 58,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: fg,
          fontFamily: 'Inter, Arial, sans-serif',
          fontWeight: 900,
          fontSize: 32,
          letterSpacing: 0,
          textTransform: 'uppercase',
        }}
      >
        <span>AIRDOX</span>
        <span>140 BPM / 4X STROBE</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          bottom: 92,
          color: inverted ? '#263241' : '#f5f8ff',
          fontFamily: 'Inter, Arial, sans-serif',
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: 0,
          lineHeight: 1.12,
          textAlign: 'center',
        }}
      >
        RENE BOURGEOIS / FACE2FACE WITH MY DEMON
      </div>
    </AbsoluteFill>
  );
};
