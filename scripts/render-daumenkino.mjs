import fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';

const WORKSPACE_DIR = 'D:\\webseeite-main';
const TEMP_DIR = path.join(WORKSPACE_DIR, 'scripts', 'temp_frames');
let OUTPUT_GIF_PATH = '';
let OUTPUT_MP4_PATH = '';

// Generates custom HTML/CSS content for a specific frame index
function getFrameHtml(frameIndex, style = 'flicker', setId = 'LIVE SET MAY 2026') {
  const word = "AIRDOX";
  
  // Letter-by-letter build-up logic (creating a dynamic frame-by-frame story)
  // Frame 0: A -> Frame 1: AI -> Frame 2: AIR -> Frame 3: AIRD -> Frame 4: AIRDO -> Frame 5-7: AIRDOX (assembled & glitched)
  let visibleLength = 6;
  if (frameIndex === 0) visibleLength = 1;
  else if (frameIndex === 1) visibleLength = 2;
  else if (frameIndex === 2) visibleLength = 3;
  else if (frameIndex === 3) visibleLength = 4;
  else if (frameIndex === 4) visibleLength = 5;
  else visibleLength = 6;
  
  const currentText = word.substring(0, visibleLength);

  const isKickFrame = (frameIndex === 0 || frameIndex === 4);
  const isSnareFrame = (frameIndex === 2 || frameIndex === 6);
  
  let bg = '#050608';
  let textColor = '#f5f8ff';
  let scale = 1.0;
  let skew = 0;
  let rotation = 0;
  let textBlur = 0;
  let invertFilter = 'none';
  let barHeight = 0;
  let barTop = 0;
  let chromaticSplit = 'none';
  let activeFont = 'Permanent Marker';
  let sprayOpacity = 0.05;

  if (style === 'flicker') {
    activeFont = 'Permanent Marker';
    // Strobo contrast alternation
    if (isKickFrame) {
      bg = '#ffffff';
      textColor = '#050608';
      scale = 1.45;
      skew = 22;
      rotation = -8;
      invertFilter = 'invert(100%)';
      sprayOpacity = 0.5;
    } else if (isSnareFrame) {
      bg = '#00f0ff'; // Cyan kick flash
      textColor = '#050608';
      scale = 1.3;
      skew = -18;
      rotation = 6;
      sprayOpacity = 0.4;
    } else {
      // In-between build frames
      bg = '#050608';
      textColor = '#f5f8ff';
      scale = 0.95 + (frameIndex * 0.05);
      skew = frameIndex % 2 === 0 ? 12 : -12;
      rotation = frameIndex % 2 === 0 ? 3 : -3;
    }
  } else if (style === 'glitch') {
    activeFont = 'Sedgwick Ave Display';
    bg = '#070913';
    textColor = '#ffffff';
    scale = 1.1 + (Math.sin(frameIndex) * 0.15);
    skew = (frameIndex * 11) % 35 - 17;
    rotation = (frameIndex * 5) % 15 - 7;
    textBlur = frameIndex % 3 === 0 ? 5 : 0;
    
    // Chromatic Aberration Shadows (extreme graffiti displacement)
    chromaticSplit = `${frameIndex * 12}px 0 rgba(255, 0, 170, 0.95), -${frameIndex * 12}px 0 rgba(0, 240, 255, 0.95)`;
    
    // Flashing overlay bars
    if (frameIndex % 2 === 0) {
      barHeight = 90;
      barTop = 100 + (frameIndex * 100);
      sprayOpacity = 0.35;
    }
  }

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Frame ${frameIndex}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Sedgwick+Ave+Display&family=Space+Grotesk:wght@700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      width: 800px;
      height: 800px;
      background-color: ${bg};
      color: ${textColor};
      font-family: 'Space Grotesk', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      filter: ${invertFilter};
    }

    /* Scanline Grid simulation */
    .scanlines {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        rgba(18, 16, 16, 0) 50%, 
        rgba(0, 0, 0, 0.35) 50%
      ), linear-gradient(
        90deg, 
        rgba(255, 0, 0, 0.08), 
        rgba(0, 255, 0, 0.03), 
        rgba(0, 0, 255, 0.08)
      );
      background-size: 100% 6px, 8px 100%;
      pointer-events: none;
      z-index: 5;
    }

    /* Spray Paint Splatters in background */
    .spray-paint {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 240, 255, 0.65) 0%, rgba(255, 0, 170, 0.25) 50%, transparent 70%);
      filter: blur(60px);
      opacity: ${sprayOpacity};
      pointer-events: none;
      z-index: 1;
      transform: translate(${Math.sin(frameIndex) * 100}px, ${Math.cos(frameIndex) * 100}px) scale(${scale});
      transition: all 0.05s;
    }

    /* Glitch text container */
    .glitch-wrapper {
      transform: scale(${scale}) skewX(${skew}deg) rotate(${rotation}deg);
      transition: all 0.05s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 3;
    }

    .glitch-text {
      font-family: '${activeFont}', cursive;
      font-size: 150px; /* Massive size boost */
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 15px;
      text-shadow: ${chromaticSplit};
      filter: blur(${textBlur}px);
      text-align: center;
      line-height: 1.0;
      white-space: nowrap;
    }

    .glitch-subtitle {
      font-family: 'Permanent Marker', cursive;
      font-size: 32px;
      letter-spacing: 4px;
      color: #9adf6b;
      margin-top: 30px;
      text-transform: uppercase;
      transform: rotate(-3deg);
      text-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }

    /* Horizontal visual flash bar */
    .glitch-bar {
      position: absolute;
      left: 0;
      width: 100%;
      height: ${barHeight}px;
      top: ${barTop}px;
      background: rgba(0, 240, 255, 0.25);
      box-shadow: 0 0 25px rgba(0, 240, 255, 0.7);
      pointer-events: none;
      z-index: 4;
    }

    /* Framing brackets for retro visualizer look */
    .brackets {
      position: absolute;
      width: 740px;
      height: 740px;
      border: 4px dashed rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      pointer-events: none;
      z-index: 2;
    }

    .bracket-corner {
      position: absolute;
      width: 50px;
      height: 50px;
      border-color: ${style === 'flicker' ? textColor : '#00f0ff'};
      border-style: solid;
      border-width: 0;
    }

    .top-left { top: 30px; left: 30px; border-top-width: 6px; border-left-width: 6px; }
    .top-right { top: 30px; right: 30px; border-top-width: 6px; border-right-width: 6px; }
    .bottom-left { bottom: 30px; left: 30px; border-bottom-width: 6px; border-left-width: 6px; }
    .bracket-corner.bottom-right { bottom: 30px; right: 30px; border-bottom-width: 6px; border-right-width: 6px; }

    /* Realistic, organic shattered glass styling */
    .glass-cracks {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 6;
    }
  </style>
</head>
<body>

  <div class="scanlines"></div>
  <div class="spray-paint"></div>
  <div class="brackets"></div>
  <div class="bracket-corner top-left"></div>
  <div class="bracket-corner top-right"></div>
  <div class="bracket-corner bottom-left"></div>
  <div class="bracket-corner bottom-right"></div>

  ${barHeight > 0 ? `<div class="glitch-bar"></div>` : ''}

  <!-- STYLE-SPECIFIC RENDERING: DRAFT B FEATURES ORGANIC PHONE CRACKS, DRAFT A IS PURE TEXT -->
  ${style === 'glitch' ? `
    <!-- Frame 4: Impact happens at bottom-left corner (80, 720) -->
    ${frameIndex === 4 ? `
    <svg class="glass-cracks" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <!-- Jagged, lightning-like primary fractures shooting across the screen -->
      <path d="M 80 720 L 150 630 L 120 540 L 240 460 L 320 380 L 290 260 L 480 180 L 650 120" stroke="#00f0ff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="drop-shadow(0 0 8px rgba(0, 240, 255, 0.9))" />
      <path d="M 80 720 L 220 680 L 340 640 L 480 610 L 620 530 L 780 490" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="drop-shadow(0 0 6px rgba(0, 240, 255, 0.8))" />
      <!-- Impact point dense fracture lines -->
      <path d="M 80 720 L 95 650 L 130 590 M 80 720 L 140 700 M 80 720 L 50 660" stroke="#ffffff" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M 60 700 Q 80 670 110 690 Q 120 720 100 740 Z" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.8" />
    </svg>
    ` : ''}

    <!-- Frame 5: Cracks spread further and add concentric shatter rings -->
    ${frameIndex === 5 ? `
    <svg class="glass-cracks" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <!-- Jagged primary fractures widen and turn magenta -->
      <path d="M 80 720 L 150 630 L 120 540 L 240 460 L 320 380 L 290 260 L 480 180 L 650 120" stroke="#ff00aa" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="drop-shadow(0 0 12px rgba(255, 0, 170, 0.95))" />
      <path d="M 80 720 L 220 680 L 340 640 L 480 610 L 620 530 L 780 490" stroke="#ff00aa" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="drop-shadow(0 0 10px rgba(255, 0, 170, 0.9))" />
      <!-- New branch fracture -->
      <path d="M 80 720 L 90 520 L 180 420 L 140 280 L 260 180 L 210 60" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85" />
      <!-- Dynamic Concentric Ring Cracks (Shockwaves from impact site) -->
      <path d="M 40 680 Q 80 600 170 630 Q 200 720 130 770" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.8" />
      <path d="M 20 640 Q 90 530 240 570 Q 290 710 180 790" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.6" />
    </svg>
    ` : ''}

    <!-- Frame 6: Extreme phone shatter, complete chaotic glass breakup -->
    ${frameIndex === 6 ? `
    <svg class="glass-cracks" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
      <path d="M 80 720 L 150 630 L 120 540 L 240 460 L 320 380 L 290 260 L 480 180 L 650 120" stroke="#00f0ff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="drop-shadow(0 0 16px rgba(0, 240, 255, 0.95))" />
      <path d="M 80 720 L 220 680 L 340 640 L 480 610 L 620 530 L 780 490" stroke="#ff00aa" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="drop-shadow(0 0 14px rgba(255, 0, 170, 0.9))" />
      <path d="M 80 720 L 90 520 L 180 420 L 140 280 L 260 180 L 210 60" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="drop-shadow(0 0 8px #fff)" />
      <!-- Giant concentric shockwave rings -->
      <path d="M 40 680 Q 80 600 170 630 Q 200 720 130 770" stroke="#ffffff" stroke-width="3" fill="none" opacity="0.9" />
      <path d="M 20 640 Q 90 530 240 570 Q 290 710 180 790" stroke="#00f0ff" stroke-width="2.5" fill="none" opacity="0.8" />
      <path d="M 0 580 Q 100 440 330 490 Q 380 700 220 800" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.6" />
    </svg>
    ` : ''}
  ` : ''}

  <div class="glitch-wrapper">
    <div class="glitch-text">${currentText}</div>
    <div class="glitch-subtitle">MAY 2026 #2</div>
  </div>

</body>
</html>
`;
}

// Executes a shell command and returns stdout
function runCmd(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout.trim());
    });
  });
}

async function main() {
  const style = process.argv[2] || 'flicker';
  OUTPUT_GIF_PATH = path.join(WORKSPACE_DIR, 'release', `daumenkino_${style}.gif`);
  OUTPUT_MP4_PATH = path.join(WORKSPACE_DIR, 'release', `daumenkino_${style}.mp4`);

  console.log(`=== AIRDOX Daumenkino Generator ===`);
  console.log(`Stil: ${style === 'flicker' ? 'Beat-Flicker Strobo (knallt rein!)' : 'RGB Glitch Loop (beatgesteuert hammer!)'}`);

  // Create temporary directory
  await fs.mkdir(TEMP_DIR, { recursive: true });

  console.log('1. Generiere 8 beat-synchrone HTML-Einzel-Frames...');
  for (let i = 0; i < 8; i++) {
    const html = getFrameHtml(i, style);
    await fs.writeFile(path.join(TEMP_DIR, `frame_${i}.html`), html, 'utf8');
  }

  console.log('2. Starte Headless-Chromium und fotografiere Frames in 800x800px...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 800 });

  for (let i = 0; i < 8; i++) {
    const frameHtmlPath = path.join(TEMP_DIR, `frame_${i}.html`);
    await page.goto(`file://${frameHtmlPath}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: path.join(TEMP_DIR, `frame_${i}.png`),
      type: 'png'
    });
    process.stdout.write(`   [Frame ${i}/7] fotografiert.\n`);
  }
  await browser.close();

  console.log('3. Kompiliere GIF & MP4 via FFmpeg...');
  
  // Clean up old output
  try { await fs.unlink(OUTPUT_GIF_PATH); } catch {}
  try { await fs.unlink(OUTPUT_MP4_PATH); } catch {}

  // FFmpeg command to compile 12 FPS loopable animated GIF
  const gifCmd = `ffmpeg -y -framerate 12 -i "${path.join(TEMP_DIR, 'frame_%d.png')}" -vf "scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" "${OUTPUT_GIF_PATH}"`;
  // FFmpeg command to compile 12 FPS loopable H.264 MP4
  const mp4Cmd = `ffmpeg -y -framerate 12 -i "${path.join(TEMP_DIR, 'frame_%d.png')}" -c:v libx264 -pix_fmt yuv420p -vf "scale=800:800" "${OUTPUT_MP4_PATH}"`;

  console.log('   Kompiliere GIF...');
  await runCmd(gifCmd);
  console.log('   Kompiliere MP4...');
  await runCmd(mp4Cmd);

  // Cleanup temp files
  try {
    const files = await fs.readdir(TEMP_DIR);
    for (const file of files) {
      await fs.unlink(path.join(TEMP_DIR, file));
    }
    await fs.rmdir(TEMP_DIR);
  } catch {}

  console.log('\n🎉 DAUMENKINO RENDER SUCCESSFUL!');
  console.log(`🎠 Loopable GIF: ${OUTPUT_GIF_PATH}`);
  console.log(`🎬 Loopable MP4: ${OUTPUT_MP4_PATH}`);
}

main().catch(console.error);
