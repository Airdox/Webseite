import React from 'react';
import { Audio, AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const colors = {
  bg: '#050608',
  surface: '#0f141a',
  border: '#263241',
  cyan: '#00f0ff',
  pink: '#ff00aa',
  lime: '#9adf6b',
  text: '#f5f8ff',
  muted: '#9aa6b2',
};

const resolveSrc = (src) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return staticFile(src.replace(/^\/+/, ''));
};

const fitText = (text, baseSize, maxChars) => {
  const extra = Math.max(0, text.length - maxChars);
  return Math.max(baseSize - extra * 1.6, baseSize * 0.64);
};

const ShellLines = ({ sweep }) => (
  <>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(90deg, rgba(0,240,255,0.08) 1px, transparent 1px),
          linear-gradient(0deg, rgba(245,248,255,0.035) 1px, transparent 1px)`,
        backgroundSize: '72px 72px',
        opacity: 0.42,
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: `${sweep}%`,
        width: 3,
        height: '100%',
        background: colors.cyan,
        boxShadow: `0 0 34px ${colors.cyan}`,
        opacity: 0.7,
      }}
    />
  </>
);

const SignalBars = ({ frame, fps }) => {
  const bars = Array.from({ length: 34 }, (_, index) => {
    const beat = Math.sin((frame + index * 4) / (fps * 0.18));
    const drift = Math.sin((frame + index * 13) / (fps * 0.7));
    return 26 + Math.abs(beat * 76) + Math.abs(drift * 34);
  });

  return (
    <div style={{ display: 'flex', alignItems: 'end', gap: 8, height: 164 }}>
      {bars.map((height, index) => (
        <div
          key={index}
          style={{
            width: 16,
            height,
            background: index % 7 === 0 ? colors.pink : colors.cyan,
            opacity: index % 5 === 0 ? 0.9 : 0.62,
            boxShadow: `0 0 18px ${index % 7 === 0 ? colors.pink : colors.cyan}`,
          }}
        />
      ))}
    </div>
  );
};

const TrackPanel = ({ props, pulse }) => (
  <div
    style={{
      border: `1px solid ${colors.border}`,
      background: 'rgba(15,20,26,0.9)',
      padding: '28px 30px',
      display: 'grid',
      gap: 16,
      transform: `translateY(${interpolate(pulse, [0, 1], [0, -6])}px)`,
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.muted, fontSize: 24, fontWeight: 700 }}>
      <span>{props.setTitle}</span>
      <span style={{ color: colors.lime }}>{props.timecode}</span>
    </div>
    <div style={{ color: colors.text, fontSize: fitText(props.trackArtist, 52, 22), fontWeight: 800, lineHeight: 1.04 }}>
      {props.trackArtist.toUpperCase()}
    </div>
    <div style={{ color: colors.muted, fontSize: fitText(props.trackTitle, 34, 32), fontWeight: 600, lineHeight: 1.15 }}>
      {props.trackTitle}
    </div>
  </div>
);

export const AirdoxReel = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sweep = interpolate(frame, [0, fps * 3], [-8, 108], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const enter = interpolate(frame, [0, fps * 1.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const pulse = (Math.sin(frame / (fps * 0.32)) + 1) / 2;
  const coverScale = 1.02 + pulse * 0.025;
  const audioSrc = resolveSrc(props.audioUrl);

  return (
    <AbsoluteFill style={{ background: colors.bg, fontFamily: 'Inter, Arial, sans-serif', color: colors.text, overflow: 'hidden' }}>
      {audioSrc ? <Audio src={audioSrc} volume={0.92} /> : null}
      <ShellLines sweep={sweep} />
      <div
        style={{
          position: 'absolute',
          inset: '88px 78px 118px',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gap: 34,
          opacity: enter,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: 0 }}>{props.brand.toUpperCase()}</div>
          <div
            style={{
              border: `1px solid ${colors.cyan}`,
              color: colors.cyan,
              padding: '12px 18px',
              fontSize: 22,
              fontWeight: 800,
              boxShadow: `0 0 24px rgba(0,240,255,${0.18 + pulse * 0.22})`,
            }}
          >
            {props.badge.toUpperCase()}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateRows: 'minmax(0, 1fr) auto', gap: 30 }}>
          <div style={{ position: 'relative', border: `1px solid ${colors.border}`, background: colors.surface, overflow: 'hidden' }}>
            <Img
              src={resolveSrc(props.coverSrc)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${coverScale})`,
                filter: 'contrast(1.1) saturate(1.08) brightness(0.72)',
              }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,6,8,0.1), rgba(5,6,8,0.58))' }} />
            <div
              style={{
                position: 'absolute',
                left: 38,
                right: 38,
                bottom: 42,
                color: colors.text,
                fontSize: fitText(props.hook, props.variant === 'story' ? 104 : 118, 16),
                lineHeight: 0.94,
                fontWeight: 950,
                textTransform: 'uppercase',
              }}
            >
              {props.hook}
            </div>
          </div>
          <TrackPanel props={props} pulse={pulse} />
        </div>

        <div style={{ display: 'grid', gap: 28 }}>
          <SignalBars frame={frame} fps={fps} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <div>
              <div style={{ color: colors.pink, fontSize: 26, fontWeight: 900, textTransform: 'uppercase' }}>{props.subline}</div>
              <div style={{ color: colors.muted, fontSize: 21, fontWeight: 600, marginTop: 8 }}>Berlin Underground Techno</div>
            </div>
            <div style={{ color: colors.text, fontSize: 44, fontWeight: 950 }}>{props.cta.toUpperCase()}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
