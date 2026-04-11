// Script to generate PWA icons as PNG using Canvas API (Node.js)
// Run: node scripts/generate-icons.js

const { createCanvas } = (() => {
  try {
    return require('canvas');
  } catch {
    return { createCanvas: null };
  }
})();

const fs = require('fs');
const path = require('path');

function generateIconSVG(size) {
  const padding = Math.round(size * 0.15);
  const busWidth = size - padding * 2;
  const busHeight = Math.round(busWidth * 0.7);
  const busX = padding;
  const busY = Math.round((size - busHeight) / 2) - Math.round(size * 0.02);
  const cornerRadius = Math.round(size * 0.06);
  const wheelRadius = Math.round(size * 0.05);
  const windowY = busY + Math.round(busHeight * 0.2);
  const windowHeight = Math.round(busHeight * 0.3);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563EB"/>
      <stop offset="100%" style="stop-color:#1D4ED8"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="url(#bg)"/>
  <!-- Bus body -->
  <rect x="${busX}" y="${busY}" width="${busWidth}" height="${busHeight}" rx="${cornerRadius}" fill="white"/>
  <!-- Bus roof accent -->
  <rect x="${busX}" y="${busY}" width="${busWidth}" height="${Math.round(busHeight * 0.18)}" rx="${cornerRadius}" fill="#DBEAFE"/>
  <rect x="${busX}" y="${busY + Math.round(busHeight * 0.09)}" width="${busWidth}" height="${Math.round(busHeight * 0.09)}" fill="#DBEAFE"/>
  <!-- Windows -->
  <rect x="${busX + Math.round(busWidth * 0.08)}" y="${windowY}" width="${Math.round(busWidth * 0.22)}" height="${windowHeight}" rx="${Math.round(size * 0.02)}" fill="#2563EB" opacity="0.8"/>
  <rect x="${busX + Math.round(busWidth * 0.35)}" y="${windowY}" width="${Math.round(busWidth * 0.22)}" height="${windowHeight}" rx="${Math.round(size * 0.02)}" fill="#2563EB" opacity="0.8"/>
  <rect x="${busX + Math.round(busWidth * 0.62)}" y="${windowY}" width="${Math.round(busWidth * 0.22)}" height="${windowHeight}" rx="${Math.round(size * 0.02)}" fill="#2563EB" opacity="0.8"/>
  <!-- Door -->
  <rect x="${busX + Math.round(busWidth * 0.88)}" y="${windowY}" width="${Math.round(busWidth * 0.06)}" height="${Math.round(busHeight * 0.55)}" rx="${Math.round(size * 0.01)}" fill="#93C5FD"/>
  <!-- Stripe -->
  <rect x="${busX}" y="${busY + Math.round(busHeight * 0.65)}" width="${busWidth}" height="${Math.round(busHeight * 0.08)}" fill="#2563EB" opacity="0.6"/>
  <!-- Wheels -->
  <circle cx="${busX + Math.round(busWidth * 0.22)}" cy="${busY + busHeight}" r="${wheelRadius}" fill="#1E293B"/>
  <circle cx="${busX + Math.round(busWidth * 0.22)}" cy="${busY + busHeight}" r="${Math.round(wheelRadius * 0.5)}" fill="#94A3B8"/>
  <circle cx="${busX + Math.round(busWidth * 0.78)}" cy="${busY + busHeight}" r="${wheelRadius}" fill="#1E293B"/>
  <circle cx="${busX + Math.round(busWidth * 0.78)}" cy="${busY + busHeight}" r="${Math.round(wheelRadius * 0.5)}" fill="#94A3B8"/>
  <!-- Headlights -->
  <rect x="${busX + Math.round(busWidth * 0.03)}" y="${busY + Math.round(busHeight * 0.55)}" width="${Math.round(busWidth * 0.05)}" height="${Math.round(busHeight * 0.08)}" rx="${Math.round(size * 0.01)}" fill="#FCD34D"/>
  <rect x="${busX + busWidth - Math.round(busWidth * 0.08)}" y="${busY + Math.round(busHeight * 0.55)}" width="${Math.round(busWidth * 0.05)}" height="${Math.round(busHeight * 0.08)}" rx="${Math.round(size * 0.01)}" fill="#FCA5A5"/>
</svg>`;
}

// Generate SVG icons and save them
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

[192, 512].forEach(size => {
  const svg = generateIconSVG(size);
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Generated: ${svgPath}`);
});

console.log('\nSVG icons generated. Converting to PNG...');

// Try to convert SVG to PNG using available tools
const { execSync } = require('child_process');

[192, 512].forEach(size => {
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  const pngPath = path.join(iconsDir, `icon-${size}x${size}.png`);

  try {
    // Try using convert (ImageMagick) if available
    execSync(`convert -background none -size ${size}x${size} "${svgPath}" "${pngPath}" 2>/dev/null`);
    console.log(`Converted to PNG: ${pngPath}`);
  } catch {
    try {
      // Try rsvg-convert if available
      execSync(`rsvg-convert -w ${size} -h ${size} "${svgPath}" -o "${pngPath}" 2>/dev/null`);
      console.log(`Converted to PNG: ${pngPath}`);
    } catch {
      console.log(`PNG conversion not available for ${size}x${size}. Using SVG fallback.`);
    }
  }
});
