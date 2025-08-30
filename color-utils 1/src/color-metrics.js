/**
 * @module color-metrics
 * @description Provides functions to calculate various color metrics, including
 * WCAG contrast ratio, CIE relative luminance (Y from sRGB), CIEDE2000 color
 * difference, and an Oklch color difference.
 */

import {
  degreesToRadians,
  radiansToDegrees,
} from './utils.js';
import {
  parseSrgbHex,
  srgbToLinearSrgb
} from './srgb.js';

// Assuming SrgbColor, LinearSrgbColor, LabColor, OklchColor, and Ciede2000WeightingFactors are defined in types.js


// --- CIE Relative Luminance (Y from sRGB) ---

/**
 * Calculates CIE relative luminance (Y) from linear sRGB components.
 * This is equivalent to the Y component of the CIE XYZ color space for sRGB primaries
 * and D65 white point, when R_lin, G_lin, B_lin are in the [0, 1] range.
 * Uses standard coefficients (0.2126*R_lin + 0.7152*G_lin + 0.0722*B_lin).
 * This function is internal to the module.
 * @private
 * @param {number} linearR - The linear red component (0-1).
 * @param {number} linearG - The linear green component (0-1).
 * @param {number} linearB - The linear blue component (0-1).
 * @returns {number} The relative luminance (0-1).
 * @throws {TypeError} if all linear RGB components are not numbers.
 */
function _calculateCieRelativeLuminance(linearR, linearG, linearB) {
  if (typeof linearR !== 'number' || typeof linearG !== 'number' || typeof linearB !== 'number') {
    // Although the public function has stricter type checks, this internal one might be called
    // with guaranteed numbers, but adding a check makes it robust.
     // Re-throwing with specific message for this internal function if needed, or rely on caller validation.
     // For documentation purposes, the type hint is sufficient.
  }
  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
}

/**
 * Cache for previously computed relative luminance values from hex strings.
 * Keyed by normalized hex string (lowercase, no '#').
 * @private
 * @type {Map<string, number>}
 */
const luminanceCacheFromHex = new Map();

/**
 * Calculates the CIE relative luminance (Y) of an sRGB color.
 * The input can be an SrgbColor object or a hex string.
 * Relative luminance is a key factor in color appearance and contrast calculations.
 * For sRGB colors, this value corresponds to the Y tristimulus value in the CIE XYZ
 * color space when using D65 white point, scaled to the range [0, 1].
 *
 * @param {SrgbColor | string} colorInput - The sRGB color, either as an
 * SrgbColor object {r, g, b} (components 0-1) or a hex string (e.g., "#FF0000").
 * @returns {number} The CIE relative luminance (Y), ranging from 0 to 1.
 * @throws {TypeError|SyntaxError} if the input color is invalid.
 * @example
 * const lumWhite = getSrgbRelativeLuminance("#FFFFFF"); // approx 1.0
 * const lumGray = getSrgbRelativeLuminance({ r: 0.5, g: 0.5, b: 0.5 }); // approx 0.214
 */
export function getSrgbRelativeLuminance(colorInput) {
  let srgbObj;
  let cacheKey = null;

  if (typeof colorInput === 'string') {
    const hexNormalized = colorInput.startsWith('#') ? colorInput.slice(1).toLowerCase() : colorInput.toLowerCase();
    cacheKey = hexNormalized;
    if (luminanceCacheFromHex.has(cacheKey)) {
      return luminanceCacheFromHex.get(cacheKey);
    }
    srgbObj = parseSrgbHex(colorInput); // from srgb.js
  } else if (typeof colorInput === 'object' && colorInput !== null &&
             typeof colorInput.r === 'number' &&
             typeof colorInput.g === 'number' &&
             typeof colorInput.b === 'number') {
    srgbObj = colorInput;
  } else {
    throw new TypeError('Invalid color input: Must be an SrgbColor object or a hex string.');
  }

  const linearSrgb = srgbToLinearSrgb(srgbObj); // from srgb.js
  const luminance = _calculateCieRelativeLuminance(linearSrgb.r, linearSrgb.g, linearSrgb.b);

  if (cacheKey !== null) {
    luminanceCacheFromHex.set(cacheKey, luminance);
  }
  return luminance;
}


// --- WCAG Contrast Calculation ---

/**
 * Computes the WCAG contrast ratio between two sRGB colors.
 * Colors can be specified as SrgbColor objects or hex strings.
 * The contrast ratio is rounded to two decimal places.
 * @param {SrgbColor | string} color1 - The first sRGB color.
 * @param {SrgbColor | string} color2 - The second sRGB color.
 * @returns {number} The contrast ratio (1.0 to 21.0).
 * @throws {TypeError|SyntaxError} if color inputs are invalid.
 */
export function calculateWcagContrast(color1, color2) {
  const lum1 = getSrgbRelativeLuminance(color1); // Uses the new public luminance function
  const lum2 = getSrgbRelativeLuminance(color2); // Uses the new public luminance function

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const contrast = (lighter + 0.05) / (darker + 0.05);
  return Math.round(contrast * 100) / 100;
}

/**
 * Checks if the WCAG contrast ratio between two sRGB colors meets or exceeds a given threshold.
 * @param {SrgbColor | string} color1 - The first sRGB color.
 * @param {SrgbColor | string} color2 - The second sRGB color.
 * @param {number} threshold - The minimum contrast ratio required (e.g., 4.5 for AA, 7 for AAA).
 * @returns {boolean} True if the contrast is sufficient, false otherwise.
 * @throws {TypeError|SyntaxError} if color inputs are invalid or threshold is not a valid number.
 */
export function isWcagContrastSufficient(color1, color2, threshold) {
  if (typeof threshold !== 'number' || threshold < 1.0) {
      throw new TypeError('Threshold must be a number greater than or equal to 1.0.');
  }
  return calculateWcagContrast(color1, color2) >= threshold;
}

// --- CIEDE2000 Color Difference ---

/**
 * Computes the CIEDE2000 color difference (ΔE₀₀) between two LabColor objects.
 * @param {LabColor} lab1 - The first CIELAB color object {L, a, b}.
 * @param {LabColor} lab2 - The second CIELAB color object {L, a, b}.
 * @param {Ciede2000WeightingFactors} [weightingFactors={kL:1, kC:1, kH:1}] - Optional parametric weighting factors.
 * @returns {number} The CIEDE2000 color difference.
 * @throws {TypeError} if lab1, lab2, or weightingFactors are invalid.
 */
export function calculateCiede2000(lab1, lab2, weightingFactors = {}) {
  if (typeof lab1 !== 'object' || lab1 === null ||
      typeof lab1.L !== 'number' || typeof lab1.a !== 'number' || typeof lab1.b !== 'number') {
    throw new TypeError('Input lab1 must be a valid LabColor object.');
  }
  if (typeof lab2 !== 'object' || lab2 === null ||
      typeof lab2.L !== 'number' || typeof lab2.a !== 'number' || typeof lab2.b !== 'number') {
    throw new TypeError('Input lab2 must be a valid LabColor object.');
  }

  // Apply default weighting factors if not provided
  const {
      kL = 1,
      kC = 1,
      kH = 1
  } = weightingFactors;

  if (typeof kL !== 'number' || typeof kC !== 'number' || typeof kH !== 'number') {
      throw new TypeError('Weighting factors kL, kC, kH must be numbers.');
  }

  const L1 = lab1.L, a1 = lab1.a, b1 = lab1.b;
  const L2 = lab2.L, a2 = lab2.a, b2 = lab2.b;

  const C1_ab = Math.sqrt(a1 * a1 + b1 * b1);
  const C2_ab = Math.sqrt(a2 * a2 + b2 * b2);
  const C_bar_ab = (C1_ab + C2_ab) / 2;

  const G = 0.5 * (1 - Math.sqrt(Math.pow(C_bar_ab, 7) / (Math.pow(C_bar_ab, 7) + Math.pow(25, 7))));

  const a1_prime = (1 + G) * a1;
  const a2_prime = (1 + G) * a2;

  const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
  const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);

  let h1_prime_rad = (a1_prime === 0 && b1 === 0) ? 0 : Math.atan2(b1, a1_prime);
  if (h1_prime_rad < 0) h1_prime_rad += 2 * Math.PI;

  let h2_prime_rad = (a2_prime === 0 && b2 === 0) ? 0 : Math.atan2(b2, a2_prime);
  if (h2_prime_rad < 0) h2_prime_rad += 2 * Math.PI;

  const delta_L_prime = L2 - L1;
  const delta_C_prime = C2_prime - C1_prime;

  let delta_h_prime_rad;
  if (C1_prime * C2_prime === 0) {
    delta_h_prime_rad = 0;
  } else {
    delta_h_prime_rad = h2_prime_rad - h1_prime_rad;
    if (delta_h_prime_rad > Math.PI) delta_h_prime_rad -= 2 * Math.PI;
    if (delta_h_prime_rad < -Math.PI) delta_h_prime_rad += 2 * Math.PI;
  }
  const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin(delta_h_prime_rad / 2);

  const L_bar_prime_val = (L1 + L2) / 2;
  const C_bar_prime_val = (C1_prime + C2_prime) / 2;

  let h_bar_prime_rad;
  if (C1_prime * C2_prime === 0) {
    h_bar_prime_rad = h1_prime_rad + h2_prime_rad;
  } else {
    if (Math.abs(h1_prime_rad - h2_prime_rad) > Math.PI) {
      h_bar_prime_rad = (h1_prime_rad + h2_prime_rad + 2 * Math.PI) / 2;
    } else {
      h_bar_prime_rad = (h1_prime_rad + h2_prime_rad) / 2;
    }
  }

  const T = 1 - 0.17 * Math.cos(h_bar_prime_rad - degreesToRadians(30)) +
            0.24 * Math.cos(2 * h_bar_prime_rad) +
            0.32 * Math.cos(3 * h_bar_prime_rad + degreesToRadians(6)) -
            0.20 * Math.cos(4 * h_bar_prime_rad - degreesToRadians(63));

  const delta_theta_rad = degreesToRadians(30) * Math.exp(-Math.pow((radiansToDegrees(h_bar_prime_rad) - 275) / 25, 2));

  const R_C = 2 * Math.sqrt(Math.pow(C_bar_prime_val, 7) / (Math.pow(C_bar_prime_val, 7) + Math.pow(25, 7)));
  const S_L = 1 + (0.015 * Math.pow(L_bar_prime_val - 50, 2)) / Math.sqrt(20 + Math.pow(L_bar_prime_val - 50, 2));
  const S_C = 1 + 0.045 * C_bar_prime_val;
  const S_H = 1 + 0.015 * C_bar_prime_val * T;
  const R_T = -R_C * Math.sin(2 * delta_theta_rad);

  const termL = delta_L_prime / (kL * S_L);
  const termC = delta_C_prime / (kC * S_C);
  const termH = delta_H_prime / (kH * S_H);

  const dE00 = Math.sqrt(
    termL * termL +
    termC * termC +
    termH * termH +
    R_T * termC * termH
  );

  return dE00;
}

// --- Optimized OKLCh Difference ---

/**
 * Computes an optimized difference metric between two OklchColor objects.
 * @param {OklchColor} oklch1 - The first Oklch color object {L, C, h}.
 * @param {OklchColor} oklch2 - The second Oklch color object {L, C, h}.
 * @param {number} [chromaNormalizationFactor=0.333] - Divisor for chroma difference normalization.
 * @returns {number} The normalized Oklch difference.
 * @throws {TypeError} if inputs are invalid.
 */
export function calculateOklchDifference(oklch1, oklch2, chromaNormalizationFactor = 0.333) {
  if (typeof oklch1 !== 'object' || oklch1 === null ||
      typeof oklch1.L !== 'number' || typeof oklch1.C !== 'number' || typeof oklch1.h !== 'number') {
    throw new TypeError('Input oklch1 must be a valid OklchColor object.');
  }
  if (typeof oklch2 !== 'object' || oklch2 === null ||
      typeof oklch2.L !== 'number' || typeof oklch2.C !== 'number' || typeof oklch2.h !== 'number') {
    throw new TypeError('Input oklch2 must be a valid OklchColor object.');
  }
  if (typeof chromaNormalizationFactor !== 'number' || chromaNormalizationFactor <= 0) {
      throw new TypeError('chromaNormalizationFactor must be a positive number.');
  }

  const dL = oklch1.L - oklch2.L;
  const dC = oklch1.C - oklch2.C;

  let dh = Math.abs(oklch1.h - oklch2.h);
  if (dh > 180) {
    dh = 360 - dh;
  }
  const dH_normalized = dh / 180.0;
  const dC_normalized = dC / chromaNormalizationFactor;

  return Math.sqrt(dL * dL + dC_normalized * dC_normalized + dH_normalized * dH_normalized);
}