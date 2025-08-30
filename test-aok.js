import { AdaptiveOklab } from './src/aoklab.js';
import { srgbToLab } from './src/cielab.js';

console.log('Testing Adaptive Oklab functionality:\n');

// Test basic conversion
const testColor = { r: 1, g: 0.5, b: 0 }; // Orange
console.log('Test color (orange):', testColor);

// Test different surrounds
['white', 'gray', 'dark'].forEach(surround => {
  console.log(`\n--- ${surround.toUpperCase()} surround ---`);
  
  const aok = new AdaptiveOklab({ surround });
  
  // Forward conversion
  const aokColor = aok.fromSrgb(testColor);
  console.log('Adaptive Oklab:', aokColor);
  
  // Reverse conversion
  const backToSrgb = aok.toSrgb(aokColor);
  console.log('Back to sRGB:', backToSrgb);
  
  // Check roundtrip accuracy
  const diff = {
    r: Math.abs(testColor.r - backToSrgb.r),
    g: Math.abs(testColor.g - backToSrgb.g),
    b: Math.abs(testColor.b - backToSrgb.b)
  };
  console.log('Roundtrip error:', diff);
  console.log('Max error:', Math.max(diff.r, diff.g, diff.b));
});

// Test lightness targeting
console.log('\n--- LIGHTNESS TARGETING ---');
const targetL = 60;
const aokWithTarget = new AdaptiveOklab({ 
  surround: 'gray',
  targetLabL: targetL,
  maintainChroma: true
});

console.log(`Target Lab L: ${targetL}`);
const adapted = aokWithTarget.fromSrgb(testColor);
const result = aokWithTarget.toSrgb(adapted);
const resultLab = srgbToLab(result);
console.log('Result Lab:', resultLab);
console.log(`Achieved Lab L: ${resultLab.L}`);
console.log(`Error from target: ${Math.abs(resultLab.L - targetL)}`);

// Check internal parameters
console.log('\n--- INTERNAL PARAMETERS ---');
const whiteAok = new AdaptiveOklab({ surround: 'white' });
const darkAok = new AdaptiveOklab({ surround: 'dark' });

console.log('White surround exponent:', whiteAok._exponent);
console.log('Dark surround exponent:', darkAok._exponent);
console.log('White correction factor:', whiteAok._correctionFactor);
console.log('Dark correction factor:', darkAok._correctionFactor);