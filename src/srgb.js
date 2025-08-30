/**
 * @module srgb
 * @description Conversion routines between CIE XYZ and sRGB color spaces.
 * 
 * IMPORTANT:
 * - These conversion functions do NOT perform any clamping unless explicitly stated.
 * - Raw linear or gamma-encoded sRGB values may be <0 or >1 if out-of-gamut.
 * - To safely format or display colors, clamp values into [0,1].
 */

import { multiplyMatrixVector, clamp } from './utils.js';

/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {import('./types.js').LinearSrgbColor} LinearSrgbColor */
/** @typedef {import('./types.js').XyzColor} XyzColor */

// --- Conversion Matrices ---

/**
 * Bradford-adapted D65 sRGB matrix for Linear sRGB -> XYZ
 * @private
 */
export const MATRIX_LINEAR_SRGB_TO_XYZ_D65 = Object.freeze([
  Object.freeze([0.4124564, 0.3575761, 0.1804375]),
  Object.freeze([0.2126729, 0.7151522, 0.0721750]),
  Object.freeze([0.0193339, 0.1191920, 0.9503041])
]);

/**
 * Bradford-adapted D65 sRGB matrix for XYZ -> Linear sRGB (inverse of above)
 * @private
 */
export const MATRIX_XYZ_TO_LINEAR_SRGB_D65 = Object.freeze([
  Object.freeze([3.2404542, -1.5371385, -0.4985314]),
  Object.freeze([-0.9692660, 1.8760108, 0.0415560]),
  Object.freeze([0.0556434, -0.2040259, 1.0572252])
]);

// --- sRGB Gamma Correction (Optimized from abridged version) ---

/**
 * Applies the sRGB inverse electro-optical transfer function (inverse EOTF / gamma expansion)
 * to convert gamma-corrected sRGB channel to linear sRGB.
 * @private
 * @param {number} c - Gamma-corrected sRGB channel value (typically 0-1).
 * @returns {number} Linear sRGB channel value.
 */
function srgbChannelToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Applies the sRGB electro-optical transfer function (OETF / gamma compression)
 * to linear sRGB channel to get gamma-corrected sRGB.
 * @private
 * @param {number} c - Linear sRGB channel value.
 * @returns {number} Gamma-corrected sRGB channel value.
 */
function linearChannelToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// --- sRGB <-> Linear sRGB ---

/**
 * Converts gamma-corrected sRGB to linear sRGB.
 * @param {SrgbColor} srgbColor - The sRGB color { r, g, b }.
 * @returns {LinearSrgbColor} The linear sRGB color { r, g, b }.
 */
export function srgbToLinearSrgb({ r, g, b }) {
  return {
    r: srgbChannelToLinear(r),
    g: srgbChannelToLinear(g),
    b: srgbChannelToLinear(b),
  };
}

/**
 * Converts linear sRGB to gamma-corrected sRGB.
 * @param {LinearSrgbColor} linearSrgbColor - The linear sRGB color { r, g, b }.
 * @returns {SrgbColor} The gamma-corrected sRGB color { r, g, b }.
 */
export function linearSrgbToSrgb({ r, g, b }) {
  return {
    r: linearChannelToSrgb(r),
    g: linearChannelToSrgb(g),
    b: linearChannelToSrgb(b),
  };
}

// --- Linear sRGB <-> XYZ (D65) ---

/**
 * Converts linear sRGB to CIE XYZ (D65).
 * Values are scaled 0-1 for compatibility with the rest of the library.
 * @param {LinearSrgbColor} linearSrgbColor - The linear sRGB color { r, g, b }.
 * @returns {XyzColor} The CIE XYZ color { X, Y, Z } scaled 0-1.
 */
export function linearSrgbToXyz({ r, g, b }) {
  const [X, Y, Z] = multiplyMatrixVector(MATRIX_LINEAR_SRGB_TO_XYZ_D65, [r, g, b]);
  return { X, Y, Z };
}

/**
 * Converts CIE XYZ (D65) to linear sRGB.
 * Expects XYZ values scaled 0-1.
 * @param {XyzColor} xyzColor - The CIE XYZ color { X, Y, Z } scaled 0-1.
 * @returns {LinearSrgbColor} The linear sRGB color { r, g, b }.
 */
export function xyzToLinearSrgb({ X, Y, Z }) {
  const [r, g, b] = multiplyMatrixVector(MATRIX_XYZ_TO_LINEAR_SRGB_D65, [X, Y, Z]);
  return { r, g, b };
}

// --- Convenience Functions: sRGB <-> XYZ ---

/**
 * Converts gamma-corrected sRGB directly to CIE XYZ (D65).
 * @param {SrgbColor} srgbColor - The sRGB color { r, g, b }.
 * @returns {XyzColor} The CIE XYZ color { X, Y, Z } scaled 0-1.
 */
export function srgbToXyz(srgbColor) {
  return linearSrgbToXyz(srgbToLinearSrgb(srgbColor));
}

/**
 * Converts CIE XYZ (D65) directly to gamma-corrected sRGB.
 * @param {XyzColor} xyzColor - The CIE XYZ color { X, Y, Z } scaled 0-1.
 * @returns {SrgbColor} The sRGB color { r, g, b }.
 */
export function xyzToSrgb(xyzColor) {
  return linearSrgbToSrgb(xyzToLinearSrgb(xyzColor));
}

// --- Hex Color String Utilities (from abridged version) ---

/**
 * Parses a hex color string to normalized sRGB object.
 * @param {string} hexStr - Hex color string with or without '#' prefix.
 * @returns {SrgbColor} sRGB color with values 0-1.
 * @throws {TypeError} If input is not a string.
 * @throws {SyntaxError} If hex format is invalid.
 * @example
 * parseSrgbHex('#FF5733') // { r: 1, g: 0.341, b: 0.2 }
 * parseSrgbHex('FF5733')  // { r: 1, g: 0.341, b: 0.2 }
 * parseSrgbHex('#F53')    // { r: 1, g: 0.333, b: 0.2 }
 */
export function parseSrgbHex(hexStr) {
  if (typeof hexStr !== 'string') {
    throw new TypeError('Input hexString must be a string.');
  }
  
  const hex = hexStr.startsWith('#') ? hexStr.slice(1) : hexStr;
  
  if (!/^(?:[0-9a-fA-F]{3}){1,2}$/.test(hex)) {
    throw new SyntaxError(`Invalid hex color string format: "${hexStr}"`);
  }
  
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  
  return { r: r / 255, g: g / 255, b: b / 255 };
}

/**
 * Formats an sRGB object as uppercase hex string.
 * Values are clamped to [0, 1] before conversion.
 * @param {SrgbColor} srgb - sRGB color with values 0-1.
 * @returns {string} Hex color string like "#FF5733".
 * @throws {TypeError} If input is not a valid sRGB object.
 * @example
 * formatSrgbAsHex({ r: 1, g: 0.341, b: 0.2 }) // "#FF5733"
 */
export function formatSrgbAsHex(srgb) {
  if (typeof srgb !== 'object' || srgb === null ||
      typeof srgb.r !== 'number' || typeof srgb.g !== 'number' || typeof srgb.b !== 'number') {
    throw new TypeError('Input srgbColor must be an object with r, g, b number properties.');
  }
  
  const toHexPart = (channelValue) => {
    const clampedValue = clamp(channelValue, 0, 1);
    const intValue = Math.round(clampedValue * 255);
    const hexPart = intValue.toString(16);
    return hexPart.length === 1 ? '0' + hexPart : hexPart;
  };
  
  return `#${toHexPart(srgb.r)}${toHexPart(srgb.g)}${toHexPart(srgb.b)}`.toUpperCase();
}

/**
 * Checks if an sRGB color is within gamut.
 * Allows small epsilon for floating point errors.
 * @param {SrgbColor} srgb - The sRGB color to check.
 * @returns {boolean} True if the color is within gamut.
 */
export function isSrgbInGamut(srgb) {
  const epsilon = 0.005;
  return srgb.r >= -epsilon && srgb.r <= 1 + epsilon &&
         srgb.g >= -epsilon && srgb.g <= 1 + epsilon &&
         srgb.b >= -epsilon && srgb.b <= 1 + epsilon;
}