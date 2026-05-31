// ── Design Agent Constants & Utilities ──────────────────────────
// Shared by all wizard phases (Setup, Studio, Export).

export const CREATIVE_PRESETS = [
  {
    id: 'signal_system',
    label: 'Signal System',
    style: 'glitch',
    intent: 'Audio-reactive Equalizer, Data Burn-In, harte Club-Signale.',
    controls: {
      energy: 84, motion: 72, glitch: 68, typography: 64,
      colorShift: 58, grain: 36, scanlines: 54, depth: 42,
      cameraPush: 34, waveform: 82, strobe: 42, density: 58,
    },
  },
  {
    id: 'club_still_parallax',
    label: 'Club Still Parallax',
    style: 'liquid',
    intent: 'Inszenierter Still, Tiefenebenen, langsamer Push und Lichtklappen.',
    controls: {
      energy: 58, motion: 66, glitch: 20, typography: 42,
      colorShift: 48, grain: 44, scanlines: 24, depth: 86,
      cameraPush: 76, waveform: 44, strobe: 18, density: 38,
    },
  },
  {
    id: 'glitch_type_drop',
    label: 'Glitch Type Drop',
    style: 'flicker',
    intent: 'Kinetic Type, Beat-Hits, Strobe-Frames und Drop-Moment.',
    controls: {
      energy: 92, motion: 80, glitch: 74, typography: 88,
      colorShift: 70, grain: 28, scanlines: 46, depth: 36,
      cameraPush: 52, waveform: 66, strobe: 78, density: 72,
    },
  },
  {
    id: 'neon_depth_scan',
    label: 'Neon Depth Scan',
    style: 'neon',
    intent: 'Cyan/Lime-Lichtkante, räumlicher Scan und kontrollierte Premium-Optik.',
    controls: {
      energy: 70, motion: 58, glitch: 38, typography: 54,
      colorShift: 82, grain: 22, scanlines: 70, depth: 74,
      cameraPush: 62, waveform: 58, strobe: 34, density: 46,
    },
  },
  {
    id: 'daumenkino_idea_lab',
    label: 'Daumenkino Idea Lab',
    style: 'daumenkino',
    intent: 'Graffiti-Logo, Hoodie-Figur, RGB-Split, Posterize, Polka und Radial-Pattern.',
    controls: {
      energy: 78, motion: 70, glitch: 82, typography: 76,
      colorShift: 88, grain: 34, scanlines: 30, depth: 62,
      cameraPush: 48, waveform: 36, strobe: 58, density: 84,
    },
  },
];

// The 4 most impactful sliders shown by default in Studio phase.
export const TOP_SLIDERS = [
  { key: 'motion', label: 'Motion Strength', min: 0, max: 100 },
  { key: 'energy', label: 'Beat-Energie', min: 0, max: 100 },
  { key: 'glitch', label: 'Glitch-Burst', min: 0, max: 100 },
  { key: 'depth', label: 'Parallax-Tiefe', min: 0, max: 100 },
];

// All remaining sliders, shown when user expands "Alle Slider".
export const EXTRA_SLIDERS = [
  { key: 'cameraPush', label: 'Kamera-Push', min: 0, max: 100 },
  { key: 'strobe', label: 'Strobe-Hits', min: 0, max: 100 },
  { key: 'colorShift', label: 'Color Shift', min: 0, max: 100 },
  { key: 'grain', label: 'Film Grain', min: 0, max: 100 },
  { key: 'scanlines', label: 'Scanlines', min: 0, max: 100 },
  { key: 'typography', label: 'Kinetic Type', min: 0, max: 100 },
  { key: 'waveform', label: 'Waveform Spine', min: 0, max: 100 },
  { key: 'density', label: 'Detail-Dichte', min: 0, max: 100 },
];

export const FORMAT_OPTIONS = [
  { id: 'square', label: 'Square', detail: '800 × 800' },
  { id: 'reel', label: 'Reel', detail: '9:16 Safe Area' },
  { id: 'story', label: 'Story', detail: 'Hook Frame' },
];

export const BACKGROUND_STILL_OPTIONS = [
  { id: 'cover', label: 'Set Cover Art', detail: 'Cover-Bild des gewählten Sets' },
  { id: 'vinyl', label: 'Vinyl Still', detail: 'public/assets/airdox-vinyl.jpg' },
  { id: 'music_area', label: 'Website Music', detail: 'screenshot: desktop-music.png' },
  { id: 'flight_deck', label: 'Flight Deck UI', detail: 'screenshot: agent-system-desktop.png' },
  { id: 'custom', label: 'Eigenes Bild...', detail: 'Aus Windows Explorer wählen' },
  { id: 'none', label: 'Keine (Gradients)', detail: 'Rein parametrisches Club-Signal' },
];

export const MARK_OPTIONS = [
  { id: 'graffiti', label: 'Graffiti', detail: 'Wildstyle Outline' },
  { id: 'block', label: 'Block', detail: 'Clean Club Type' },
  { id: 'minimal', label: 'Minimal', detail: 'Schmaler Label-Look' },
  { id: 'none', label: 'Ohne', detail: 'Nur Set-Titel' },
];

export const PHOTOSHOP_SCRIPT_OPTIONS = [
  { id: 'script_and_launch', label: 'JSX + Start', detail: 'Skript erzeugen und Photoshop starten' },
  { id: 'script_only', label: 'Nur JSX', detail: 'Skript erzeugen, nicht starten' },
  { id: 'prompt_only', label: 'Prompt', detail: 'Nur Brief und Promptvorlage' },
];

export const GRAFFITI_STYLE_OPTIONS = [
  { id: 'wildstyle', label: 'Wildstyle', detail: 'verschachtelte Buchstaben, Pfeile, Cuts' },
  { id: 'throwup', label: 'Throw-Up', detail: 'runde Bubble-Formen, schnelle Fills' },
  { id: 'chrome_3d', label: 'Chrome 3D', detail: 'metallische Flaechen und harte Tiefe' },
  { id: 'stencil', label: 'Stencil', detail: 'Schablonenlook, kantig und plakativ' },
  { id: 'marker_tag', label: 'Marker Tag', detail: 'handgezogen, schnell, roh' },
  { id: 'drip_paint', label: 'Drips', detail: 'Paint-Runner, Spruehnebel, Tropfen' },
];

// ── Helpers ─────────────────────────────────────────────────────

export const getInitialControls = () => ({ ...CREATIVE_PRESETS[0].controls });

export const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const getScore = (controls) => {
  const motionEnergy = Math.round((controls.energy + controls.motion + controls.strobe) / 3);
  const audioLink = Math.round((controls.waveform + controls.energy) / 2);
  const firstFrame = Math.round((controls.typography + controls.colorShift + controls.density) / 3);
  const surprise = Math.round((controls.glitch + controls.depth + controls.cameraPush) / 3);
  const total = Math.round((motionEnergy + audioLink + firstFrame + surprise) / 4);
  return { motionEnergy, audioLink, firstFrame, surprise, total };
};

export const formatLabel = (format) =>
  FORMAT_OPTIONS.find((o) => o.id === format)?.label || format;

export const getStyleName = (style) => ({
  flicker: 'Beat-Flicker',
  glitch: 'RGB Glitch',
  liquid: 'Liquid Parallax',
  neon: 'Neon Depth Scan',
  daumenkino: 'Daumenkino Idea Lab',
}[style] || style);

export const OUTPUT_ROOT = 'D:\\webseeite-main\\release';

export const slugify = (value) =>
  String(value || 'design')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64) || 'design';

export const getOutputSlug = ({ presetId, style, markText }) =>
  slugify(`${presetId || style}_${markText || 'mark'}`);

export const getFallbackOutputs = (outputSlug) => ({
  gifPath: `${OUTPUT_ROOT}\\${outputSlug}.gif`,
  mp4Path: `${OUTPUT_ROOT}\\${outputSlug}.mp4`,
  manifestPath: `${OUTPUT_ROOT}\\${outputSlug}.manifest.json`,
  handoffPath: `${OUTPUT_ROOT}\\${outputSlug}.handoff.md`,
  photoshopFramePath: `${OUTPUT_ROOT}\\${outputSlug}.photoshop-frame.png`,
  photoshopScriptPath: `${OUTPUT_ROOT}\\${outputSlug}.photoshop-setup.jsx`,
  outputDir: OUTPUT_ROOT,
});

export const makePrompt = ({ selectedSet, selectedPreset, controls, fps, format, seed, markText, markStyle, graffitiStyles, bgSource, customBgPath }) => {
  const setLabel = selectedSet?.title || selectedSet?.id || 'AIRDOX live set';
  const brandLine = markStyle === 'none' ? 'ohne Logo-Marke' : `Marke "${markText}" als ${markStyle}`;
  const graffitiLine = graffitiStyles?.length
    ? `Photoshop-Graffiti-Auftraege: ${graffitiStyles.join(', ')}`
    : 'Photoshop-Graffiti-Auftraege: Standard';
  const bgLine = `Hintergrund: ${bgSource === 'custom' ? `Eigenes Bild (${customBgPath.split('\\').pop() || 'custom'})` : bgSource}`;
  return [
    `${selectedPreset.label} für ${setLabel}`,
    brandLine,
    graffitiLine,
    bgLine,
    `Format ${format}, ${fps} FPS, Seed ${seed}`,
    `Motion ${controls.motion}, Energy ${controls.energy}, Glitch ${controls.glitch}`,
    `Waveform ${controls.waveform}, Typography ${controls.typography}, Depth ${controls.depth}`,
    'Ziel: First Frame muss ohne Ton stoppen, Loop muss als Club-Signal funktionieren.',
  ].join(' | ');
};

export const getPipelineProgress = (message = '') => {
  if (message.includes('Pruefe Photoshop')) return 12;
  if (message.includes('Generiere 8')) return 24;
  if (message.includes('Headless-Chromium')) return 36;
  if (message.includes('Frame 0/7')) return 42;
  if (message.includes('Frame 3/7')) return 56;
  if (message.includes('Frame 7/7')) return 68;
  if (message.includes('GIF kompiliert')) return 78;
  if (message.includes('MP4 kompiliert')) return 86;
  if (message.includes('Manifest geschrieben')) return 92;
  if (message.includes('Setup-Skript')) return 96;
  if (message.includes('TRANSFER') || message.includes('SUCCESSFUL')) return 100;
  return null;
};

// ── Default config factory ──────────────────────────────────────

export const getDefaultConfig = (sets) => ({
  setId: sets?.[0]?.id || '',
  presetId: CREATIVE_PRESETS[0].id,
  style: CREATIVE_PRESETS[0].style,
  format: 'square',
  bgSource: 'cover',
  customBgPath: '',
  markText: 'AIRDOX',
  markStyle: 'graffiti',
  controls: getInitialControls(),
  fps: 12,
  seed: 2482,
  photoshopAction: 'script_and_launch',
  graffitiStyles: ['wildstyle', 'throwup', 'chrome_3d'],
});
