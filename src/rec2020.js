/**
 * @module rec2020
 * @description ITU-R Rec. 2020 (Rec. 2020) color space conversions and utilities.
 * Rec. 2020 is an ultra-wide gamut RGB color space used for UHDTV (4K/8K) and HDR content.
 * It encompasses 75.8% of the CIE 1931 color space, significantly larger than sRGB (35.9%)
 * and Display P3 (53.6%).
 * 
 * @see {@link https://www.itu.int/rec/R-REC-BT.2020}
 */

import { multiplyMatrixVector } from './utils.js';
import { srgbToLinearSrgb, linearSrgbToSrgb } from './srgb.js';

/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {{r: number, g: number, b: number}} Rec2020Color */
/** @typedef {{r: number, g: number, b: number}} LinearRec2020Color */

// --- Rec. 2020 Constants ---

/**
 * Rec. 2020 primaries and white point in CIE xy chromaticity coordinates
 * @private
 */
export const REC2020_PRIMARIES = Object.freeze({
  red: { x: 0.708, y: 0.292 },
  green: { x: 0.170, y: 0.797 },
  blue: { x: 0.131, y: 0.046 },
  white: { x: 0.3127, y: 0.3290 } // D65
});

/**
 * Matrix to convert from linear Rec. 2020 to XYZ (D65)
 * Derived from the Rec. 2020 primaries
 * @private
 */
export const MATRIX_LINEAR_REC2020_TO_XYZ_D65 = Object.freeze([
  Object.freeze([0.6369580, 0.1446169, 0.1688810]),
  Object.freeze([0.2627002, 0.6779981, 0.0593017]),
  Object.freeze([0.0000000, 0.0280727, 1.0609851])
]);

/**
 * Matrix to convert from XYZ to linear Rec. 2020 (D65)
 * Inverse of MATRIX_LINEAR_REC2020_TO_XYZ_D65
 * @private
 */
export const MATRIX_XYZ_TO_LINEAR_REC2020_D65 = Object.freeze([
  Object.freeze([1.7166511, -0.3556708, -0.2533663]),
  Object.freeze([-0.6666844, 1.6164812, 0.0157685]),
  Object.freeze([0.0176399, -0.0427706, 0.9421031])
]);

/**
 * Matrix for direct linear sRGB to linear Rec. 2020 conversion
 * @private
 */
export const MATRIX_LINEAR_SRGB_TO_LINEAR_REC2020 = Object.freeze([
  Object.freeze([0.6274040, 0.3292820, 0.0433136]),
  Object.freeze([0.0690970, 0.9195400, 0.0113612]),
  Object.freeze([0.0163916, 0.0880132, 0.8955950])
]);

/**
 * Matrix for direct linear Rec. 2020 to linear sRGB conversion
 * @private
 */
export const MATRIX_LINEAR_REC2020_TO_LINEAR_SRGB = Object.freeze([
  Object.freeze([1.6605010, -0.5876411, -0.0728499]),
  Object.freeze([-0.1246611, 1.1329096, -0.0082485]),
  Object.freeze([-0.0181508, -0.1005789, 1.1187297])
]);

// --- Gamma Correction ---

/**
 * Rec. 2020 uses the same transfer function as Rec. 709 (BT.709)
 * which is slightly different from sRGB
 * @private
 */
const REC2020_ALPHA = 1.09929682680944;
const REC2020_BETA = 0.018053968510807;

/**
 * Apply Rec. 2020 gamma correction (OETF - Opto-Electronic Transfer Function)
 * @private
 */
function rec2020ChannelToLinear(channel) {
  if (channel === 0) return 0;
  if (channel === 1) return 1;
  
  // Rec. 2020 uses Rec. 709 transfer function
  if (channel < 0) {
    return -rec2020ChannelToLinear(-channel);
  }
  
  if (channel < REC2020_BETA * 4.5) {
    return channel / 4.5;
  }
  
  return Math.pow((channel + (REC2020_ALPHA - 1)) / REC2020_ALPHA, 1 / 0.45);
}

/**
 * Remove Rec. 2020 gamma correction (EOTF - Electro-Optical Transfer Function)
 * @private
 */
function linearChannelToRec2020(channel) {
  if (channel === 0) return 0;
  if (channel === 1) return 1;
  
  if (channel < 0) {
    return -linearChannelToRec2020(-channel);
  }
  
  if (channel < REC2020_BETA) {
    return channel * 4.5;
  }
  
  return REC2020_ALPHA * Math.pow(channel, 0.45) - (REC2020_ALPHA - 1);
}

// --- Rec. 2020 ↔ Linear Rec. 2020 ---

/**
 * Convert Rec. 2020 to linear Rec. 2020
 * @param {Rec2020Color} rec2020Color - Rec. 2020 color with gamma correction
 * @returns {LinearRec2020Color} Linear Rec. 2020 color
 */
export function rec2020ToLinearRec2020(rec2020Color) {
  return {
    r: rec2020ChannelToLinear(rec2020Color.r),
    g: rec2020ChannelToLinear(rec2020Color.g),
    b: rec2020ChannelToLinear(rec2020Color.b)
  };
}

/**
 * Convert linear Rec. 2020 to Rec. 2020 with gamma correction
 * @param {LinearRec2020Color} linearRec2020Color - Linear Rec. 2020 color
 * @returns {Rec2020Color} Rec. 2020 color with gamma correction
 */
export function linearRec2020ToRec2020(linearRec2020Color) {
  return {
    r: linearChannelToRec2020(linearRec2020Color.r),
    g: linearChannelToRec2020(linearRec2020Color.g),
    b: linearChannelToRec2020(linearRec2020Color.b)
  };
}

// --- sRGB ↔ Rec. 2020 Conversions ---

/**
 * Convert sRGB to Rec. 2020
 * @param {SrgbColor} srgbColor - sRGB color
 * @returns {Rec2020Color} Rec. 2020 color
 * @example
 * // Convert pure red from sRGB to Rec. 2020
 * const rec2020Red = srgbToRec2020({ r: 1, g: 0, b: 0 });
 */
export function srgbToRec2020(srgbColor) {
  // Convert to linear sRGB
  const linearSrgb = srgbToLinearSrgb(srgbColor);
  
  // Convert to linear Rec. 2020 using direct matrix
  const [r, g, b] = multiplyMatrixVector(
    MATRIX_LINEAR_SRGB_TO_LINEAR_REC2020,
    [linearSrgb.r, linearSrgb.g, linearSrgb.b]
  );
  
  // Apply Rec. 2020 gamma
  return linearRec2020ToRec2020({ r, g, b });
}

/**
 * Convert Rec. 2020 to sRGB
 * Note: Rec. 2020 has a much wider gamut than sRGB, so colors will often be clipped
 * @param {Rec2020Color} rec2020Color - Rec. 2020 color
 * @returns {SrgbColor} sRGB color (likely clipped if out of gamut)
 */
export function rec2020ToSrgb(rec2020Color) {
  // Convert to linear Rec. 2020
  const linearRec2020 = rec2020ToLinearRec2020(rec2020Color);
  
  // Convert to linear sRGB using direct matrix
  const [r, g, b] = multiplyMatrixVector(
    MATRIX_LINEAR_REC2020_TO_LINEAR_SRGB,
    [linearRec2020.r, linearRec2020.g, linearRec2020.b]
  );
  
  // Apply sRGB gamma
  return linearSrgbToSrgb({ r, g, b });
}

// --- XYZ ↔ Rec. 2020 Conversions ---

/**
 * Convert linear Rec. 2020 to XYZ (D65)
 * @param {LinearRec2020Color} linearRec2020Color - Linear Rec. 2020 color
 * @returns {{X: number, Y: number, Z: number}} XYZ color
 */
export function linearRec2020ToXyz(linearRec2020Color) {
  const [X, Y, Z] = multiplyMatrixVector(
    MATRIX_LINEAR_REC2020_TO_XYZ_D65,
    [linearRec2020Color.r, linearRec2020Color.g, linearRec2020Color.b]
  );
  return { X, Y, Z };
}

/**
 * Convert XYZ (D65) to linear Rec. 2020
 * @param {{X: number, Y: number, Z: number}} xyzColor - XYZ color
 * @returns {LinearRec2020Color} Linear Rec. 2020 color
 */
export function xyzToLinearRec2020(xyzColor) {
  const [r, g, b] = multiplyMatrixVector(
    MATRIX_XYZ_TO_LINEAR_REC2020_D65,
    [xyzColor.X, xyzColor.Y, xyzColor.Z]
  );
  return { r, g, b };
}

// --- Utility Functions ---

/**
 * Check if a Rec. 2020 color is within sRGB gamut
 * @param {Rec2020Color} rec2020Color - Rec. 2020 color to check
 * @returns {boolean} True if the color can be represented in sRGB
 */
export function isRec2020InSrgbGamut(rec2020Color) {
  const srgb = rec2020ToSrgb(rec2020Color);
  const epsilon = 0.00001;
  return (
    srgb.r >= -epsilon && srgb.r <= 1 + epsilon &&
    srgb.g >= -epsilon && srgb.g <= 1 + epsilon &&
    srgb.b >= -epsilon && srgb.b <= 1 + epsilon
  );
}

/**
 * Check if an sRGB color would benefit from Rec. 2020's wider gamut
 * @param {SrgbColor} srgbColor - sRGB color to check
 * @returns {boolean} True if converting to Rec. 2020 provides a wider gamut representation
 */
export function benefitsFromRec2020(srgbColor) {
  // For colors already in sRGB gamut, Rec. 2020 provides more precise representation
  // but not necessarily "wider" - this is mainly useful for HDR content
  const rec2020 = srgbToRec2020(srgbColor);
  
  // Check if the color uses the extended range
  const epsilon = 0.01;
  return (
    Math.abs(rec2020.r - srgbColor.r) > epsilon ||
    Math.abs(rec2020.g - srgbColor.g) > epsilon ||
    Math.abs(rec2020.b - srgbColor.b) > epsilon
  );
}

/**
 * Format a Rec. 2020 color for CSS Color Module Level 4
 * @param {Rec2020Color} rec2020Color - Rec. 2020 color
 * @param {number} [precision=4] - Decimal precision
 * @returns {string} CSS color() function string
 * @example
 * formatRec2020ForCSS({ r: 0.627, g: 0.069, b: 0.016 })
 * // Returns: "color(rec2020 0.627 0.069 0.016)"
 */
export function formatRec2020ForCSS(rec2020Color, precision = 4) {
  const r = rec2020Color.r.toFixed(precision);
  const g = rec2020Color.g.toFixed(precision);
  const b = rec2020Color.b.toFixed(precision);
  return `color(rec2020 ${r} ${g} ${b})`;
}

/**
 * Parse a CSS Color Module Level 4 rec2020 color
 * @param {string} cssString - CSS color() function string
 * @returns {Rec2020Color|null} Rec. 2020 color or null if invalid
 * @example
 * parseRec2020FromCSS("color(rec2020 0.627 0.069 0.016)")
 * // Returns: { r: 0.627, g: 0.069, b: 0.016 }
 */
export function parseRec2020FromCSS(cssString) {
  const match = cssString.match(/color\(\s*rec2020\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) return null;
  
  return {
    r: parseFloat(match[1]),
    g: parseFloat(match[2]),
    b: parseFloat(match[3])
  };
}

/**
 * Get the gamut volume of Rec. 2020 relative to other spaces
 * @param {string} [compareSpace='srgb'] - Space to compare against
 * @returns {number} Ratio of gamut volumes
 */
export function getRec2020GamutRatio(compareSpace = 'srgb') {
  const volumes = {
    'srgb': 2.25,      // Rec. 2020 is ~125% larger than sRGB
    'display-p3': 1.67, // Rec. 2020 is ~67% larger than Display P3
    'rec2020': 1.0,     // Same space
    'prophoto': 0.8     // Rec. 2020 is ~80% of ProPhoto RGB
  };
  
  return volumes[compareSpace] || 1.0;
}

