import React from 'react';
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const assetRoot = 'brand-assets/airdox-lettering/strobe-proof';
const audioSrc = `${assetRoot}/face2face-demon-0257-60s.mp3`;
const bpm = 132;

const letters = [
  { id: 'a', src: 'letter-a.png', left: 64, top: 650, width: 327, height: 333, color: '#00f0ff', delay: 0 },
  { id: 'i', src: 'letter-i.png', left: 294, top: 653, width: 171, height: 287, color: '#ff00aa', delay: 1 },
  { id: 'r', src: 'letter-r.png', left: 401, top: 704, width: 280, height: 267, color: '#9adf6b', delay: 2 },
  { id: 'd', src: 'letter-d.png', left: 594, top: 704, width: 227, height: 243, color: '#00f0ff', delay: 3 },
  { id: 'o', src: 'letter-o.png', left: 741, top: 709, width: 167, height: 213, color: '#ff00aa', delay: 4 },
  { id: 'x', src: 'letter-x.png', left: 818, top: 688, width: 207, height: 267, color: '#9adf6b', delay: 5 },
];

const beatPhase = (frame, fps) => {
  const framesPerBeat = (fps * 60) / bpm;
  return Math.floor(frame / (framesPerBeat / 2));
};

const maskStyle = (letter, color, opacity, offset = { x: 0, y: 0 }) => ({
  position: 'absolute',
  left: letter.left + offset.x,
  top: letter.top + offset.y,
  width: letter.width,
  height: letter.height,
  background: color,
  opacity,
  WebkitMaskImage: `url(${staticFile(`${assetRoot}/${letter.src}`)})`,
  maskImage: `url(${staticFile(`${assetRoot}/${letter.src}`)})`,
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
  const pulse = interpolate(frame % Math.round(fps / 2), [0, fps / 10, fps / 2], [0.25, 1, 0.25], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bg = inverted ? '#f5f8ff' : '#050608';
  const fg = inverted ? '#050608' : '#f5f8ff';
  const shadow = inverted ? '#9aa6b2' : '#000000';
  const activeIndex = phase % letters.length;

  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
      <Audio src={staticFile(audioSrc)} volume={0.95} />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${inverted ? 'rgba(5,6,8,0.05)' : 'rgba(245,248,255,0.055)'} 1px, transparent 1px)`,
          backgroundSize: '100% 42px',
          opacity: 0.35,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 46,
          top: 1010,
          width: 960,
          height: 14,
          background: fg,
          opacity: 0.9,
        }}
      />
      {letters.map((letter) => (
        <div key={`${letter.id}-shadow`} style={maskStyle(letter, shadow, inverted ? 0.45 : 0.95, { x: 22, y: 34 })} />
      ))}
      {letters.map((letter) => (
        <div key={`${letter.id}-edge`} style={maskStyle(letter, inverted ? '#f5f8ff' : '#000000', 1, { x: 8, y: 8 })} />
      ))}
      {letters.map((letter, index) => {
        const active = index === activeIndex;
        const secondary = (phase + letter.delay) % 3 === 0;
        const color = active ? letter.color : fg;
        return (
          <React.Fragment key={letter.id}>
            <div style={maskStyle(letter, fg, 1)} />
            <div style={maskStyle(letter, color, active ? 0.95 : secondary ? 0.16 * pulse : 0)} />
          </React.Fragment>
        );
      })}
      {letters.map((letter, index) => {
        const active = index === activeIndex;
        return (
          <div
            key={`${letter.id}-flash`}
            style={{
              ...maskStyle(letter, letter.color, active ? 0.55 * pulse : 0),
              filter: `blur(18px) drop-shadow(0 0 30px ${letter.color})`,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 56,
          right: 56,
          top: 96,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: fg,
          fontFamily: 'Inter, Arial, sans-serif',
          fontWeight: 900,
          fontSize: 38,
          letterSpacing: 0,
        }}
      >
        <span>AIRDOX STROBE PROOF</span>
        <span>{inverted ? 'WHITE HIT' : 'BLACK HIT'}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 58,
          bottom: 110,
          color: inverted ? '#263241' : '#9aa6b2',
          fontFamily: 'Inter, Arial, sans-serif',
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 0,
        }}
      >
        132 BPM / DOUBLE-BEAT INVERT / LETTER COLOR HITS / FACE2FACE 02:57
      </div>
    </AbsoluteFill>
  );
};
