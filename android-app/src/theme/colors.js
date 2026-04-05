// AIRDOX Design System – Ported from global.css CSS Variables
// All colors, spacing, typography, and effects as JS constants

export const Colors = {
  // Backgrounds
  bgVoid: '#000000',
  bgDark: '#050505',
  bgCard: '#0a0a0a',
  bgElevated: '#111111',
  bgOverlay: 'rgba(0, 0, 0, 0.85)',

  // Neon Palette
  neonCyan: '#00f5ff',
  neonPink: '#ff00aa',
  neonPurple: '#a855f7',
  neonYellow: '#fbbf24',
  neonGreen: '#00ff88',

  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  textDim: 'rgba(255, 255, 255, 0.2)',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderMedium: 'rgba(255, 255, 255, 0.1)',
  borderGlow: 'rgba(0, 245, 255, 0.3)',
};

export const Gradients = {
  primary: ['#ff00aa', '#00f5ff'],
  glow: ['rgba(255, 0, 170, 0.4)', 'rgba(0, 245, 255, 0.4)'],
  dark: ['#0a0a0a', '#000000'],
  hero: ['rgba(0, 0, 0, 0.0)', 'rgba(0, 0, 0, 0.6)', '#000000'],
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  section: 80,
};

export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  hero: 72,
};

export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
};

export const Fonts = {
  heading: 'System', // Will use system font; can replace with custom
  body: 'System',
  mono: 'monospace',
};
