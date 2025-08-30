/**
 * @module srgb
 * @description Functions for sRGB color space conversions, including transformations
 * to and from Linear sRGB and CIE XYZ (D65). Also includes utilities for
 * parsing and formatting sRGB hex strings.
 * All sRGB and Linear sRGB component values are expected to be in the 0-1 range.
 * CIE XYZ values also assume Y is in the 0-1 range for D65 as per ARCHITECTURE.md.
 */

import {
  multiplyMatrixVector,
  clamp, // utils.js still provides clamp
  // D65_WHITE_POINT_XYZ // Not directly used here as matrices are D65 specific
} from './utils.js';

// Assuming SrgbColor, LinearSrgbColor, and XyzColor are defined in types.js


// --- Internal sRGB EOTF Channel Helpers ---

/**
 * Converts a single sRGB channel value (0-1 range) to its linear equivalent.
 * This function implements the official sRGB EOTF decoding.
 * @private
 * @param {number} channelValue - The sRGB channel value (e.g., R, G, or B) in the range [0, 1].
 * @returns {number} The linear sRGB channel value.
 */
function _srgbChannelToLinear(channelValue) {
  if (typeof channelValue !== 'number') {
    throw new TypeError('Input channelValue must be a number for _srgbChannelToLinear.');
  }
  return channelValue <= 0.04045 ? channelValue / 12.92 : Math.pow((channelValue + 0.055) / 1.055, 2.4);
}

/**
 * Converts a single linear sRGB channel value (0-1 range) to its gamma-corrected sRGB equivalent.
 * This function implements the official sRGB EOTF encoding.
 * @private
 * @param {number} channelValue - The linear sRGB channel value (e.g., R, G, or B) in the range [0, 1].
 * @returns {number} The gamma-corrected sRGB channel value.
 */
function _linearChannelToSrgb(channelValue) {
  if (typeof channelValue !== 'number') {
    throw new TypeError('Input channelValue must be a number for _linearChannelToSrgb.');
  }
  return channelValue <= 0.0031308 ? channelValue * 12.92 : 1.055 * Math.pow(channelValue, 1 / 2.4) - 0.055;
}


// --- Constants for sRGB <-> XYZ (D65) Transformations ---
const MATRIX_LINEAR_SRGB_TO_XYZ_D65 = Object.freeze([
  Object.freeze([0.4124564, 0.3575761, 0.1804375]),
  Object.freeze([0.2126729, 0.7151522, 0.0721750]),
  Object.freeze([0.0193339, 0.1191920, 0.9503041]),
]);

const MATRIX_XYZ_TO_LINEAR_SRGB_D65 = Object.freeze([
  Object.freeze([3.2404542, -1.5371385, -0.4985314]),
  Object.freeze([-0.9692660, 1.8760108, 0.0415560]),
  Object.freeze([0.0556434, -0.2040259, 1.0572252]),
]);


// --- sRGB (gamma) <-> Linear sRGB Object Conversions ---

/**
 * Converts an sRGB color object to a Linear sRGB color object.
 * @param {SrgbColor} srgbColor - The sRGB color object {r, g, b} with components in [0, 1].
 * @returns {LinearSrgbColor} The Linear sRGB color object {r, g, b}.
 * @throws {TypeError} if srgbColor is not a valid SrgbColor object.
 */
export function srgbToLinearSrgb(srgbColor) {
  if (typeof srgbColor !== 'object' || srgbColor === null ||
      typeof srgbColor.r !== 'number' || typeof srgbColor.g !== 'number' || typeof srgbColor.b !== 'number') {
    throw new TypeError('Input srgbColor must be an object with r, g, b number properties.');
  }
  return {
    r: _srgbChannelToLinear(srgbColor.r),
    g: _srgbChannelToLinear(srgbColor.g),
    b: _srgbChannelToLinear(srgbColor.b),
  };
}

/**
 * Converts a Linear sRGB color object to an sRGB (gamma-corrected) color object.
 * @param {LinearSrgbColor} linearSrgbColor - The Linear sRGB color object {r, g, b}.
 * @returns {SrgbColor} The sRGB color object {r, g, b}.
 * @throws {TypeError} if linearSrgbColor is not a valid LinearSrgbColor object.
 */
export function linearSrgbToSrgb(linearSrgbColor) {
  if (typeof linearSrgbColor !== 'object' || linearSrgbColor === null ||
      typeof linearSrgbColor.r !== 'number' || typeof linearSrgbColor.g !== 'number' || typeof linearSrgbColor.b !== 'number') {
    throw new TypeError('Input linearSrgbColor must be an object with r, g, b number properties.');
  }
  return {
    r: _linearChannelToSrgb(linearSrgbColor.r),
    g: _linearChannelToSrgb(linearSrgbColor.g),
    b: _linearChannelToSrgb(linearSrgbColor.b),
  };
}

// --- Linear sRGB <-> XYZ Object Conversions ---

/**
 * Converts a Linear sRGB color object to a CIE XYZ (D65) color object.
 * Output XYZ color will have Y in the range [0, 1].
 * @param {LinearSrgbColor} linearSrgbColor - The Linear sRGB color object {r, g, b}.
 * @returns {XyzColor} The CIE XYZ color object {x, y, z}.
 * @throws {TypeError} if linearSrgbColor is not a valid LinearSrgbColor object.
 */
export function linearSrgbToXyz(linearSrgbColor) {
  if (typeof linearSrgbColor !== 'object' || linearSrgbColor === null ||
      typeof linearSrgbColor.r !== 'number' || typeof linearSrgbColor.g !== 'number' || typeof linearSrgbColor.b !== 'number') {
    throw new TypeError('Input linearSrgbColor must be an object with r, g, b number properties.');
  }
  const { r, g, b } = linearSrgbColor;
  const xyzArray = multiplyMatrixVector(MATRIX_LINEAR_SRGB_TO_XYZ_D65, [r, g, b]);
  return { x: xyzArray[0], y: xyzArray[1], z: xyzArray[2] };
}

/**
 * Converts a CIE XYZ (D65) color object to a Linear sRGB color object.
 * Assumes input XYZ color has Y in the range [0, 1].
 * @param {XyzColor} xyzColor - The CIE XYZ color object {x, y, z}.
 * @returns {LinearSrgbColor} The Linear sRGB color object {r, g, b}.
 * @throws {TypeError} if xyzColor is not a valid XyzColor object.
 */
export function xyzToLinearSrgb(xyzColor) {
  if (typeof xyzColor !== 'object' || xyzColor === null ||
      typeof xyzColor.x !== 'number' || typeof xyzColor.y !== 'number' || typeof xyzColor.z !== 'number') {
    throw new TypeError('Input xyzColor must be an object with x, y, z number properties.');
  }
  const { x, y, z } = xyzColor;
  const rgbArray = multiplyMatrixVector(MATRIX_XYZ_TO_LINEAR_SRGB_D65, [x, y, z]);
  return { r: rgbArray[0], g: rgbArray[1], b: rgbArray[2] };
}

// --- Convenience Pipeline Functions ---

/**
 * Converts an sRGB color object directly to a CIE XYZ (D65) color object.
 * @param {SrgbColor} srgbColor - The sRGB color object {r, g, b}.
 * @returns {XyzColor} The CIE XYZ color object {x, y, z}.
 */
export function srgbToXyz(srgbColor) {
  const linearSrgb = srgbToLinearSrgb(srgbColor);
  return linearSrgbToXyz(linearSrgb);
}

/**
 * Converts a CIE XYZ (D65) color object directly to an sRGB color object.
 * @param {XyzColor} xyzColor - The CIE XYZ color object {x, y, z}.
 * @returns {SrgbColor} The sRGB color object {r, g, b}.
 */
export function xyzToSrgb(xyzColor) {
  const linearSrgb = xyzToLinearSrgb(xyzColor);
  return linearSrgbToSrgb(linearSrgb);
}

// --- Hex String Parsing and Formatting ---

/**
 * Parses an sRGB hex string into an SrgbColor object {r, g, b} with components in the 0-1 range.
 * Handles optional '#' prefix, and 3-digit or 6-digit hex codes.
 * @param {string} hexString - The hex color string (e.g., "#FF0000", "0F0", "ff0000").
 * @returns {SrgbColor} The SrgbColor object.
 * @throws {TypeError} if hexString is not a string.
 * @throws {SyntaxError} if hexString is not a valid hex color format.
 */
export function parseSrgbHex(hexString) {
  if (typeof hexString !== 'string') {
    throw new TypeError('Input hexString must be a string.');
  }
  const hex = hexString.startsWith('#') ? hexString.slice(1) : hexString;

  if (!/^(?:[0-9a-fA-F]{3}){1,2}$/.test(hex)) {
    throw new SyntaxError(`Invalid hex color string format: "${hexString}"`);
  }

  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else { // hex.length === 6
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  return { r: r / 255, g: g / 255, b: b / 255 };
}

/**
 * Formats an SrgbColor object as a 6-digit hex string (e.g., "#RRGGBB").
 * RGB components are clamped to the [0, 1] range before conversion using clamp from utils.js.
 * @param {SrgbColor} srgbColor - The SrgbColor object {r, g, b} with components 0-1.
 * @returns {string} The hex color string, starting with '#'.
 * @throws {TypeError} if srgbColor is not a valid SrgbColor object.
 */
export function formatSrgbAsHex(srgbColor) {
  if (typeof srgbColor !== 'object' || srgbColor === null ||
      typeof srgbColor.r !== 'number' || typeof srgbColor.g !== 'number' || typeof srgbColor.b !== 'number') {
    throw new TypeError('Input srgbColor must be an object with r, g, b number properties.');
  }

  const toHexPart = (channelValue) => {
    const clampedValue = clamp(channelValue, 0, 1); // Uses clamp from utils.js
    const hex = Math.round(clampedValue * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const rHex = toHexPart(srgbColor.r);
  const gHex = toHexPart(srgbColor.g);
  const bHex = toHexPart(srgbColor.b);

  return `#${rHex}${gHex}${bHex}`;
}