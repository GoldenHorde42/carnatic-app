/**
 * build-icons.js
 * Generates all required app icon and splash PNGs from embedded SVG data.
 * Run: node scripts/build-icons.js
 */
const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const assetsDir = path.join(__dirname, '..', 'assets');

// ─── SVG definitions ────────────────────────────────────────────────────────

// 1024×1024 master icon
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0f0a1e"/>
  <circle cx="512" cy="490" r="290" fill="#1a1030"/>
  <circle cx="512" cy="490" r="290" fill="none" stroke="#FF0000" stroke-width="6" opacity="0.35"/>
  <polygon points="424,350 424,630 692,490" fill="#FF0000"/>
  <rect x="170" y="790" width="684" height="3" rx="1.5" fill="#FF0000" opacity="0.5"/>
  <text x="512" y="870"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="82" font-weight="bold"
        fill="#FFFFFF" text-anchor="middle" letter-spacing="10">CARNATIC</text>
</svg>`;

// 200×200 splash icon (just the play button, minimal)
const splashIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#0f0a1e"/>
  <circle cx="100" cy="100" r="80" fill="#1a1030"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="#FF0000" stroke-width="3" opacity="0.4"/>
  <polygon points="80,65 80,135 140,100" fill="#FF0000"/>
</svg>`;

// 64×64 favicon
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0f0a1e"/>
  <polygon points="24,16 24,48 50,32" fill="#FF0000"/>
</svg>`;

// ─── Build tasks ─────────────────────────────────────────────────────────────

const tasks = [
  {
    name:   'icon.png (1024×1024)',
    svg:    iconSvg,
    output: path.join(assetsDir, 'icon.png'),
    size:   1024,
  },
  {
    name:   'adaptive-icon.png (1024×1024)',
    svg:    iconSvg,
    output: path.join(assetsDir, 'adaptive-icon.png'),
    size:   1024,
  },
  {
    name:   'splash-icon.png (200×200)',
    svg:    splashIconSvg,
    output: path.join(assetsDir, 'splash-icon.png'),
    size:   200,
  },
  {
    name:   'favicon.png (64×64)',
    svg:    faviconSvg,
    output: path.join(assetsDir, 'favicon.png'),
    size:   64,
  },
];

(async () => {
  console.log('Generating app icons...\n');
  for (const task of tasks) {
    try {
      await sharp(Buffer.from(task.svg))
        .resize(task.size, task.size)
        .png()
        .toFile(task.output);
      const kb = Math.round(fs.statSync(task.output).size / 1024);
      console.log(`✅  ${task.name} → ${kb} KB`);
    } catch (err) {
      console.error(`❌  ${task.name}: ${err.message}`);
    }
  }
  console.log('\nDone! All icons written to mobile/assets/');
})();
