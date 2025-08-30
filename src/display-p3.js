/**
 * @module display-p3
 * @description Display P3 color space conversions and utilities.
 * Display P3 is a wide-gamut RGB color space used by Apple devices and 
 * increasingly supported in modern web browsers.
 * 
 * Display P3 uses DCI-P3 primaries adapted to D65 white point.
 * This implementation follows the CSS Color Module Level 4 specification.
 * 
 * @see {@link https://www.w3.org/TR/css-color-4/#predefined-display-p3}
 */

import { multiplyMatrixVector } from './utils.js';
import { srgbToLinearSrgb, linearSrgbToSrgb } from './srgb.js';

/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {{r: number, g: number, b: number}} DisplayP3Color */
/** @typedef {{r: number, g: number, b: number}} LinearDisplayP3Color */

// --- Display P3 Constants ---

/**
 * Display P3 primaries and white point in CIE xy chromaticity coordinates
 * @private
 */
export const DISPLAY_P3_PRIMARIES = Object.freeze({
  red: { x: 0.680, y: 0.320 },
  green: { x: 0.265, y: 0.690 },
  blue: { x: 0.150, y: 0.060 },
  white: { x: 0.3127, y: 0.3290 } // D65
});

/**
 * Matrix to convert from linear Display P3 to XYZ (D65 adapted)
 * Derived from the Display P3 primaries
 * @private
 */
export const MATRIX_LINEAR_DISPLAY_P3_TO_XYZ_D65 = Object.freeze([
  Object.freeze([0.4865709, 0.2656677, 0.1982173]),
  Object.freeze([0.2289746, 0.6917385, 0.0792869]),
  Object.freeze([0.0000000, 0.0451134, 1.0439444])
]);

/**
 * Matrix to convert from XYZ to linear Display P3 (D65 adapted)
 * Inverse of MATRIX_LINEAR_DISPLAY_P3_TO_XYZ_D65
 * @private
 */
export const MATRIX_XYZ_TO_LINEAR_DISPLAY_P3_D65 = Object.freeze([
  Object.freeze([2.4934969, -0.9313836, -0.4027108]),
  Object.freeze([-0.8294890, 1.7626641, 0.0236247]),
  Object.freeze([0.0358458, -0.0761724, 0.9568845])
]);

/**
 * Matrix for direct linear sRGB to linear Display P3 conversion
 * This is more efficient than going through XYZ
 * @private
 */
export const MATRIX_LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = Object.freeze([
  Object.freeze([0.8224621, 0.1775380, 0.0000000]),
  Object.freeze([0.0331941, 0.9668058, 0.0000001]),
  Object.freeze([0.0170827, 0.0723974, 0.9105199])
]);

/**
 * Matrix for direct linear Display P3 to linear sRGB conversion
 * Inverse of MATRIX_LINEAR_SRGB_TO_LINEAR_DISPLAY_P3
 * @private
 */
export const MATRIX_LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = Object.freeze([
  Object.freeze([1.2249401, -0.2249404, 0.0000003]),
  Object.freeze([-0.0420569, 1.0420571, -0.0000002]),
  Object.freeze([-0.0196376, -0.0786361, 1.0982737])
]);

// --- Gamma Correction ---

/**
 * Apply Display P3 gamma correction (same as sRGB gamma)
 * @private
 */
function displayP3ChannelToLinear(channel) {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/**
 * Remove Display P3 gamma correction (same as sRGB gamma)
 * @private
 */
function linearChannelToDisplayP3(channel) {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

// --- Display P3 ↔ Linear Display P3 ---

/**
 * Convert Display P3 to linear Display P3
 * @param {DisplayP3Color} p3Color - Display P3 color with gamma correction
 * @returns {LinearDisplayP3Color} Linear Display P3 color
 */
export function displayP3ToLinearDisplayP3(p3Color) {
  return {
    r: displayP3ChannelToLinear(p3Color.r),
    g: displayP3ChannelToLinear(p3Color.g),
    b: displayP3ChannelToLinear(p3Color.b)
  };
}

/**
 * Convert linear Display P3 to Display P3 with gamma correction
 * @param {LinearDisplayP3Color} linearP3Color - Linear Display P3 color
 * @returns {DisplayP3Color} Display P3 color with gamma correction
 */
export function linearDisplayP3ToDisplayP3(linearP3Color) {
  return {
    r: linearChannelToDisplayP3(linearP3Color.r),
    g: linearChannelToDisplayP3(linearP3Color.g),
    b: linearChannelToDisplayP3(linearP3Color.b)
  };
}

// --- sRGB ↔ Display P3 Conversions ---

/**
 * Convert sRGB to Display P3
 * @param {SrgbColor} srgbColor - sRGB color
 * @returns {DisplayP3Color} Display P3 color
 * @example
 * // Convert pure red from sRGB to Display P3
 * const p3Red = srgbToDisplayP3({ r: 1, g: 0, b: 0 });
 * // Result: { r: 0.9175, g: 0.2003, b: 0.1386 }
 */
export function srgbToDisplayP3(srgbColor) {
  // Convert to linear sRGB
  const linearSrgb = srgbToLinearSrgb(srgbColor);
  
  // Convert to linear Display P3 using direct matrix
  const [r, g, b] = multiplyMatrixVector(
    MATRIX_LINEAR_SRGB_TO_LINEAR_DISPLAY_P3,
    [linearSrgb.r, linearSrgb.g, linearSrgb.b]
  );
  
  // Apply Display P3 gamma
  return linearDisplayP3ToDisplayP3({ r, g, b });
}

/**
 * Convert Display P3 to sRGB
 * Note: Display P3 has a wider gamut than sRGB, so colors may be clipped
 * @param {DisplayP3Color} p3Color - Display P3 color
 * @returns {SrgbColor} sRGB color (may be clipped if out of gamut)
 */
export function displayP3ToSrgb(p3Color) {
  // Convert to linear Display P3
  const linearP3 = displayP3ToLinearDisplayP3(p3Color);
  
  // Convert to linear sRGB using direct matrix
  const [r, g, b] = multiplyMatrixVector(
    MATRIX_LINEAR_DISPLAY_P3_TO_LINEAR_SRGB,
    [linearP3.r, linearP3.g, linearP3.b]
  );
  
  // Apply sRGB gamma
  return linearSrgbToSrgb({ r, g, b });
}

// --- XYZ ↔ Display P3 Conversions ---

/**
 * Convert linear Display P3 to XYZ (D65)
 * @param {LinearDisplayP3Color} linearP3Color - Linear Display P3 color
 * @returns {{X: number, Y: number, Z: number}} XYZ color
 */
export function linearDisplayP3ToXyz(linearP3Color) {
  const [X, Y, Z] = multiplyMatrixVector(
    MATRIX_LINEAR_DISPLAY_P3_TO_XYZ_D65,
    [linearP3Color.r, linearP3Color.g, linearP3Color.b]
  );
  return { X, Y, Z };
}

/**
 * Convert XYZ (D65) to linear Display P3
 * @param {{X: number, Y: number, Z: number}} xyzColor - XYZ color
 * @returns {LinearDisplayP3Color} Linear Display P3 color
 */
export function xyzToLinearDisplayP3(xyzColor) {
  const [r, g, b] = multiplyMatrixVector(
    MATRIX_XYZ_TO_LINEAR_DISPLAY_P3_D65,
    [xyzColor.X, xyzColor.Y, xyzColor.Z]
  );
  return { r, g, b };
}

// --- Utility Functions ---

/**
 * Check if a Display P3 color is within sRGB gamut
 * @param {DisplayP3Color} p3Color - Display P3 color to check
 * @returns {boolean} True if the color can be represented in sRGB
 */
export function isDisplayP3InSrgbGamut(p3Color) {
  const srgb = displayP3ToSrgb(p3Color);
  const epsilon = 0.00001;
  return (
    srgb.r >= -epsilon && srgb.r <= 1 + epsilon &&
    srgb.g >= -epsilon && srgb.g <= 1 + epsilon &&
    srgb.b >= -epsilon && srgb.b <= 1 + epsilon
  );
}

/**
 * Check if an sRGB color utilizes the extended Display P3 gamut
 * @param {SrgbColor} srgbColor - sRGB color to check
 * @returns {boolean} True if converting to P3 provides a wider gamut representation
 */
export function benefitsFromDisplayP3(srgbColor) {
  const p3 = srgbToDisplayP3(srgbColor);
  // If any P3 channel is significantly different from sRGB, it benefits from P3
  const epsilon = 0.01;
  return (
    Math.abs(p3.r - srgbColor.r) > epsilon ||
    Math.abs(p3.g - srgbColor.g) > epsilon ||
    Math.abs(p3.b - srgbColor.b) > epsilon
  );
}

/**
 * Format a Display P3 color for CSS Color Module Level 4
 * @param {DisplayP3Color} p3Color - Display P3 color
 * @param {number} [precision=4] - Decimal precision
 * @returns {string} CSS color() function string
 * @example
 * formatDisplayP3ForCSS({ r: 0.9175, g: 0.2003, b: 0.1386 })
 * // Returns: "color(display-p3 0.9175 0.2003 0.1386)"
 */
export function formatDisplayP3ForCSS(p3Color, precision = 4) {
  const r = p3Color.r.toFixed(precision);
  const g = p3Color.g.toFixed(precision);
  const b = p3Color.b.toFixed(precision);
  return `color(display-p3 ${r} ${g} ${b})`;
}

/**
 * Parse a CSS Color Module Level 4 display-p3 color
 * @param {string} cssString - CSS color() function string
 * @returns {DisplayP3Color|null} Display P3 color or null if invalid
 * @example
 * parseDisplayP3FromCSS("color(display-p3 0.9175 0.2003 0.1386)")
 * // Returns: { r: 0.9175, g: 0.2003, b: 0.1386 }
 */
export function parseDisplayP3FromCSS(cssString) {
  const match = cssString.match(/color\(\s*display-p3\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) return null;
  
  return {
    r: parseFloat(match[1]),
    g: parseFloat(match[2]),
    b: parseFloat(match[3])
  };
}