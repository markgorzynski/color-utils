/**
 * @module gamut
 * @description Gamut validation and management functions following industry standards.
 * 
 * DESIGN PRINCIPLES:
 * ==================
 * - Core conversions process out-of-range values
 * - Validation is opt-in via these utility functions
 * - Multiple strategies for different use cases
 * - No automatic clamping in mathematical operations
 * 
 * @see RANGE_STANDARDS.md for detailed conventions
 */

/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {import('./types.js').LabColor} LabColor */
/** @typedef {import('./types.js').OklabColor} OklabColor */

/**
 * Checks if an sRGB color is within the standard [0,1] gamut.
 * 
 * @param {SrgbColor} srgb - sRGB color to check
 * @param {number} [epsilon=1e-10] - Tolerance for floating point comparison
 * @returns {boolean} True if all components are within [0,1]
 * 
 * @example
 * isSrgbInGamut({r: 0.5, g: 0.3, b: 0.8}) // true
 * isSrgbInGamut({r: 1.1, g: 0.5, b: -0.1}) // false
 * isSrgbInGamut({r: 1.0000000001, g: 0.5, b: 0.5}, 1e-9) // true (within tolerance)
 */
export function isSrgbInGamut(srgb, epsilon = 1e-10) {
  return srgb.r >= -epsilon && srgb.r <= 1 + epsilon &&
         srgb.g >= -epsilon && srgb.g <= 1 + epsilon &&
         srgb.b >= -epsilon && srgb.b <= 1 + epsilon;
}

/**
 * Simple clamping of sRGB values to [0,1] range.
 * Fast but can shift hue for out-of-gamut colors.
 * 
 * @param {SrgbColor} srgb - sRGB color to clamp
 * @returns {SrgbColor} Clamped color with all components in [0,1]
 * 
 * @example
 * clampSrgb({r: 1.2, g: 0.5, b: -0.1}) // {r: 1, g: 0.5, b: 0}
 */
export function clampSrgb(srgb) {
  return {
    r: Math.max(0, Math.min(1, srgb.r)),
    g: Math.max(0, Math.min(1, srgb.g)),
    b: Math.max(0, Math.min(1, srgb.b))
  };
}

/**
 * Checks if a CIELAB color is within typical display gamut.
 * Note: Lab space can represent colors outside any display gamut.
 * 
 * @param {LabColor} lab - CIELAB color to check
 * @returns {boolean} True if within typical ranges
 * 
 * Typical ranges:
 * - L*: [0, 100]
 * - a*: [-128, 127]  
 * - b*: [-128, 127]
 */
export function isLabInTypicalRange(lab) {
  return lab.L >= 0 && lab.L <= 100 &&
         lab.a >= -128 && lab.a <= 127 &&
         lab.b >= -128 && lab.b <= 127;
}

/**
 * Checks if an Oklab color is within typical display gamut.
 * 
 * @param {OklabColor} oklab - Oklab color to check
 * @returns {boolean} True if within typical ranges
 * 
 * Typical ranges:
 * - L: [0, 1]
 * - a: [-0.4, 0.4]
 * - b: [-0.4, 0.4]
 */
export function isOklabInTypicalRange(oklab) {
  return oklab.L >= 0 && oklab.L <= 1 &&
         oklab.a >= -0.4 && oklab.a <= 0.4 &&
         oklab.b >= -0.4 && oklab.b <= 0.4;
}

/**
 * Validates that an object has the required sRGB properties.
 * Does NOT validate ranges, only structure.
 * 
 * @param {any} obj - Object to validate
 * @returns {boolean} True if object has numeric r, g, b properties
 */
export function isValidSrgbObject(obj) {
  return obj != null &&
         typeof obj === 'object' &&
         typeof obj.r === 'number' && !Number.isNaN(obj.r) &&
         typeof obj.g === 'number' && !Number.isNaN(obj.g) &&
         typeof obj.b === 'number' && !Number.isNaN(obj.b);
}

/**
 * Validates that an object has the required Lab properties.
 * Does NOT validate ranges, only structure.
 * 
 * @param {any} obj - Object to validate
 * @returns {boolean} True if object has numeric L, a, b properties
 */
export function isValidLabObject(obj) {
  return obj != null &&
         typeof obj === 'object' &&
         typeof obj.L === 'number' && !Number.isNaN(obj.L) &&
         typeof obj.a === 'number' && !Number.isNaN(obj.a) &&
         typeof obj.b === 'number' && !Number.isNaN(obj.b);
}

/**
 * Clamps a numeric value to a range.
 * Helper function for custom clamping operations.
 * 
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Scales an sRGB color uniformly until it fits within gamut.
 * Preserves hue better than channel clamping but reduces saturation.
 * 
 * @param {SrgbColor} srgb - sRGB color to scale
 * @returns {SrgbColor} Scaled color within [0,1] gamut
 * 
 * @example
 * scaleToSrgbGamut({r: 1.2, g: 0.6, b: 0.3}) // Scales all channels by 1/1.2
 */
export function scaleToSrgbGamut(srgb) {
  const maxChannel = Math.max(srgb.r, srgb.g, srgb.b);
  const minChannel = Math.min(srgb.r, srgb.g, srgb.b);
  
  // If already in gamut, return as-is
  if (maxChannel <= 1 && minChannel >= 0) {
    return srgb;
  }
  
  // For colors with negative values, we need to shift and scale
  if (minChannel < 0) {
    // Shift all channels to make minimum 0
    const shift = -minChannel;
    const shiftedR = srgb.r + shift;
    const shiftedG = srgb.g + shift;
    const shiftedB = srgb.b + shift;
    const maxShifted = Math.max(shiftedR, shiftedG, shiftedB);
    
    // Scale down if needed
    if (maxShifted > 1) {
      const scale = 1 / maxShifted;
      return {
        r: shiftedR * scale,
        g: shiftedG * scale,
        b: shiftedB * scale
      };
    }
    return { r: shiftedR, g: shiftedG, b: shiftedB };
  }
  
  // For colors that only exceed 1, simple scaling
  if (maxChannel > 1) {
    const scale = 1 / maxChannel;
    return {
      r: srgb.r * scale,
      g: srgb.g * scale,
      b: srgb.b * scale
    };
  }
  
  return srgb;
}

/**
 * Gets the maximum displayable chroma for a given lightness and hue.
 * Uses binary search to find the gamut boundary.
 * 
 * @param {number} L - Lightness (0-100 for Lab, 0-1 for Oklab)
 * @param {number} h - Hue angle in degrees [0, 360)
 * @param {string} [space='oklch'] - Color space to use ('lch' or 'oklch')
 * @param {number} [precision=0.001] - Search precision
 * @returns {number} Maximum chroma that stays in sRGB gamut
 */
export function getMaxChroma(L, h, space = 'oklch', precision = 0.001) {
  // Import only if needed to avoid circular dependencies
  const { lchToSrgb } = require('./cielab.js');
  const { oklchToSrgb } = require('./oklab.js');
  
  const toSrgb = space === 'lch' ? lchToSrgb : oklchToSrgb;
  
  // Binary search for maximum chroma
  let low = 0;
  let high = space === 'lch' ? 150 : 0.5; // Reasonable upper bounds
  
  while (high - low > precision) {
    const mid = (low + high) / 2;
    const color = { L, C: mid, h };
    const srgb = toSrgb(color);
    
    if (isSrgbInGamut(srgb)) {
      low = mid;
    } else {
      high = mid;
    }
  }
  
  return low;
}

/**
 * Information about gamut check results.
 * @typedef {Object} GamutInfo
 * @property {boolean} inGamut - Whether color is in gamut
 * @property {number[]} channels - Array of channel values
 * @property {number} maxExcess - Maximum amount any channel exceeds bounds
 * @property {number} minDeficit - Maximum amount any channel is below bounds
 */

/**
 * Detailed gamut check with information about how far out of gamut.
 * 
 * @param {SrgbColor} srgb - sRGB color to check
 * @returns {GamutInfo} Detailed gamut information
 * 
 * @example
 * const info = getSrgbGamutInfo({r: 1.2, g: 0.5, b: -0.1});
 * // { inGamut: false, channels: [1.2, 0.5, -0.1], maxExcess: 0.2, minDeficit: 0.1 }
 */
export function getSrgbGamutInfo(srgb) {
  const channels = [srgb.r, srgb.g, srgb.b];
  const maxExcess = Math.max(0, ...channels.map(c => c - 1));
  const minDeficit = Math.max(0, ...channels.map(c => -c));
  
  return {
    inGamut: maxExcess === 0 && minDeficit === 0,
    channels,
    maxExcess,
    minDeficit
  };
}

// Re-export the advanced gamut mapping from existing module
export { gamutMapOklch, gamutMapSrgb, isInGamut } from './gamut-mapping.js';