/**
 * @module gamut-mapping
 * @description Advanced gamut mapping algorithms for color space conversions.
 * Implements CSS Color Module Level 4 gamut mapping algorithm and other
 * perceptually-based methods to bring out-of-gamut colors into gamut while
 * preserving perceptual attributes.
 * 
 * @see {@link https://www.w3.org/TR/css-color-4/#gamut-mapping}
 */

import { srgbToOklch, oklchToSrgb } from './oklab.js';
import { isSrgbInGamut } from './srgb.js';
import { srgbToDisplayP3, displayP3ToSrgb, isDisplayP3InSrgbGamut } from './display-p3.js';
import { clamp } from './utils.js';


// --- Constants ---

/**
 * Epsilon for gamut checking - accounts for floating point errors
 * @private
 */
const GAMUT_EPSILON = 0.00001;

/**
 * JND (Just Noticeable Difference) in Oklch space
 * Used as threshold for binary search convergence
 * @private
 */
const OKLCH_JND = 0.02;

/**
 * Maximum iterations for iterative algorithms
 * @private
 */
const MAX_ITERATIONS = 50;

// --- Gamut Checking ---

/**
 * Check if a color is within the specified gamut
 * @param {Object} color - Color in any supported space
 * @param {string} [space='srgb'] - Color space of the input
 * @param {string} [targetGamut='srgb'] - Target gamut to check
 * @returns {boolean} True if color is within gamut
 */
export function isInGamut(color, space = 'srgb', targetGamut = 'srgb') {
  let srgbColor;
  
  // Convert to sRGB for checking
  if (space === 'srgb') {
    srgbColor = color;
  } else if (space === 'oklch') {
    srgbColor = oklchToSrgb(color);
  } else if (space === 'display-p3') {
    srgbColor = displayP3ToSrgb(color);
  } else {
    throw new Error(`Unsupported color space: ${space}`);
  }
  
  // Check against target gamut
  if (targetGamut === 'srgb') {
    return isSrgbInGamut(srgbColor);
  } else if (targetGamut === 'display-p3') {
    // For P3, we need to check if the sRGB color fits in P3
    // Since P3 is wider than sRGB, all sRGB colors fit in P3
    return true;
  } else {
    throw new Error(`Unsupported target gamut: ${targetGamut}`);
  }
}

// --- CSS Color 4 Gamut Mapping Algorithm ---

/**
 * CSS Color Module Level 4 gamut mapping algorithm using Oklch
 * This is the standard algorithm for bringing colors into gamut
 * @param {OklchColor} oklchColor - Color in Oklch space
 * @param {string} [targetGamut='srgb'] - Target gamut
 * @returns {OklchColor} Gamut-mapped color in Oklch space
 * @see {@link https://www.w3.org/TR/css-color-4/#css-gamut-mapping}
 */
export function gamutMapOklch(oklchColor, targetGamut = 'srgb') {
  const { L, C, h } = oklchColor;
  
  // Step 1: Check if already in gamut
  if (isInGamut(oklchColor, 'oklch', targetGamut)) {
    return oklchColor;
  }
  
  // Step 2: Binary search for maximum chroma
  let min = 0;
  let max = C;
  let mappedChroma = C;
  
  // Handle achromatic colors (no chroma)
  if (C < GAMUT_EPSILON) {
    // Just clamp lightness
    const clampedL = clamp(L, 0, 1);
    return { L: clampedL, C: 0, h };
  }
  
  // Binary search for maximum in-gamut chroma
  let iterations = 0;
  while (max - min > OKLCH_JND && iterations < MAX_ITERATIONS) {
    mappedChroma = (min + max) / 2;
    const testColor = { L, C: mappedChroma, h };
    
    if (isInGamut(testColor, 'oklch', targetGamut)) {
      min = mappedChroma;
    } else {
      max = mappedChroma;
    }
    iterations++;
  }
  
  return { L, C: min, h };
}

/**
 * Gamut map an sRGB color to fit within a target gamut
 * Uses the CSS Color 4 algorithm via Oklch
 * @param {SrgbColor} srgbColor - Input sRGB color
 * @param {string} [targetGamut='srgb'] - Target gamut
 * @returns {SrgbColor} Gamut-mapped sRGB color
 */
export function gamutMapSrgb(srgbColor, targetGamut = 'srgb') {
  // Check if already in gamut
  if (isInGamut(srgbColor, 'srgb', targetGamut)) {
    return srgbColor;
  }
  
  // Convert to Oklch for mapping
  const oklch = srgbToOklch(srgbColor);
  
  // Apply gamut mapping
  const mappedOklch = gamutMapOklch(oklch, targetGamut);
  
  // Convert back to sRGB
  return oklchToSrgb(mappedOklch);
}

// --- Alternative Gamut Mapping Algorithms ---

/**
 * Simple clip gamut mapping - just clamps values to [0,1]
 * Fast but can cause hue shifts
 * @param {SrgbColor} srgbColor - Input color
 * @returns {SrgbColor} Clipped color
 */
export function clipGamutMapping(srgbColor) {
  return {
    r: clamp(srgbColor.r, 0, 1),
    g: clamp(srgbColor.g, 0, 1),
    b: clamp(srgbColor.b, 0, 1)
  };
}

/**
 * CUSP gamut mapping - finds the cusp (maximum chroma) point
 * for the given hue and maps along the line to the cusp
 * @param {OklchColor} oklchColor - Input color in Oklch
 * @param {string} [targetGamut='srgb'] - Target gamut
 * @returns {OklchColor} Gamut-mapped color
 */
export function cuspGamutMapping(oklchColor, targetGamut = 'srgb') {
  const { L, C, h } = oklchColor;
  
  // Check if already in gamut
  if (isInGamut(oklchColor, 'oklch', targetGamut)) {
    return oklchColor;
  }
  
  // Find the cusp (maximum chroma) for this hue
  const cusp = findCuspForHue(h, targetGamut);
  
  // If we're beyond the cusp, map to it
  if (C > cusp.C) {
    // Linear interpolation to cusp
    const t = cusp.C / C;
    return {
      L: L + t * (cusp.L - L),
      C: cusp.C,
      h
    };
  }
  
  // Otherwise use standard algorithm
  return gamutMapOklch(oklchColor, targetGamut);
}

/**
 * Find the cusp (maximum chroma point) for a given hue
 * @private
 * @param {number} hue - Hue in degrees
 * @param {string} targetGamut - Target gamut
 * @returns {{L: number, C: number}} Cusp point
 */
function findCuspForHue(hue, targetGamut) {
  // Binary search for maximum chroma across all lightness values
  let maxChroma = 0;
  let cuspL = 0.5;
  
  // Sample lightness values to find approximate cusp
  for (let L = 0.1; L <= 0.9; L += 0.1) {
    // Binary search for max chroma at this lightness
    let minC = 0;
    let maxC = 0.5; // Oklch chroma rarely exceeds 0.4
    let iterations = 0;
    
    while (maxC - minC > OKLCH_JND && iterations < 20) {
      const testC = (minC + maxC) / 2;
      const testColor = { L, C: testC, h: hue };
      
      if (isInGamut(testColor, 'oklch', targetGamut)) {
        minC = testC;
      } else {
        maxC = testC;
      }
      iterations++;
    }
    
    if (minC > maxChroma) {
      maxChroma = minC;
      cuspL = L;
    }
  }
  
  // Refine the cusp point with finer search
  let L = cuspL;
  let minC = maxChroma;
  let maxC = maxChroma + 0.1;
  let iterations = 0;
  
  while (maxC - minC > OKLCH_JND / 2 && iterations < 20) {
    const testC = (minC + maxC) / 2;
    const testColor = { L, C: testC, h: hue };
    
    if (isInGamut(testColor, 'oklch', targetGamut)) {
      minC = testC;
    } else {
      maxC = testC;
    }
    iterations++;
  }
  
  return { L: cuspL, C: minC };
}

// --- Adaptive Gamut Mapping ---

/**
 * Adaptive gamut mapping that preserves appearance based on intent
 * @param {OklchColor} oklchColor - Input color
 * @param {Object} options - Mapping options
 * @param {string} [options.targetGamut='srgb'] - Target gamut
 * @param {string} [options.intent='perceptual'] - Rendering intent
 * @returns {OklchColor} Gamut-mapped color
 */
export function adaptiveGamutMapping(oklchColor, options = {}) {
  const {
    targetGamut = 'srgb',
    intent = 'perceptual'
  } = options;
  
  // Check if already in gamut
  if (isInGamut(oklchColor, 'oklch', targetGamut)) {
    return oklchColor;
  }
  
  switch (intent) {
    case 'perceptual':
      // Use CSS algorithm for perceptual mapping
      return gamutMapOklch(oklchColor, targetGamut);
      
    case 'relative-colorimetric':
      // Clip with minimal change
      const srgb = oklchToSrgb(oklchColor);
      const clipped = clipGamutMapping(srgb);
      return srgbToOklch(clipped);
      
    case 'saturation':
      // Preserve saturation, allow lightness shift
      return cuspGamutMapping(oklchColor, targetGamut);
      
    case 'absolute-colorimetric':
      // Direct clip, no adaptation
      return clipGamutMapping(oklchToSrgb(oklchColor));
      
    default:
      return gamutMapOklch(oklchColor, targetGamut);
  }
}

// --- Utility Functions ---

/**
 * Get the gamut volume ratio between two color spaces
 * @param {string} space1 - First color space
 * @param {string} space2 - Second color space
 * @returns {number} Ratio of gamut volumes (>1 means space1 is larger)
 */
export function getGamutVolumeRatio(space1, space2) {
  // Approximate gamut volume ratios relative to sRGB
  const volumes = {
    'srgb': 1.0,
    'display-p3': 1.35,  // ~35% larger than sRGB
    'rec2020': 2.25,     // ~125% larger than sRGB
    'prophoto': 2.8      // ~180% larger than sRGB
  };
  
  const v1 = volumes[space1] || 1.0;
  const v2 = volumes[space2] || 1.0;
  
  return v1 / v2;
}

/**
 * Determine if gamut mapping is needed between spaces
 * @param {string} sourceSpace - Source color space
 * @param {string} targetSpace - Target color space
 * @returns {boolean} True if gamut mapping may be needed
 */
export function needsGamutMapping(sourceSpace, targetSpace) {
  return getGamutVolumeRatio(sourceSpace, targetSpace) > 1.0;
}