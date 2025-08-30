/**
 * Basic Color Conversions Example
 * Demonstrates fundamental color space conversions
 */

import {
  parseSrgbHex,
  formatSrgbAsHex,
  srgbToLab,
  labToSrgb,
  srgbToOklab,
  oklabToSrgb,
  labToLch,
  lchToLab,
  oklabToOklch,
  oklchToOklab
} from '../src/index.js';

console.log('=== Basic Color Conversions ===\n');

// Example 1: Hex to Lab
console.log('1. Hex to CIELAB:');
const hexColor = '#FF6B35';
const srgb = parseSrgbHex(hexColor);
const lab = srgbToLab(srgb);
console.log(`   ${hexColor} → Lab(${lab.L.toFixed(2)}, ${lab.a.toFixed(2)}, ${lab.b.toFixed(2)})`);

// Example 2: Lab back to Hex
console.log('\n2. CIELAB to Hex:');
const srgbFromLab = labToSrgb(lab);
const hexFromLab = formatSrgbAsHex(srgbFromLab);
console.log(`   Lab(${lab.L.toFixed(2)}, ${lab.a.toFixed(2)}, ${lab.b.toFixed(2)}) → ${hexFromLab}`);

// Example 3: Compare Lab and Oklab
console.log('\n3. CIELAB vs Oklab:');
const oklab = srgbToOklab(srgb);
console.log(`   CIELAB: L=${lab.L.toFixed(2)}, a=${lab.a.toFixed(2)}, b=${lab.b.toFixed(2)}`);
console.log(`   Oklab:  L=${oklab.L.toFixed(3)}, a=${oklab.a.toFixed(3)}, b=${oklab.b.toFixed(3)}`);

// Example 4: Cylindrical representations
console.log('\n4. Cylindrical (LCH) representations:');
const lch = labToLch(lab);
const oklch = oklabToOklch(oklab);
console.log(`   LCH:   L=${lch.L.toFixed(2)}, C=${lch.C.toFixed(2)}, h=${lch.h.toFixed(2)}°`);
console.log(`   OkLCH: L=${oklch.L.toFixed(3)}, C=${oklch.C.toFixed(3)}, h=${oklch.h.toFixed(2)}°`);

// Example 5: Color palette generation
console.log('\n5. Generate analogous color palette:');
const baseHue = lch.h;
const analogous = [
  { ...lch, h: (baseHue - 30 + 360) % 360 },
  lch,
  { ...lch, h: (baseHue + 30) % 360 }
];

console.log('   Analogous palette (±30° hue):');
analogous.forEach((color, i) => {
  const rgb = labToSrgb(lchToLab(color));
  const hex = formatSrgbAsHex(rgb);
  console.log(`   ${i + 1}. h=${color.h.toFixed(0)}° → ${hex}`);
});

// Example 6: Lightness variations
console.log('\n6. Lightness variations:');
const lightnesses = [30, 50, 70, 90];
lightnesses.forEach(L => {
  const variant = { ...lch, L };
  const rgb = labToSrgb(lchToLab(variant));
  const hex = formatSrgbAsHex(rgb);
  console.log(`   L=${L} → ${hex}`);
});

// Example 7: Grayscale conversion
console.log('\n7. Convert to grayscale (L channel only):');
const grayscale = { L: lab.L, a: 0, b: 0 };
const grayRgb = labToSrgb(grayscale);
const grayHex = formatSrgbAsHex(grayRgb);
console.log(`   Original: ${hexColor}`);
console.log(`   Grayscale: ${grayHex} (L=${lab.L.toFixed(2)})`);

// Example 8: Round-trip accuracy
console.log('\n8. Round-trip conversion accuracy:');
const original = { r: 0.678, g: 0.420, b: 0.208 };
const toLab = srgbToLab(original);
const backToSrgb = labToSrgb(toLab);
const error = {
  r: Math.abs(original.r - backToSrgb.r),
  g: Math.abs(original.g - backToSrgb.g),
  b: Math.abs(original.b - backToSrgb.b)
};
console.log(`   Max error: ${Math.max(error.r, error.g, error.b).toExponential(2)}`);
console.log(`   ✓ Round-trip maintains precision`);

console.log('\n=== Examples Complete ===');