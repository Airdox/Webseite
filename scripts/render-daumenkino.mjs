import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';

const WORKSPACE_DIR = process.cwd();
const TEMP_DIR = path.join(WORKSPACE_DIR, 'scripts', 'temp_frames');

const DEFAULT_CONTROLS = {
  energy: 80,
  motion: 70,
  glitch: 60,
  typography: 70,
  colorShift: 60,
  grain: 30,
  scanlines: 40,
  depth: 50,
  cameraPush: 40,
  waveform: 60,
  strobe: 50,
  density: 60,
};

const FORMAT_SIZE = {
  square: { width: 800, height: 800 },
  reel: { width: 720, height: 1280 },
  story: { width: 720, height: 1280 },
};

const SCORE_KEYS = {
  motionEnergy: ['energy', 'motion', 'strobe'],
  audioLink: ['waveform', 'energy'],
  firstFrame: ['typography', 'colorShift', 'density'],
  surprise: ['glitch', 'depth', 'cameraPush'],
};

const GRAFFITI_STYLE_LABELS = {
  wildstyle: 'Wildstyle',
  throwup: 'Throw-Up',
  chrome_3d: 'Chrome 3D',
  stencil: 'Stencil',
  marker_tag: 'Marker Tag',
  drip_paint: 'Drip Paint',
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const norm = (value) => clamp(value) / 100;
const slugify = (value) => String(value || 'design')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .slice(0, 64) || 'design';

function parsePayload() {
  const fallbackStyle = process.argv[2] || 'flicker';
  if (!process.argv[3]) {
    return {
      style: fallbackStyle,
      fps: 12,
      format: 'square',
      seed: 2482,
      setId: 'LIVE SET MAY 2026',
      markText: 'AIRDOX',
      markStyle: 'graffiti',
      photoshopAction: 'script_and_launch',
      graffitiStyles: ['wildstyle', 'throwup', 'chrome_3d'],
      controls: DEFAULT_CONTROLS,
    };
  }

  try {
    const raw = Buffer.from(process.argv[3], 'base64').toString('utf8');
    const payload = JSON.parse(raw);
    return {
      ...payload,
      style: payload.style || fallbackStyle,
      fps: clamp(payload.fps || 12, 8, 24),
      format: payload.format || 'square',
      seed: payload.seed || 2482,
      setId: payload.setId || 'LIVE SET MAY 2026',
      markText: payload.markText || 'AIRDOX',
      markStyle: payload.markStyle || 'graffiti',
      photoshopAction: payload.photoshopAction || 'script_and_launch',
      graffitiStyles: Array.isArray(payload.graffitiStyles) && payload.graffitiStyles.length
        ? payload.graffitiStyles
        : ['wildstyle', 'throwup', 'chrome_3d'],
      outputSlug: slugify(payload.outputSlug || `${payload.presetId || payload.style || fallbackStyle}_${payload.markText || 'mark'}`),
      controls: {
        ...DEFAULT_CONTROLS,
        ...(payload.controls || {}),
      },
    };
  } catch (error) {
    console.warn(`[WARN] Payload konnte nicht gelesen werden: ${error.message}`);
    return {
      style: fallbackStyle,
      fps: 12,
      format: 'square',
      seed: 2482,
      setId: 'LIVE SET MAY 2026',
      markText: 'AIRDOX',
      markStyle: 'graffiti',
      photoshopAction: 'script_and_launch',
      graffitiStyles: ['wildstyle', 'throwup', 'chrome_3d'],
      controls: DEFAULT_CONTROLS,
    };
  }
}

function getStyleName(style) {
  return {
    flicker: 'Beat-Flicker Type Drop',
    glitch: 'RGB Glitch Signal',
    liquid: 'Liquid Parallax',
    neon: 'Neon Depth Scan',
    daumenkino: 'Daumenkino Idea Lab',
  }[style] || style;
}

function averageControl(controls, keys) {
  return Math.round(keys.reduce((sum, key) => sum + clamp(controls[key]), 0) / keys.length);
}

function getScore(controls) {
  const motionEnergy = averageControl(controls, SCORE_KEYS.motionEnergy);
  const audioLink = averageControl(controls, SCORE_KEYS.audioLink);
  const firstFrame = averageControl(controls, SCORE_KEYS.firstFrame);
  const surprise = averageControl(controls, SCORE_KEYS.surprise);
  const total = Math.round((motionEnergy + audioLink + firstFrame + surprise) / 4);
  return { motionEnergy, audioLink, firstFrame, surprise, total };
}

function buildHandoffNotes(options, score) {
  const notes = [];
  if (options.controls.typography >= 70) notes.push('Kinetic Type ist stark genug fuer einen stoppenden First Frame.');
  if (options.controls.waveform >= 60) notes.push('Waveform ist sichtbar mit Beat-Energie gekoppelt.');
  if (options.controls.depth >= 70) notes.push('Parallax-Tiefe erzeugt eine klare Vorder-/Hintergrundstaffelung.');
  if (options.controls.glitch >= 70) notes.push('Glitch-Bursts sind dominant; vor Posting auf Lesbarkeit pruefen.');
  if (score.total < 65) notes.push('Score unter 65: als Draft behandeln und vor Upload nacharbeiten.');
  return notes.length ? notes : ['Ausgewogene Variante, bereit fuer Designer-Review und Manni-Handoff.'];
}

function getGraffitiPrompt(styleId, markText, controls) {
  const label = GRAFFITI_STYLE_LABELS[styleId] || styleId;
  const base = `${label} fuer "${markText || 'AIRDOX'}"`;
  const shared = `Energy ${controls.energy}, Glitch ${controls.glitch}, Depth ${controls.depth}, Typography ${controls.typography}.`;
  return {
    wildstyle: `${base}: verschachtelte Buchstaben, Pfeile, Cutbacks, Cyan/Lime Highlights, lesbar trotz Komplexitaet. ${shared}`,
    throwup: `${base}: runde Bubble-Letter, dicke Outline, schnelle Fill-Flaechen, hoher Kontrast. ${shared}`,
    chrome_3d: `${base}: metallischer Chrome-Fill, harte 3D-Extrusion, dunkle Schattenkante, Club-Poster-Look. ${shared}`,
    stencil: `${base}: Schablonenformen, harte Negativraeume, Plakat-Kante, sauberer First Frame. ${shared}`,
    marker_tag: `${base}: roher Markerzug, trockene Kanten, schnelle Handbewegung, bewusst unperfekt. ${shared}`,
    drip_paint: `${base}: nasse Farbe, Tropfen, Overspray, kontrollierte Spruehnebel-Kante. ${shared}`,
  }[styleId] || `${base}: Graffiti-Variante. ${shared}`;
}

function buildPhotoshopVariantScript(options, score, handoffPath) {
  const mark = String(options.markText || 'AIRDOX').replace(/"/g, '\\"').slice(0, 30);
  const styles = options.graffitiStyles || ['wildstyle', 'throwup', 'chrome_3d'];
  const lines = [
    'var variantRoot = doc.layerSets.add();',
    'variantRoot.name = "Graffiti Variants - Script Generated";',
  ];

  styles.forEach((styleId, index) => {
    const label = GRAFFITI_STYLE_LABELS[styleId] || styleId;
    const prompt = getGraffitiPrompt(styleId, mark, options.controls).replace(/"/g, '\\"');
    const y = 120 + index * 82;
    const size = styleId === 'marker_tag' ? 58 : styleId === 'stencil' ? 64 : 74;
    const fill = styleId === 'chrome_3d' ? '210,220,225' : styleId === 'throwup' ? '154,223,107' : styleId === 'drip_paint' ? '0,240,255' : '245,248,255';
    const shadow = styleId === 'chrome_3d' ? '40,46,54' : styleId === 'stencil' ? '5,6,8' : '255,0,170';
    lines.push(
      `var group${index} = variantRoot.layerSets.add();`,
      `group${index}.name = ${JSON.stringify(`${String(index + 1).padStart(2, '0')} ${label} - ${mark}`)};`,
      `var shadow${index} = group${index}.artLayers.add();`,
      `shadow${index}.kind = LayerKind.TEXT;`,
      `shadow${index}.name = ${JSON.stringify(`${label} shadow/depth`)};`,
      `shadow${index}.textItem.contents = ${JSON.stringify(mark)};`,
      `shadow${index}.textItem.size = ${size};`,
      `shadow${index}.textItem.position = [${72 + index * 10}, ${y + 14}];`,
      `var shadowColor${index} = new SolidColor(); shadowColor${index}.rgb.red = ${shadow.split(',')[0]}; shadowColor${index}.rgb.green = ${shadow.split(',')[1]}; shadowColor${index}.rgb.blue = ${shadow.split(',')[2]};`,
      `shadow${index}.textItem.color = shadowColor${index};`,
      `var main${index} = group${index}.artLayers.add();`,
      `main${index}.kind = LayerKind.TEXT;`,
      `main${index}.name = ${JSON.stringify(`${label} main letters`)};`,
      `main${index}.textItem.contents = ${JSON.stringify(mark)};`,
      `main${index}.textItem.size = ${size};`,
      `main${index}.textItem.position = [64, ${y}];`,
      `var mainColor${index} = new SolidColor(); mainColor${index}.rgb.red = ${fill.split(',')[0]}; mainColor${index}.rgb.green = ${fill.split(',')[1]}; mainColor${index}.rgb.blue = ${fill.split(',')[2]};`,
      `main${index}.textItem.color = mainColor${index};`,
      `var note${index} = group${index}.artLayers.add();`,
      `note${index}.kind = LayerKind.TEXT;`,
      `note${index}.name = ${JSON.stringify(`${label} Auftrag / Prompt`)};`,
      `note${index}.textItem.contents = ${JSON.stringify(prompt)};`,
      `note${index}.textItem.size = 18;`,
      `note${index}.textItem.position = [64, ${y + 54}];`,
      `note${index}.opacity = 74;`,
      `group${index}.visible = ${index === 0 ? 'true' : 'false'};`,
    );
  });

  lines.push(
    'var controlLayer = variantRoot.artLayers.add();',
    'controlLayer.kind = LayerKind.TEXT;',
    'controlLayer.name = "README - Varianten togglen";',
    `controlLayer.textItem.contents = ${JSON.stringify([
      'Diese Gruppen wurden vom AIRDOX Designer-Agenten erzeugt.',
      `Score ${score.total}/100`,
      'Pro Gruppe liegt ein eigener Graffiti-Auftrag mit Text-, Schatten- und Prompt-Ebene.',
      'Sichtbarkeit der Varianten-Gruppen togglen, beste Richtung ausarbeiten, dann final exportieren.',
      `Handoff: ${handoffPath}`,
    ].join('\r'))};`,
    'controlLayer.textItem.size = 20;',
    'controlLayer.textItem.position = [36, 36];',
  );

  return lines;
}

function buildBars(controls, frameIndex) {
  const amount = 8 + Math.round(norm(controls.waveform) * 18);
  return Array.from({ length: amount }).map((_, index) => {
    const pulse = Math.sin((frameIndex + 1) * (index + 2) * 0.72);
    const height = 14 + Math.round((0.5 + pulse * 0.5) * (28 + controls.energy * 0.72));
    return `<span style="height:${height}px"></span>`;
  }).join('');
}

function getGraffitiLogoSvg({ visibleLength, color, rgb, glitch, density, style }) {
  const letters = [
    {
      key: 'A',
      shapes: [
        '<path d="M18 132 L64 16 L108 132 L82 126 L73 101 L49 104 L39 132 Z" />',
        '<path d="M54 79 L68 78 L61 48 Z" class="cut" />',
        '<path d="M24 130 L9 152 L48 137 Z" class="slash" />',
      ],
    },
    {
      key: 'I',
      shapes: [
        '<path d="M126 28 L184 16 L178 44 L161 45 L151 112 L176 108 L170 134 L108 145 L115 116 L132 115 L142 49 L119 53 Z" />',
        '<path d="M137 21 L188 2 L176 19 Z" class="slash" />',
      ],
    },
    {
      key: 'R',
      shapes: [
        '<path d="M202 133 L214 20 L268 14 Q307 18 300 54 Q296 78 266 89 L302 135 L264 130 L239 95 L234 137 Z" />',
        '<path d="M241 42 L237 70 L260 68 Q277 65 279 53 Q281 39 262 38 Z" class="cut" />',
        '<path d="M273 83 L315 78 L292 100 Z" class="slash" />',
      ],
    },
    {
      key: 'D',
      shapes: [
        '<path d="M318 134 L326 19 L383 16 Q442 21 439 72 Q435 127 377 136 Z" />',
        '<path d="M357 43 L352 108 L378 105 Q405 101 407 73 Q410 43 382 40 Z" class="cut" />',
      ],
    },
    {
      key: 'O',
      shapes: [
        '<path d="M461 130 Q424 112 431 67 Q438 21 486 15 Q533 9 548 48 Q562 89 531 118 Q501 145 461 130 Z" />',
        '<path d="M471 100 Q455 90 459 68 Q462 45 487 41 Q512 38 520 57 Q529 80 511 96 Q493 112 471 100 Z" class="cut" />',
      ],
    },
    {
      key: 'X',
      shapes: [
        '<path d="M548 134 L587 72 L562 23 L598 18 L612 48 L638 13 L678 18 L628 76 L662 136 L624 132 L604 99 L580 139 Z" />',
        '<path d="M548 43 L526 24 L568 30 Z" class="slash" />',
        '<path d="M650 127 L694 151 L636 141 Z" class="slash" />',
      ],
    },
  ];
  const visibleLetters = letters.slice(0, visibleLength);
  const spread = Math.round(2 + density * 0.12);
  const jitter = Math.round(glitch * 8);
  const stroke = style === 'daumenkino' ? 7 : 5;

  return `<svg class="graffiti-logo" viewBox="0 0 700 170" role="img" aria-label="AIRDOX graffiti mark">
    <defs>
      <filter id="roughen">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${spread}" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="${spread}" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="paint-shadow">
        <feDropShadow dx="${rgb * 0.18}" dy="0" stdDeviation="${1 + glitch * 2}" flood-color="#00f0ff" flood-opacity="0.72"/>
        <feDropShadow dx="${rgb * -0.18}" dy="0" stdDeviation="${1 + glitch * 2}" flood-color="#ff00aa" flood-opacity="0.58"/>
        <feDropShadow dx="0" dy="${4 + density * 0.05}" stdDeviation="2" flood-color="#000000" flood-opacity="0.65"/>
      </filter>
    </defs>
    <g class="graffiti-shadow" transform="translate(${jitter}, 5)">${visibleLetters.map((letter) => `<g>${letter.shapes.join('')}</g>`).join('')}</g>
    <g class="graffiti-main" filter="url(#paint-shadow) url(#roughen)" style="--logo-color:${color}; --logo-stroke:${stroke}px;">
      ${visibleLetters.map((letter, index) => {
        const y = index % 2 === 0 ? -2 : 4;
        const r = (index - 2) * 1.6;
        return `<g transform="translate(0 ${y}) rotate(${r} ${70 + index * 105} 85)">${letter.shapes.join('')}</g>`;
      }).join('')}
    </g>
  </svg>`;
}

function getFrameHtml(frameIndex, options) {
  const { style, controls, seed, setId, format, markStyle, markText } = options;
  const size = FORMAT_SIZE[format] || FORMAT_SIZE.square;
  const word = 'AIRDOX';
  const visibleLength = style === 'flicker'
    ? Math.min(word.length, Math.max(1, frameIndex + 1))
    : word.length;
  const beat = frameIndex === 0 || frameIndex === 4;
  const energy = norm(controls.energy);
  const motion = norm(controls.motion);
  const glitch = norm(controls.glitch);
  const colorShift = norm(controls.colorShift);
  const strobe = norm(controls.strobe);
  const depth = norm(controls.depth);
  const typography = norm(controls.typography);
  const density = norm(controls.density);
  const scanlines = norm(controls.scanlines);
  const grain = norm(controls.grain);
  const cameraPush = norm(controls.cameraPush);
  const kickScale = beat ? 1 + (energy * 0.42) : 1 + (motion * 0.08 * Math.sin(frameIndex));
  const typeScale = 0.9 + (typography * 0.34) + (beat ? energy * 0.18 : 0);
  const skew = Math.round((frameIndex % 2 === 0 ? 1 : -1) * (8 + glitch * 28));
  const rotate = Math.round(Math.sin(frameIndex + seed) * (4 + motion * 10));
  const rgb = Math.round(4 + colorShift * 34 + glitch * frameIndex * 3);
  const flash = beat && strobe > 0.35;
  const bg = flash && style === 'flicker' ? '#f5f8ff' : '#050608';
  const fg = flash && style === 'flicker' ? '#050608' : '#f5f8ff';
  const hoodieOpacity = style === 'daumenkino' ? 0.56 + depth * 0.28 : 0;
  const polkaOpacity = style === 'daumenkino' ? 0.16 + density * 0.28 : 0.04 + density * 0.1;
  const frameLabel = setId.replace(/[-_]/g, ' ').slice(0, 26).toUpperCase();
  const safeMarkText = String(markText || 'AIRDOX').slice(0, 18).toUpperCase();
  const logo = markStyle === 'graffiti' ? getGraffitiLogoSvg({
    visibleLength,
    color: fg,
    rgb,
    glitch,
    density: controls.density,
    style,
  }) : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>AIRDOX Design Frame ${frameIndex}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      width: ${size.width}px;
      height: ${size.height}px;
      overflow: hidden;
      background: ${bg};
      color: ${fg};
      font-family: "Space Grotesk", Arial, sans-serif;
      display: grid;
      place-items: center;
      position: relative;
    }

    body::before {
      content: "";
      position: absolute;
      inset: -16%;
      background:
        radial-gradient(circle at 50% 38%, rgba(0,240,255,${0.1 + colorShift * 0.22}), transparent 34%),
        radial-gradient(circle at 48% 42%, rgba(154,223,107,${0.07 + energy * 0.18}), transparent 28%),
        repeating-radial-gradient(circle at 50% 42%, rgba(245,248,255,${polkaOpacity}) 0 7px, transparent 8px 34px);
      transform: scale(${1 + depth * 0.24 + cameraPush * frameIndex * 0.012}) rotate(${frameIndex * (2 + motion * 8)}deg);
      filter: saturate(${1 + colorShift * 1.7}) contrast(${1 + density * 0.55});
      opacity: ${style === 'liquid' ? 0.7 : 1};
    }

    body::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        linear-gradient(rgba(245,248,255,${scanlines * 0.13}) 50%, rgba(5,6,8,0) 50%),
        radial-gradient(circle, transparent 0 62%, rgba(0,0,0,0.58) 100%);
      background-size: 100% ${Math.max(3, Math.round(10 - scanlines * 6))}px, 100% 100%;
      opacity: ${0.24 + scanlines * 0.56};
      pointer-events: none;
      mix-blend-mode: screen;
      z-index: 8;
    }

    .stage {
      width: 100%;
      height: 100%;
      position: relative;
      display: grid;
      place-items: center;
      transform: scale(${kickScale});
    }

    .spray {
      position: absolute;
      width: ${Math.round(size.width * (0.58 + depth * 0.42))}px;
      height: ${Math.round(size.width * (0.58 + depth * 0.42))}px;
      border-radius: 50%;
      background: conic-gradient(from ${frameIndex * 28}deg, rgba(0,240,255,0.8), rgba(255,0,170,0.45), rgba(154,223,107,0.65), rgba(0,240,255,0.8));
      filter: blur(${26 + grain * 45}px);
      opacity: ${0.08 + colorShift * 0.28 + energy * 0.12};
      transform: translate(${Math.sin(frameIndex + seed) * 52 * motion}px, ${Math.cos(frameIndex) * 42 * motion}px);
      z-index: 1;
    }

    .hoodie {
      position: absolute;
      width: ${Math.round(size.width * 0.34)}px;
      height: ${Math.round(size.height * 0.44)}px;
      bottom: ${Math.round(size.height * 0.18)}px;
      left: 50%;
      transform: translateX(-50%) scale(${1 + cameraPush * frameIndex * 0.018});
      opacity: ${hoodieOpacity};
      z-index: 2;
      filter: grayscale(1) contrast(${1.2 + density}) drop-shadow(${rgb}px 0 rgba(0,240,255,0.45)) drop-shadow(-${rgb}px 0 rgba(255,0,170,0.36));
    }

    .hoodie::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 42% 42% 28% 28%;
      background:
        radial-gradient(circle at 42% 24%, #d6d6d6 0 5%, transparent 6%),
        radial-gradient(circle at 58% 24%, #d6d6d6 0 4%, transparent 5%),
        radial-gradient(ellipse at 50% 18%, #111 0 22%, transparent 23%),
        linear-gradient(180deg, #2d3338 0 26%, #11161a 27% 100%);
      clip-path: polygon(33% 2%, 66% 2%, 78% 22%, 74% 100%, 25% 100%, 21% 22%);
    }

    .waveform {
      position: absolute;
      left: ${format === 'square' ? '7%' : '8%'};
      right: ${format === 'square' ? '7%' : '8%'};
      bottom: ${format === 'square' ? '13%' : '19%'};
      min-height: 82px;
      display: flex;
      align-items: end;
      justify-content: center;
      gap: ${Math.max(4, Math.round(12 - density * 7))}px;
      opacity: ${0.2 + norm(controls.waveform) * 0.78};
      z-index: 5;
    }

    .waveform span {
      width: ${Math.max(3, Math.round(10 - density * 5))}px;
      border-radius: 999px 999px 2px 2px;
      background: linear-gradient(180deg, #00f0ff, #9adf6b);
      box-shadow: 0 0 18px rgba(0,240,255,0.4);
    }

    .type {
      position: relative;
      z-index: 6;
      display: grid;
      place-items: center;
      gap: 18px;
      text-align: center;
      transform: scale(${typeScale}) skewX(${skew}deg) rotate(${rotate}deg);
      filter: drop-shadow(${rgb}px 0 rgba(0,240,255,${0.24 + glitch * 0.46})) drop-shadow(-${rgb}px 0 rgba(255,0,170,${0.18 + glitch * 0.42}));
    }

    .graffiti-logo {
      width: ${format === 'square' ? '112%' : '124%'};
      max-width: none;
      overflow: visible;
    }

    .text-mark {
      font-size: ${markStyle === 'minimal' ? '76px' : '118px'};
      line-height: 0.9;
      font-weight: ${markStyle === 'minimal' ? 700 : 800};
      letter-spacing: ${markStyle === 'minimal' ? '0.08em' : '0'};
      color: ${fg};
      text-transform: uppercase;
      border: ${markStyle === 'block' ? `6px solid ${fg}` : '0'};
      padding: ${markStyle === 'block' ? '14px 22px' : '0'};
      background: ${markStyle === 'block' ? 'rgba(5,6,8,0.22)' : 'transparent'};
      box-shadow: ${markStyle === 'block' ? `12px 12px 0 rgba(154,223,107,${0.25 + colorShift * 0.35})` : 'none'};
    }

    .graffiti-main path {
      fill: var(--logo-color);
      stroke: rgba(5, 6, 8, 0.96);
      stroke-width: var(--logo-stroke);
      stroke-linejoin: round;
      paint-order: stroke fill;
    }

    .graffiti-main .cut {
      fill: #050608;
      stroke: rgba(245,248,255,0.18);
      stroke-width: 2px;
    }

    .graffiti-main .slash {
      fill: #9adf6b;
      stroke: rgba(5, 6, 8, 0.9);
      stroke-width: 4px;
    }

    .graffiti-shadow path {
      fill: rgba(0, 240, 255, 0.18);
      stroke: rgba(255, 0, 170, 0.2);
      stroke-width: 7px;
    }

    .type span {
      max-width: 78%;
      font-size: ${Math.round(14 + typography * 18)}px;
      font-weight: 800;
      letter-spacing: 0;
      color: #9adf6b;
      text-transform: uppercase;
      text-shadow: 0 3px 18px rgba(0,0,0,0.68);
    }

    .glitch-slice {
      position: absolute;
      left: 0;
      right: 0;
      top: ${Math.round((14 + frameIndex * 9) % 76)}%;
      height: ${Math.round(18 + glitch * 90)}px;
      background: rgba(0,240,255,${glitch * 0.28});
      transform: translateX(${Math.sin(frameIndex) * glitch * 90}px);
      box-shadow: 0 0 28px rgba(0,240,255,0.42);
      opacity: ${glitch > 0.2 ? 1 : 0};
      z-index: 4;
    }

    .data {
      position: absolute;
      left: ${format === 'square' ? '34px' : '42px'};
      right: ${format === 'square' ? '34px' : '42px'};
      top: ${format === 'square' ? '28px' : '52px'};
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
      font-weight: 800;
      color: rgba(245,248,255,0.64);
      z-index: 7;
    }

    .safe {
      position: absolute;
      inset: ${format === 'square' ? '30px' : '92px 42px 146px'};
      border: 1px solid rgba(154,223,107,0.18);
      border-radius: 18px;
      z-index: 9;
      opacity: ${format === 'square' ? 0.18 : 0.42};
    }
  </style>
</head>
<body>
  <div class="stage">
    <div class="spray"></div>
    <div class="hoodie"></div>
    <div class="glitch-slice"></div>
    <div class="waveform">${buildBars(controls, frameIndex)}</div>
    <div class="type">
      ${markStyle === 'none' ? '' : (markStyle === 'graffiti' ? logo : `<strong class="text-mark">${safeMarkText}</strong>`)}
      <span>${frameLabel}</span>
    </div>
    <div class="data">
      <span>SEED ${seed}</span>
      <span>${getStyleName(style).toUpperCase()}</span>
      <span>FRAME ${String(frameIndex + 1).padStart(2, '0')}</span>
    </div>
    <div class="safe"></div>
  </div>
</body>
</html>`;
}

function runCmd(file, args) {
  return new Promise((resolve, reject) => {
    execFile(file, args, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}\n${stderr}`;
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function main() {
  const options = parsePayload();
  const size = FORMAT_SIZE[options.format] || FORMAT_SIZE.square;
  const outputBase = options.outputSlug || slugify(`${options.presetId || options.style}_${options.markText || 'mark'}`);
  const outputGifPath = path.join(WORKSPACE_DIR, 'release', `${outputBase}.gif`);
  const outputMp4Path = path.join(WORKSPACE_DIR, 'release', `${outputBase}.mp4`);
  const manifestPath = path.join(WORKSPACE_DIR, 'release', `${outputBase}.manifest.json`);
  const handoffPath = path.join(WORKSPACE_DIR, 'release', `${outputBase}.handoff.md`);
  const photoshopFramePath = path.join(WORKSPACE_DIR, 'release', `${outputBase}.photoshop-frame.png`);
  const photoshopScriptPath = path.join(WORKSPACE_DIR, 'release', `${outputBase}.photoshop-setup.jsx`);

  console.log('=== AIRDOX Daumenkino Generator ===');
  console.log(`Stil: ${getStyleName(options.style)}`);
  console.log(`Format: ${options.format} ${size.width}x${size.height}, FPS: ${options.fps}`);
  console.log(`Controls: energy=${options.controls.energy}, motion=${options.controls.motion}, glitch=${options.controls.glitch}, type=${options.controls.typography}`);

  await fs.mkdir(TEMP_DIR, { recursive: true });

  console.log('1. Generiere 8 parametrisierte HTML-Einzel-Frames...');
  for (let index = 0; index < 8; index += 1) {
    const html = getFrameHtml(index, options);
    await fs.writeFile(path.join(TEMP_DIR, `frame_${index}.html`), html, 'utf8');
  }

  console.log(`2. Starte Headless-Chromium und fotografiere Frames in ${size.width}x${size.height}px...`);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize(size);

  for (let index = 0; index < 8; index += 1) {
    const frameHtmlPath = path.join(TEMP_DIR, `frame_${index}.html`);
    await page.goto(`file://${frameHtmlPath}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.join(TEMP_DIR, `frame_${index}.png`),
      type: 'png',
    });
    process.stdout.write(`   [Frame ${index}/7] fotografiert.\n`);
  }
  await browser.close();

  console.log('3. Kompiliere GIF & MP4 via FFmpeg...');

  try { await fs.unlink(outputGifPath); } catch {}
  try { await fs.unlink(outputMp4Path); } catch {}
  try { await fs.unlink(manifestPath); } catch {}
  try { await fs.unlink(handoffPath); } catch {}
  try { await fs.unlink(photoshopFramePath); } catch {}
  try { await fs.unlink(photoshopScriptPath); } catch {}

  const framePattern = path.join(TEMP_DIR, 'frame_%d.png');
  await runCmd('ffmpeg', [
    '-y',
    '-framerate',
    String(options.fps),
    '-i',
    framePattern,
    '-vf',
    `scale=${size.width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
    outputGifPath,
  ]);
  console.log('   GIF kompiliert.');

  await runCmd('ffmpeg', [
    '-y',
    '-framerate',
    String(options.fps),
    '-i',
    framePattern,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-vf',
    `scale=${size.width}:${size.height}`,
    outputMp4Path,
  ]);
  console.log('   MP4 kompiliert.');

  await fs.copyFile(path.join(TEMP_DIR, 'frame_0.png'), photoshopFramePath);

  const [gifStat, mp4Stat] = await Promise.all([fs.stat(outputGifPath), fs.stat(outputMp4Path)]);
  const score = getScore(options.controls);
  const manifest = {
    createdAt: new Date().toISOString(),
    agent: 'Designer',
    packageId: `${outputBase}-${Date.now()}`,
    setId: options.setId,
    presetId: options.presetId || '',
    style: options.style,
    styleLabel: getStyleName(options.style),
    markText: options.markText,
    markStyle: options.markStyle,
    photoshopAction: options.photoshopAction || 'script_and_launch',
    graffitiStyles: options.graffitiStyles || [],
    mode: options.mode || 'auto',
    format: options.format,
    size,
    fps: options.fps,
    seed: options.seed,
    controls: options.controls,
    score,
    prompt: options.prompt || '',
    handoffNotes: buildHandoffNotes(options, score),
    files: {
      gif: outputGifPath,
      mp4: outputMp4Path,
      manifest: manifestPath,
      handoff: handoffPath,
      photoshopFrame: photoshopFramePath,
      photoshopScript: options.photoshopAction === 'prompt_only' ? '' : photoshopScriptPath,
    },
    fileSizes: {
      gifBytes: gifStat.size,
      mp4Bytes: mp4Stat.size,
    },
  };

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  if (options.photoshopAction !== 'prompt_only') {
    await fs.writeFile(photoshopScriptPath, [
    '#target photoshop',
    'app.displayDialogs = DialogModes.NO;',
    `var sourceFile = new File(${JSON.stringify(photoshopFramePath.replace(/\\/g, '/'))});`,
    `var handoffFile = new File(${JSON.stringify(handoffPath.replace(/\\/g, '/'))});`,
    'var doc = app.open(sourceFile);',
    `doc.info.title = ${JSON.stringify(`AIRDOX ${manifest.styleLabel} - ${manifest.setId}`)};`,
    `doc.info.caption = ${JSON.stringify((options.prompt || '').slice(0, 1800))};`,
    `doc.guides.add(Direction.VERTICAL, UnitValue(${Math.round(size.width * 0.08)}, "px"));`,
    `doc.guides.add(Direction.VERTICAL, UnitValue(${Math.round(size.width * 0.92)}, "px"));`,
    `doc.guides.add(Direction.HORIZONTAL, UnitValue(${Math.round(size.height * 0.08)}, "px"));`,
    `doc.guides.add(Direction.HORIZONTAL, UnitValue(${Math.round(size.height * 0.92)}, "px"));`,
    'var textLayer = doc.artLayers.add();',
    'textLayer.kind = LayerKind.TEXT;',
    'textLayer.name = "Designer Notes";',
    `textLayer.textItem.contents = ${JSON.stringify([
      'Designer Finish',
      `Score ${score.total}/100`,
      'Refine crop, typography, contrast, safe area.',
      `Handoff: ${handoffPath}`,
    ].join('\\r'))};`,
    'textLayer.textItem.size = 22;',
    'textLayer.textItem.position = [36, 52];',
    ...buildPhotoshopVariantScript(options, score, handoffPath),
    'doc.activeLayer = textLayer;',
  ].join('\n'), 'utf8');
  }
  await fs.writeFile(handoffPath, [
    `# AIRDOX Designer Handoff - ${manifest.styleLabel}`,
    '',
    `Set: ${manifest.setId}`,
    `Format: ${manifest.format} ${size.width}x${size.height}, ${manifest.fps} FPS`,
    `Score: ${score.total}/100`,
    '',
    '## Dateien',
    `- GIF: ${outputGifPath}`,
    `- MP4: ${outputMp4Path}`,
    `- Manifest: ${manifestPath}`,
    `- Photoshop Frame: ${photoshopFramePath}`,
    `- Photoshop Setup JSX: ${options.photoshopAction === 'prompt_only' ? 'nicht erzeugt (Prompt-only)' : photoshopScriptPath}`,
    '',
    '## Notizen',
    ...manifest.handoffNotes.map((note) => `- ${note}`),
    '',
    '## Photoshop Script Import',
    'Primaerer Weg: Photoshop ueber das JSX-Skript starten. Das Skript oeffnet den Hero-Frame, setzt Metadaten, Safe-Area-Guides, eine Designer-Notiz und Graffiti-Varianten-Gruppen.',
    '',
    `Aktion: ${options.photoshopAction}`,
    `Skript: ${options.photoshopAction === 'prompt_only' ? 'nicht erzeugt' : photoshopScriptPath}`,
    `Graffiti-Styles: ${(options.graffitiStyles || []).map((entry) => GRAFFITI_STYLE_LABELS[entry] || entry).join(', ') || 'Standard'}`,
    '',
    '## Graffiti-Auftraege',
    ...(options.graffitiStyles || []).map((entry) => `- ${getGraffitiPrompt(entry, options.markText, options.controls)}`),
    '',
    '## Prompt Vorlage',
    'Falls der Skriptimport nicht genutzt werden soll, diese Vorlage manuell in Photoshop/Generative Fill/Design-Briefing verwenden:',
    '',
    [
      `AIRDOX ${manifest.styleLabel} fuer ${manifest.setId}.`,
      `Format ${manifest.format} ${size.width}x${size.height}, ${manifest.fps} FPS, Seed ${manifest.seed}.`,
      `Look: Motion ${options.controls.motion}, Energy ${options.controls.energy}, Glitch ${options.controls.glitch}, Typography ${options.controls.typography}, Depth ${options.controls.depth}, Waveform ${options.controls.waveform}.`,
      `Marke: ${options.markStyle === 'none' ? 'keine feste Marke' : `${options.markText} als ${options.markStyle}`}.`,
      'Ziel: professionelles Club-Social-Asset mit starkem First Frame, lesbarer AIRDOX-Typo, sauberer Safe Area und exportfaehigem Loop-Handoff.',
    ].join(' '),
    '',
    '## Brief',
    manifest.prompt || '(kein Brief uebergeben)',
    '',
  ].join('\n'), 'utf8');
  console.log(`   Manifest geschrieben: ${manifestPath}`);
  console.log(`   Handoff geschrieben: ${handoffPath}`);
  console.log(`   Photoshop-Handoff geschrieben: ${photoshopFramePath}`);
  if (options.photoshopAction !== 'prompt_only') console.log(`   Photoshop-JSX geschrieben: ${photoshopScriptPath}`);

  try {
    const files = await fs.readdir(TEMP_DIR);
    await Promise.all(files.map((file) => fs.unlink(path.join(TEMP_DIR, file))));
    await fs.rmdir(TEMP_DIR);
  } catch {}

  console.log('');
  console.log('DAUMENKINO RENDER SUCCESSFUL');
  console.log(`Loopable GIF: ${outputGifPath}`);
  console.log(`Loopable MP4: ${outputMp4Path}`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Handoff: ${handoffPath}`);
  console.log(`Photoshop Frame: ${photoshopFramePath}`);
  console.log(`Photoshop JSX: ${options.photoshopAction === 'prompt_only' ? 'nicht erzeugt' : photoshopScriptPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
