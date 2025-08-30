/**
 * Test helper utilities for color-utils tests
 */

/**
 * Check if two numbers are approximately equal
 * @param {number} a - First number
 * @param {number} b - Second number
 * @param {number} [tolerance=0.0001] - Acceptable difference
 * @returns {boolean} True if numbers are approximately equal
 */
export function approxEqual(a, b, tolerance = 0.0001) {
  return Math.abs(a - b) < tolerance;
}

/**
 * Check if two colors are approximately equal
 * @param {Object} color1 - First color
 * @param {Object} color2 - Second color
 * @param {number} [tolerance=0.0001] - Acceptable difference per channel
 * @returns {boolean} True if colors are approximately equal
 */
export function colorsApproxEqual(color1, color2, tolerance = 0.0001) {
  const keys1 = Object.keys(color1).sort();
  const keys2 = Object.keys(color2).sort();
  
  // Check if both have the same keys
  if (keys1.length !== keys2.length) return false;
  if (keys1.some((k, i) => k !== keys2[i])) return false;
  
  // Check if all values are approximately equal
  return keys1.every(key => approxEqual(color1[key], color2[key], tolerance));
}

/**
 * Test data for common colors in different spaces
 */
export const TEST_COLORS = {
  // Primary colors
  red: {
    srgb: { r: 1, g: 0, b: 0 },
    hex: '#ff0000',
    lab: { L: 53.24079, a: 80.09246, b: 67.20319 },
    lch: { L: 53.24079, C: 104.57521, h: 39.99901 },
    oklab: { L: 0.62796, a: 0.22486, b: 0.12585 },
    oklch: { L: 0.62796, C: 0.25768, h: 29.23388 },
    xyz: { X: 0.4124564, Y: 0.2126729, Z: 0.0193339 }
  },
  
  green: {
    srgb: { r: 0, g: 1, b: 0 },
    hex: '#00ff00',
    lab: { L: 87.73472, a: -86.18272, b: 83.17931 },
    lch: { L: 87.73472, C: 119.77856, h: 136.01596 },
    oklab: { L: 0.86644, a: -0.23389, b: 0.17947 },
    oklch: { L: 0.86644, C: 0.29483, h: 142.49534 },
    xyz: { X: 0.3575761, Y: 0.7151522, Z: 0.1191920 }
  },
  
  blue: {
    srgb: { r: 0, g: 0, b: 1 },
    hex: '#0000ff',
    lab: { L: 32.30259, a: 79.19666, b: -107.86368 },
    lch: { L: 32.30259, C: 133.81080, h: 306.28494 },
    oklab: { L: 0.45202, a: -0.03247, b: -0.31153 },
    oklch: { L: 0.45202, C: 0.31321, h: 264.05206 },
    xyz: { X: 0.1804375, Y: 0.0721750, Z: 0.9503041 }
  },
  
  // Neutral colors
  white: {
    srgb: { r: 1, g: 1, b: 1 },
    hex: '#ffffff',
    lab: { L: 100, a: 0, b: 0 },
    lch: { L: 100, C: 0, h: 0 },
    oklab: { L: 1, a: 0, b: 0 },
    oklch: { L: 1, C: 0, h: 0 },
    xyz: { X: 0.95047, Y: 1.0, Z: 1.08883 }
  },
  
  gray50: {
    srgb: { r: 0.5, g: 0.5, b: 0.5 },
    hex: '#808080',
    lab: { L: 53.58501, a: 0, b: 0 },
    lch: { L: 53.58501, C: 0, h: 0 },
    oklab: { L: 0.59987, a: 0, b: 0 },
    oklch: { L: 0.59987, C: 0, h: 0 },
    xyz: { X: 0.2051754, Y: 0.2158633, Z: 0.2350673 }
  },
  
  black: {
    srgb: { r: 0, g: 0, b: 0 },
    hex: '#000000',
    lab: { L: 0, a: 0, b: 0 },
    lch: { L: 0, C: 0, h: 0 },
    oklab: { L: 0, a: 0, b: 0 },
    oklch: { L: 0, C: 0, h: 0 },
    xyz: { X: 0, Y: 0, Z: 0 }
  },
  
  // Test colors
  orange: {
    srgb: { r: 1, g: 0.5, b: 0 },
    hex: '#ff8000',
    lab: { L: 67.05443, a: 43.14406, b: 71.32727 },
    lch: { L: 67.05443, C: 83.35663, h: 58.81935 },
    oklab: { L: 0.71656, a: 0.10667, b: 0.13097 },
    oklch: { L: 0.71656, C: 0.16892, h: 50.83765 },
    xyz: { X: 0.4887, Y: 0.3907, Z: 0.0497 } // Approximate - not critical for tests
  },
  
  purple: {
    srgb: { r: 0.5, g: 0, b: 0.5 },
    hex: '#800080',
    lab: { L: 29.78241, a: 58.93987, b: -36.49788 },
    lch: { L: 29.78241, C: 69.31645, h: 328.23494 },
    oklab: { L: 0.42071, a: 0.16469, b: -0.10152 },
    oklch: { L: 0.42071, C: 0.19351, h: 328.33828 },
    xyz: { X: 0.1277, Y: 0.0641, Z: 0.2108 } // Approximate - not critical for tests
  }
};

/**
 * Generate random color in sRGB space
 * @returns {Object} Random sRGB color
 */
export function randomSrgbColor() {
  return {
    r: Math.random(),
    g: Math.random(),
    b: Math.random()
  };
}

/**
 * Generate random color in Oklab space
 * @returns {Object} Random Oklab color
 */
export function randomOklabColor() {
  return {
    L: Math.random(),
    a: Math.random() * 0.8 - 0.4, // typical range [-0.4, 0.4]
    b: Math.random() * 0.8 - 0.4
  };
}

/**
 * Generate random color in OkLCh space
 * @returns {Object} Random OkLCh color
 */
export function randomOklchColor() {
  return {
    L: Math.random(),
    C: Math.random() * 0.4, // typical max around 0.4
    h: Math.random() * 360
  };
}

/**
 * Check if conversion is reversible (round-trip)
 * @param {Function} forward - Forward conversion function
 * @param {Function} reverse - Reverse conversion function
 * @param {Object} input - Input color
 * @param {number} [tolerance=0.001] - Acceptable difference
 * @returns {boolean} True if conversion is reversible
 */
export function isReversible(forward, reverse, input, tolerance = 0.001) {
  const converted = forward(input);
  const reversed = reverse(converted);
  return colorsApproxEqual(input, reversed, tolerance);
}

/**
 * Measure conversion performance
 * @param {Function} fn - Function to benchmark
 * @param {Object} input - Input to the function
 * @param {number} [iterations=10000] - Number of iterations
 * @returns {number} Average time in milliseconds
 */
export function benchmarkConversion(fn, input, iterations = 10000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(input);
  }
  const end = performance.now();
  return (end - start) / iterations;
}

/**
 * Test viewing conditions for CIECAM16
 */
export const TEST_VIEWING_CONDITIONS = {
  average: {
    whitePoint: { X: 95.047, Y: 100, Z: 108.883 }, // D65
    adaptingLuminance: 40,
    backgroundLuminance: 20,
    surround: 'average',
    discounting: false
  },
  
  dim: {
    whitePoint: { X: 95.047, Y: 100, Z: 108.883 },
    adaptingLuminance: 10,
    backgroundLuminance: 5,
    surround: 'dim',
    discounting: false
  },
  
  dark: {
    whitePoint: { X: 95.047, Y: 100, Z: 108.883 },
    adaptingLuminance: 1,
    backgroundLuminance: 0.1,
    surround: 'dark',
    discounting: false
  }
};

/**
 * Validate color object structure
 * @param {Object} color - Color object to validate
 * @param {string[]} expectedKeys - Expected property names
 * @returns {boolean} True if structure is valid
 */
export function validateColorStructure(color, expectedKeys) {
  if (!color || typeof color !== 'object') return false;
  
  const keys = Object.keys(color).sort();
  const expected = expectedKeys.sort();
  
  if (keys.length !== expected.length) return false;
  
  return keys.every((key, i) => {
    return key === expected[i] && 
           typeof color[key] === 'number' && 
           !isNaN(color[key]);
  });
}