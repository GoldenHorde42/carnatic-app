/**
 * Icon generation script for Carnatic App
 * 
 * This creates SVG source files for the app icon.
 * For production, export these to PNG at the required sizes:
 * 
 *   icon.png          → 1024×1024 (App Store / Play Store master icon)
 *   adaptive-icon.png → 1024×1024 (Android adaptive icon foreground)
 *   splash-icon.png   → 200×200   (shown on splash screen)
 *   favicon.png       → 64×64     (web favicon)
 *
 * You can open icon.svg in a browser or Figma and export to PNG.
 * Or use: npx @expo/cli export (which auto-resizes from icon.png)
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// Main app icon SVG: dark purple background + red ▶ + "C" monogram
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <!-- Background -->
  <rect width="1024" height="1024" rx="180" fill="#0f0a1e"/>
  
  <!-- Outer circle ring (YouTube-style) -->
  <circle cx="512" cy="480" r="300" fill="none" stroke="#FF0000" stroke-width="8" opacity="0.3"/>
  
  <!-- Red play button triangle -->
  <polygon points="420,340 420,620 680,480" fill="#FF0000"/>
  
  <!-- Bottom text: CARNATIC -->
  <text x="512" y="860" 
        font-family="Georgia, serif" 
        font-size="88" 
        font-weight="bold"
        fill="#FFFFFF"
        text-anchor="middle"
        letter-spacing="8">CARNATIC</text>
        
  <!-- Subtle horizontal rule above text -->
  <line x1="180" y1="780" x2="844" y2="780" stroke="#FF0000" stroke-width="2" opacity="0.6"/>
</svg>`;

// Splash screen SVG: centered logo on dark background
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1284" height="2778" viewBox="0 0 1284 2778">
  <!-- Background (iPhone 14 Pro Max resolution) -->
  <rect width="1284" height="2778" fill="#0f0a1e"/>
  
  <!-- Centered icon area -->
  <!-- Red play button -->
  <polygon points="542,1309 542,1469 702,1389" fill="#FF0000"/>
  
  <!-- Circle ring around play button -->
  <circle cx="622" cy="1389" r="130" fill="none" stroke="#FF0000" stroke-width="4" opacity="0.4"/>
  
  <!-- App name below -->
  <text x="642" y="1590" 
        font-family="Georgia, serif" 
        font-size="52" 
        font-weight="bold"
        fill="#FFFFFF"
        text-anchor="middle"
        letter-spacing="6">CARNATIC</text>
        
  <!-- Tagline -->
  <text x="642" y="1640" 
        font-family="Arial, sans-serif" 
        font-size="24"
        fill="#888888"
        text-anchor="middle">Classical Music · Curated</text>
</svg>`;

fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(assetsDir, 'splash.svg'), splashSvg);

console.log('✅ SVG source files written to assets/');
console.log('');
console.log('Next steps to generate PNG files:');
console.log('  Option A (recommended): Open assets/icon.svg in a browser → right-click → save as PNG (1024×1024)');
console.log('  Option B: Use an online converter like https://convertio.co/svg-png/');
console.log('  Option C: Install sharp and run: node scripts/convert-icons.js');
console.log('');
console.log('Required PNG files:');
console.log('  assets/icon.png          → 1024×1024');
console.log('  assets/adaptive-icon.png → 1024×1024 (same as icon.png is fine)');
console.log('  assets/splash-icon.png   → 200×200 (just the play button, no text)');
console.log('  assets/favicon.png       → 64×64');
