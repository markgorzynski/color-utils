import { srgbToXyz, xyzToSrgb } from '../src/srgb.js';
import { TEST_COLORS } from './test-helpers.js';

console.log('Testing XYZ conversions:\n');

// Test red conversion
const redXyz = srgbToXyz(TEST_COLORS.red.srgb);
console.log('Red sRGB to XYZ:');
console.log('  Calculated:', redXyz);
console.log('  Expected:  ', TEST_COLORS.red.xyz);
console.log('  Difference:', {
  X: Math.abs(redXyz.X - TEST_COLORS.red.xyz.X),
  Y: Math.abs(redXyz.Y - TEST_COLORS.red.xyz.Y),
  Z: Math.abs(redXyz.Z - TEST_COLORS.red.xyz.Z)
});

// Test white conversion
const whiteXyz = srgbToXyz(TEST_COLORS.white.srgb);
console.log('\nWhite sRGB to XYZ:');
console.log('  Calculated:', whiteXyz);
console.log('  Expected:  ', TEST_COLORS.white.xyz);
console.log('  Difference:', {
  X: Math.abs(whiteXyz.X - TEST_COLORS.white.xyz.X),
  Y: Math.abs(whiteXyz.Y - TEST_COLORS.white.xyz.Y),
  Z: Math.abs(whiteXyz.Z - TEST_COLORS.white.xyz.Z)
});

// Test reverse
const redBack = xyzToSrgb(TEST_COLORS.red.xyz);
console.log('\nRed XYZ to sRGB:');
console.log('  Calculated:', redBack);
console.log('  Expected:  ', TEST_COLORS.red.srgb);
console.log('  Difference:', {
  r: Math.abs(redBack.r - TEST_COLORS.red.srgb.r),
  g: Math.abs(redBack.g - TEST_COLORS.red.srgb.g),
  b: Math.abs(redBack.b - TEST_COLORS.red.srgb.b)
});