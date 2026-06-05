import React from 'react';
import { Composition, Still } from 'remotion';
import { AirdoxReel } from './AirdoxReel.jsx';
import { AirdoxLetterhack } from './AirdoxLetterhack.jsx';
import { AirdoxLetterStrobe } from './AirdoxLetterStrobe.jsx';
import { AirdoxReelSchema, defaultAirdoxReelProps } from './props.js';

const fps = 30;
const width = 1080;
const height = 1920;

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AIRDOX-Reel-Peak"
        component={AirdoxReel}
        fps={fps}
        width={width}
        height={height}
        durationInFrames={fps * 30}
        schema={AirdoxReelSchema}
        defaultProps={{
          ...defaultAirdoxReelProps,
          variant: 'peak',
          hook: 'DROP PRESSURE',
          subline: 'LIVE SET MAY 2026',
          badge: 'FULL SET ONLINE',
        }}
      />
      <Composition
        id="AIRDOX-Reel-Breakdown"
        component={AirdoxReel}
        fps={fps}
        width={width}
        height={height}
        durationInFrames={fps * 30}
        schema={AirdoxReelSchema}
        defaultProps={{
          ...defaultAirdoxReelProps,
          variant: 'breakdown',
          hook: 'BREAKDOWN SIGNAL',
          subline: 'Track energy rebuild',
          badge: 'BERLIN UNDERGROUND',
        }}
      />
      <Composition
        id="AIRDOX-Letter-Strobe-Proof"
        component={AirdoxLetterStrobe}
        fps={fps}
        width={width}
        height={height}
        durationInFrames={fps * 60}
      />
      <Composition
        id="AIRDOX-Letterhack"
        component={AirdoxLetterhack}
        fps={fps}
        width={width}
        height={height}
        durationInFrames={fps * 12}
        schema={AirdoxReelSchema}
        defaultProps={{
          ...defaultAirdoxReelProps,
          variant: 'peak',
          hook: 'NO WARM-UP',
          subline: 'JUST PRESSURE',
          badge: 'LETTERHACK 01',
        }}
      />
      <Composition
        id="AIRDOX-Story-Full-Set"
        component={AirdoxReel}
        fps={fps}
        width={width}
        height={height}
        durationInFrames={fps * 15}
        schema={AirdoxReelSchema}
        defaultProps={{
          ...defaultAirdoxReelProps,
          variant: 'story',
          hook: 'FULL SET ONLINE',
          subline: 'New 2h48m session',
          badge: 'AIRDOX.INFO',
        }}
      />
      <Still
        id="AIRDOX-Reel-First-Frame"
        component={AirdoxReel}
        width={width}
        height={height}
        schema={AirdoxReelSchema}
        defaultProps={{
          ...defaultAirdoxReelProps,
          audioUrl: '',
          variant: 'peak',
          hook: 'DROP PRESSURE',
          subline: 'LIVE SET MAY 2026',
          badge: 'FIRST FRAME',
        }}
      />
    </>
  );
};
