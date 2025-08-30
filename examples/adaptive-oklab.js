/**
 * Adaptive Oklab Example
 * Demonstrates surround-aware color adaptation
 */

import {
  AdaptiveOklab,
  parseSrgbHex,
  formatSrgbAsHex,
  srgbToOklab
} from '../src/index.js';

console.log('=== Adaptive Oklab Demo ===\n');

// Test colors
const colors = [
  { name: 'Red', hex: '#FF0000' },
  { name: 'Green', hex: '#00FF00' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Orange', hex: '#FF8C00' },
  { name: 'Purple', hex: '#8A2BE2' },
  { name: 'Gray', hex: '#808080' }
];

// Create adapters for different surrounds
const adapters = {
  white: new AdaptiveOklab({ surround: 'white' }),
  gray: new AdaptiveOklab({ surround: 'gray' }),
  dark: new AdaptiveOklab({ surround: 'dark' })
};

console.log('1. How colors appear in different viewing conditions:\n');

colors.forEach(({ name, hex }) => {
  console.log(`${name} (${hex}):`);
  const srgb = parseSrgbHex(hex);
  
  Object.entries(adapters).forEach(([surround, adapter]) => {
    const adapted = adapter.fromSrgb(srgb);
    const backToSrgb = adapter.toSrgb(adapted);
    const adaptedHex = formatSrgbAsHex(backToSrgb);
    
    console.log(`  ${surround.padEnd(5)} → L=${adapted.L.toFixed(3)}, ` +
                `a=${adapted.a.toFixed(3).padStart(7)}, ` +
                `b=${adapted.b.toFixed(3).padStart(7)} → ${adaptedHex}`);
  });
  console.log();
});

// Demonstrate the effect of x0 parameter
console.log('2. Effect of x0 parameter (hue correction factor):\n');

const testColor = parseSrgbHex('#FF6B35');
const x0Values = [0.3, 0.5, 0.7];

x0Values.forEach(x0 => {
  const adapter = new AdaptiveOklab({ surround: 'gray', x0 });
  const adapted = adapter.fromSrgb(testColor);
  
  // Calculate chroma and hue
  const chroma = Math.sqrt(adapted.a ** 2 + adapted.b ** 2);
  const hue = Math.atan2(adapted.b, adapted.a) * 180 / Math.PI;
  
  console.log(`x0=${x0}: L=${adapted.L.toFixed(3)}, ` +
              `C=${chroma.toFixed(3)}, h=${hue.toFixed(1)}°`);
});

console.log('\n3. Practical use case - UI color adaptation:\n');

// Simulate a UI color that needs to work in both light and dark modes
const brandColor = parseSrgbHex('#5E72E4'); // Nice blue
console.log(`Brand color: #5E72E4`);

// Light mode (white surround)
const lightAdapter = new AdaptiveOklab({ surround: 'white' });
const lightAdapted = lightAdapter.fromSrgb(brandColor);
const lightResult = lightAdapter.toSrgb(lightAdapted);
console.log(`Light mode: ${formatSrgbAsHex(lightResult)}`);

// Dark mode (dark surround)
const darkAdapter = new AdaptiveOklab({ surround: 'dark' });
const darkAdapted = darkAdapter.fromSrgb(brandColor);
const darkResult = darkAdapter.toSrgb(darkAdapted);
console.log(`Dark mode:  ${formatSrgbAsHex(darkResult)}`);

// Compare with standard Oklab (no adaptation)
console.log('\n4. Adaptive vs Standard Oklab:\n');

const standardOklab = srgbToOklab(brandColor);
console.log('Standard Oklab (no adaptation):');
console.log(`  L=${standardOklab.L.toFixed(3)}, ` +
            `a=${standardOklab.a.toFixed(3)}, ` +
            `b=${standardOklab.b.toFixed(3)}`);

console.log('\nAdaptive Oklab:');
Object.entries(adapters).forEach(([surround, adapter]) => {
  const adapted = adapter.fromSrgb(brandColor);
  console.log(`  ${surround.padEnd(5)}: L=${adapted.L.toFixed(3)}, ` +
              `a=${adapted.a.toFixed(3)}, ` +
              `b=${adapted.b.toFixed(3)}`);
});

// Show how adaptation affects perceived lightness
console.log('\n5. Perceived lightness changes:\n');

const grayValue = parseSrgbHex('#808080');
console.log('50% Gray (#808080) perceived lightness:');

Object.entries(adapters).forEach(([surround, adapter]) => {
  const adapted = adapter.fromSrgb(grayValue);
  const params = adapter.params;
  console.log(`  ${surround.padEnd(5)} surround: L=${adapted.L.toFixed(3)} ` +
              `(exponent=${params.FL.toFixed(3)})`);
});

console.log('\nKey observations:');
console.log('- White surround: Colors appear darker (higher exponent)');
console.log('- Dark surround: Colors appear lighter (lower exponent)');
console.log('- Gray surround: Balanced adaptation (medium exponent)');

console.log('\n=== Demo Complete ===');