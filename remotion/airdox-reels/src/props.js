import { z } from 'zod';

export const AirdoxReelSchema = z.object({
  variant: z.enum(['peak', 'breakdown', 'story']),
  brand: z.string(),
  hook: z.string(),
  subline: z.string(),
  badge: z.string(),
  cta: z.string(),
  setTitle: z.string(),
  trackArtist: z.string(),
  trackTitle: z.string(),
  timecode: z.string(),
  coverSrc: z.string(),
  audioUrl: z.string(),
});

export const defaultAirdoxReelProps = {
  variant: 'peak',
  brand: 'AIRDOX',
  hook: 'DROP PRESSURE',
  subline: 'LIVE SET MAY 2026',
  badge: 'FULL SET ONLINE',
  cta: 'AIRDOX.INFO',
  setTitle: 'LIVE SET MAY 2026',
  trackArtist: 'Rene Bourgeois',
  trackTitle: 'Face2Face With My Demon',
  timecode: '00:18:40',
  coverSrc: '/assets/airdox-vinyl.jpg',
  audioUrl: 'https://airdox.info/api/audio/01%20REC-2026-05-24.mp3',
};
