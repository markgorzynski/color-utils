/**
 * color-utils/srgb.js
 *
 * Conversion routines between CIE XYZ and sRGB color spaces.
 *
 * IMPORTANT:
 * - These conversion functions do NOT perform any clamping unless explicitly stated (e.g., formatSrgbAsHex).
 * - Raw linear or gamma-encoded sRGB values may be <0 or >1 if out-of-gamut.
 * - To safely format or display colors, clamp values into [0,1].
 */

// Assuming you have a types.js for JSDoc, if not, these can be simplified.
/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {import('./types.js').LinearSrgbColor} LinearSrgbColor */
/** @typedef {import('./types.js').XyzColor} XyzColor */

// --- sRGB Gamma Correction (EOTF and inverse EOTF) ---

/**
 * Applies the sRGB inverse electro-optical transfer function (inverse EOTF / gamma expansion)
 * to convert gamma-corrected sRGB channel to linear sRGB.
 * @param {number} v - Gamma-corrected sRGB channel value (typically 0-1).
 * @returns {number} Linear sRGB channel value.
 */
function _gammaExpand(v) {
  return v <= 0.04045
    ? v / 12.92
    : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Applies the sRGB electro-optical transfer function (OETF / gamma compression)
 * to linear sRGB channel to get gamma-corrected sRGB.
 * @param {number} v - Linear sRGB channel value.
 * @returns {number} Gamma-corrected sRGB channel value.
 */
function _gammaCompress(v) {
  return v <= 0.0031308
    ? 12.92 * v
    : 1.055 * Math.pow(v, 1.0 / 2.4) - 0.055;
}

// --- sRGB <-> Linear sRGB ---

/**
 * Converts gamma-corrected sRGB to linear sRGB.
 * @param {SrgbColor} srgbColor - The sRGB color { r, g, b }.
 * @returns {LinearSrgbColor} The linear sRGB color { r, g, b }.
 */
export function srgbToLinearSrgb({ r, g, b }) {
  return {
    r: _gammaExpand(r),
    g: _gammaExpand(g),
    b: _gammaExpand(b),
  };
}

/**
 * Converts linear sRGB to gamma-corrected sRGB.
 * @param {LinearSrgbColor} linearSrgbColor - The linear sRGB color { r, g, b }.
 * @returns {SrgbColor} The gamma-corrected sRGB color { r, g, b }.
 */
export function linearSrgbToSrgb({ r, g, b }) {
  return {
    r: _gammaCompress(r),
    g: _gammaCompress(g),
    b: _gammaCompress(b),
  };
}

// --- Linear sRGB <-> XYZ (D65) ---

// Bradford-adapted D65 sRGB matrix for sRGB -> XYZ
const MATRIX_LINEAR_SRGB_TO_XYZ_D65 = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.0721750],
  [0.0193339, 0.1191920, 0.9503041]
];

// Bradford-adapted D65 sRGB matrix for XYZ -> sRGB (inverse of above)
const MATRIX_XYZ_TO_LINEAR_SRGB_D65 = [
  [ 3.2404542, -1.5371385, -0.4985314],
  [-0.9692660,  1.8760108,  0.0415560],
  [ 0.0556434, -0.2040259,  1.0572252]
  // Note: Slight variations exist in these matrices across sources.
  // The one you had for xyzToLinearSrgb was:
  // [ 3.2406, -1.5372, -0.4986],
  // [-0.9689,  1.8758,  0.0415],
  // [ 0.0557, -0.2040,  1.0570]
  // Using your original matrix for consistency for xyzToLinearSrgb.
  // For linearSrgbToXyz, using the more standard forward matrix.
  // It's best to ensure these are exact inverses or from a consistent source.
];


/**
 * Converts linear sRGB to CIE XYZ (D65).
 * @param {LinearSrgbColor} linearSrgbColor - The linear sRGB color { r, g, b }.
 * @returns {XyzColor} The CIE XYZ color { X, Y, Z }.
 */
export function linearSrgbToXyz({ r, g, b }) {
  const X = MATRIX_LINEAR_SRGB_TO_XYZ_D65[0][0] * r + MATRIX_LINEAR_SRGB_TO_XYZ_D65[0][1] * g + MATRIX_LINEAR_SRGB_TO_XYZ_D65[0][2] * b;
  const Y = MATRIX_LINEAR_SRGB_TO_XYZ_D65[1][0] * r + MATRIX_LINEAR_SRGB_TO_XYZ_D65[1][1] * g + MATRIX_LINEAR_SRGB_TO_XYZ_D65[1][2] * b;
  const Z = MATRIX_LINEAR_SRGB_TO_XYZ_D65[2][0] * r + MATRIX_LINEAR_SRGB_TO_XYZ_D65[2][1] * g + MATRIX_LINEAR_SRGB_TO_XYZ_D65[2][2] * b;
  return { X, Y, Z };
}

/**
 * Converts CIE XYZ (D65) to linear sRGB.
 * @param {XyzColor} xyzColor - The CIE XYZ color { X, Y, Z }.
 * @returns {LinearSrgbColor} The linear sRGB color { r, g, b }.
 */
export function xyzToLinearSrgb({ X, Y, Z }) {
  // Using your original matrix values from the provided srgb.js for this direction
  const r =  3.2406 * X - 1.5372 * Y - 0.4986 * Z; // Corrected your original matrix based on common forms (some terms were +)
  const g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const b =  0.0557 * X - 0.2040 * Y + 1.0570 * Z;
  // A more standard inverse matrix often used:
  // const r =  3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  // const g = -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z;
  // const b =  0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
  return { r, g, b };
}

// --- Full sRGB <-> XYZ Pipelines (D65) ---

/**
 * Converts gamma-corrected sRGB to CIE XYZ (D65).
 * @param {SrgbColor} srgbColor - The sRGB color { r, g, b }.
 * @returns {XyzColor} The CIE XYZ color { X, Y, Z }.
 */
export function srgbToXyz(srgbColor) {
  const linearSrgb = srgbToLinearSrgb(srgbColor);
  return linearSrgbToXyz(linearSrgb);
}

/**
 * Converts CIE XYZ (D65) to gamma-corrected sRGB.
 * @param {XyzColor} xyzColor - The CIE XYZ color { X, Y, Z }.
 * @returns {SrgbColor} The sRGB color { r, g, b }.
 */
export function xyzToSrgb(xyzColor) {
  const linearSrgb = xyzToLinearSrgb(xyzColor);
  return linearSrgbToSrgb(linearSrgb);
}

// --- Hex Parsing and Formatting ---

/**
 * Parses an sRGB hex string (e.g., "#RRGGBB" or "#RGB") to an SrgbColor object.
 * Assumes 8-bit depth per channel. Output components are in the range [0, 1].
 * Returns null if the hex string is invalid.
 * @param {string} hexStr - The hex color string.
 * @returns {SrgbColor | null} The SrgbColor object {r, g, b} or null for invalid input.
 */
export function parseSrgbHex(hexStr) {
  if (typeof hexStr !== 'string') return null;
  const hex = hexStr.startsWith('#') ? hexStr.slice(1) : hexStr;

  if (!/^[0-9a-fA-F]+$/.test(hex) || (hex.length !== 3 && hex.length !== 6)) {
    return null;
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

  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
  };
}


/**
 * Formats an SrgbColor object into an 8-bit hex string (e.g., "#RRGGBB").
 * Clamps sRGB component values to the [0, 1] range before conversion.
 * @param {SrgbColor} srgbColor - The SrgbColor object { r, g, b }.
 * @returns {string} The hex color string.
 */
export function formatSrgbAsHex({ r, g, b }) {
  // Local clamp function for this specific operation
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const toHex = (val) => {
    const clampedVal = clamp(val, 0, 1); // Ensure value is within [0, 1]
    const num = Math.round(clampedVal * 255);
    return num.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}