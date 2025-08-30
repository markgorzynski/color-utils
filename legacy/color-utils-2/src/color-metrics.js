/**
 * @file src/color-metrics.js
 * @module color-utils/color-metrics
 * @description Provides functions to calculate various color metrics, including
 * CIE Relative Luminance (Y) from sRGB, WCAG contrast ratio, CIEDE2000 color
 * difference (between Lab colors), and a perceptual difference metric for Oklch colors.
 */

// --- Type Imports for JSDoc ---
/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {import('./types.js').LinearSrgbColor} LinearSrgbColor */
/** @typedef {import('./types.js').LabColor} LabColor */
/** @typedef {import('./types.js').OklchColor} OklchColor */
/**
 * @typedef {object} Ciede2000WeightingFactors
 * @property {number} [kL=1] - Lightness weighting factor.
 * @property {number} [kC=1] - Chroma weighting factor.
 * @property {number} [kH=1] - Hue weighting factor.
 */

// --- Utility and Color Module Imports ---
import { degreesToRadians, radiansToDegrees, normalizeHue } from './utils.js'; // normalizeHue might be useful for dH in Oklch
import { parseSrgbHex, srgbToLinearSrgb } from './srgb.js';

// --- CIE Relative Luminance (Y from sRGB) ---

/**
 * Calculates CIE relative luminance (Y) from Linear sRGB components.
 * This is equivalent to the Y component of the CIE XYZ color space for sRGB primaries
 * and D65 white point, when linearR, linearG, linearB are in the [0, 1] range.
 * Uses standard coefficients: Y = 0.2126*R_lin + 0.7152*G_lin + 0.0722*B_lin.
 * @private
 * @param {LinearSrgbColor} linearSrgb - The Linear sRGB color object {r, g, b}.
 * @returns {number} The relative luminance (Y), typically in the range [0, 1].
 */
function _calculateCieRelativeLuminanceFromLinearSrgb(linearSrgb) {
  // Input validation for r,g,b components is expected to be handled by the caller
  // or be less strict for an internal helper.
  return 0.2126 * linearSrgb.r + 0.7152 * linearSrgb.g + 0.0722 * linearSrgb.b;
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
 * The input can be an `SrgbColor` object or a hex string.
 * Relative luminance is crucial for predicting perceived lightness and calculating WCAG contrast.
 * For sRGB colors, this value corresponds to the Y tristimulus value in the CIE XYZ
 * color space when using the D65 white point, scaled to the range [0, 1] (where Y_D65_white=1.0).
 *
 * @param {SrgbColor | string} colorInput - The sRGB color, either as an
 * `SrgbColor` object {r, g, b} (components 0-1) or a hex string (e.g., "#FF0000").
 * @returns {number} The CIE relative luminance (Y), ranging from 0 to 1.
 * @throws {TypeError|SyntaxError} if the input `colorInput` is invalid.
 * @example
 * const lumWhite = getSrgbRelativeLuminance("#FFFFFF"); // ≈ 1.0
 * const lumGray = getSrgbRelativeLuminance({ r: 0.5, g: 0.5, b: 0.5 }); // ≈ 0.21404
 * const lumBlack = getSrgbRelativeLuminance("#000000"); // ≈ 0.0
 */
export function getSrgbRelativeLuminance(colorInput) {
  let srgbObj;
  let cacheKey = null;

  if (typeof colorInput === 'string') {
    // Normalize hex string for consistent caching: lowercase, no '#'
    const hexNormalized = (colorInput.startsWith('#') ? colorInput.slice(1) : colorInput).toLowerCase();
    cacheKey = hexNormalized;
    if (luminanceCacheFromHex.has(cacheKey)) {
      return luminanceCacheFromHex.get(cacheKey);
    }
    srgbObj = parseSrgbHex(colorInput); // Throws SyntaxError for invalid hex
  } else if (
    typeof colorInput === 'object' && colorInput !== null &&
    typeof colorInput.r === 'number' && !Number.isNaN(colorInput.r) &&
    typeof colorInput.g === 'number' && !Number.isNaN(colorInput.g) &&
    typeof colorInput.b === 'number' && !Number.isNaN(colorInput.b)
  ) {
    srgbObj = colorInput;
  } else {
    throw new TypeError('Invalid color input: Must be an SrgbColor object or a hex string.');
  }

  // Ensure sRGB components are within [0,1] before linearization for safety,
  // though srgbToLinearSrgb's internal helpers also clamp.
  const r_clamped = Math.max(0, Math.min(1, srgbObj.r));
  const g_clamped = Math.max(0, Math.min(1, srgbObj.g));
  const b_clamped = Math.max(0, Math.min(1, srgbObj.b));

  const linearSrgb = srgbToLinearSrgb({ r: r_clamped, g: g_clamped, b: b_clamped });
  const luminance = _calculateCieRelativeLuminanceFromLinearSrgb(linearSrgb);

  if (cacheKey !== null) {
    if (luminanceCacheFromHex.size > 500) { // Basic cache eviction strategy
        luminanceCacheFromHex.clear();
    }
    luminanceCacheFromHex.set(cacheKey, luminance);
  }
  // Clamp final luminance to [0,1] due to potential floating point artifacts
  return Math.max(0, Math.min(1, luminance));
}

// --- WCAG Contrast Calculation ---

/**
 * Computes the WCAG 2.x contrast ratio between two sRGB colors.
 * Colors can be specified as `SrgbColor` objects or hex strings.
 * The contrast ratio ranges from 1 (no contrast) to 21 (max contrast, e.g., black vs. white).
 * @param {SrgbColor | string} color1 - The first sRGB color.
 * @param {SrgbColor | string} color2 - The second sRGB color.
 * @returns {number} The contrast ratio, rounded to two decimal places.
 * @throws {TypeError|SyntaxError} if `color1` or `color2` inputs are invalid.
 * @see {@link https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio}
 * @example
 * const contrastBW = calculateWcagContrast("#000000", "#FFFFFF"); // 21.00
 * const contrastMidGrayWhite = calculateWcagContrast("#777777", "#FFFFFF"); // ≈ 4.54
 */
export function calculateWcagContrast(color1, color2) {
  const lum1 = getSrgbRelativeLuminance(color1); // Validates color1
  const lum2 = getSrgbRelativeLuminance(color2); // Validates color2

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const contrast = (lighter + 0.05) / (darker + 0.05);
  // Round to two decimal places as is common practice for WCAG reporting.
  return Math.round(contrast * 100) / 100;
}

/**
 * Checks if the WCAG contrast ratio between two sRGB colors meets or exceeds a given threshold.
 * @param {SrgbColor | string} color1 - The first sRGB color.
 * @param {SrgbColor | string} color2 - The second sRGB color.
 * @param {number} threshold - The minimum contrast ratio required (e.g., 3.0, 4.5 for AA, 7.0 for AAA).
 * @returns {boolean} True if the contrast is sufficient, false otherwise.
 * @throws {TypeError|SyntaxError} if color inputs are invalid or threshold is not a valid number.
 * @example
 * isWcagContrastSufficient("#777777", "#FFFFFF", 4.5); // true (approx)
 * isWcagContrastSufficient("#888888", "#FFFFFF", 4.5); // false (approx)
 */
export function isWcagContrastSufficient(color1, color2, threshold) {
  if (typeof threshold !== 'number' || Number.isNaN(threshold) || threshold < 1.0) {
      throw new TypeError('Threshold must be a number greater than or equal to 1.0.');
  }
  return calculateWcagContrast(color1, color2) >= threshold;
}

// --- CIEDE2000 Color Difference ---

/**
 * Computes the CIEDE2000 color difference (ΔE₀₀) between two CIELAB color objects.
 * This metric provides a more perceptually uniform measure of color difference than earlier formulas like ΔE*ab.
 * A difference of ~1.0 is often considered a "just noticeable difference" (JND).
 * @param {LabColor} lab1 - The first CIELAB color object {L, a, b}.
 * @param {LabColor} lab2 - The second CIELAB color object {L, a, b}.
 * @param {Ciede2000WeightingFactors} [weightingFactors={kL:1, kC:1, kH:1}] - Optional parametric
 * weighting factors for lightness (kL), chroma (kC), and hue (kH). Defaults assume reference conditions.
 * @returns {number} The CIEDE2000 color difference.
 * @throws {TypeError} if `lab1`, `lab2`, or `weightingFactors` are invalid or components are not numbers.
 * @see {@link http://www2.ece.rochester.edu/~gsharma/ciede2000/ciede2000noteCRNA.pdf} (Sharma et al. note)
 * @see {@link https://en.wikipedia.org/wiki/Color_difference#CIEDE2000}
 * @example
 * const labA = { L: 50, a: 2.6772, b: -79.7751 };
 * const labB = { L: 50, a: -0.0003, b: -82.7485 };
 * const dE00 = calculateCiede2000(labA, labB); // dE00 ≈ 2.04 (example values)
 */
export function calculateCiede2000(lab1, lab2, weightingFactors = {}) {
  const validateLab = (lab, name) => {
    if ( typeof lab !== 'object' || lab === null ||
      typeof lab.L !== 'number' || Number.isNaN(lab.L) ||
      typeof lab.a !== 'number' || Number.isNaN(lab.a) ||
      typeof lab.b !== 'number' || Number.isNaN(lab.b)
    ) {
      throw new TypeError(`Input ${name} must be a valid LabColor object with L, a, b valid number properties.`);
    }
  };
  validateLab(lab1, 'lab1');
  validateLab(lab2, 'lab2');

  const { kL = 1, kC = 1, kH = 1 } = weightingFactors;
  if (typeof kL !== 'number' || Number.isNaN(kL) ||
      typeof kC !== 'number' || Number.isNaN(kC) ||
      typeof kH !== 'number' || Number.isNaN(kH)) {
      throw new TypeError('Weighting factors kL, kC, kH must be valid numbers.');
  }

  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const C1_ab = Math.sqrt(a1 * a1 + b1 * b1);
  const C2_ab = Math.sqrt(a2 * a2 + b2 * b2);
  const C_bar_ab = (C1_ab + C2_ab) / 2;

  const G_pow7 = Math.pow(C_bar_ab, 7);
  const G = 0.5 * (1 - Math.sqrt(G_pow7 / (G_pow7 + Math.pow(25, 7))));

  const a1_prime = (1 + G) * a1;
  const a2_prime = (1 + G) * a2;

  const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
  const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);

  let h1_prime_rad = (a1_prime === 0 && b1 === 0) ? 0 : Math.atan2(b1, a1_prime);
  if (h1_prime_rad < 0) h1_prime_rad += 2 * Math.PI; // Normalize to [0, 2*PI)

  let h2_prime_rad = (a2_prime === 0 && b2 === 0) ? 0 : Math.atan2(b2, a2_prime);
  if (h2_prime_rad < 0) h2_prime_rad += 2 * Math.PI; // Normalize to [0, 2*PI)

  const delta_L_prime = L2 - L1;
  const delta_C_prime = C2_prime - C1_prime;

  let delta_h_prime_rad;
  if (C1_prime === 0 || C2_prime === 0) {
    delta_h_prime_rad = 0;
  } else {
    delta_h_prime_rad = h2_prime_rad - h1_prime_rad;
    if (delta_h_prime_rad > Math.PI) delta_h_prime_rad -= 2 * Math.PI;
    else if (delta_h_prime_rad < -Math.PI) delta_h_prime_rad += 2 * Math.PI;
    // else delta_h_prime_rad is already in [-PI, PI]
  }
  // Note: some implementations use abs(h1_prime_rad - h2_prime_rad) <= PI instead of the above.
  // The goal is that delta_h_prime_rad is the shortest angle.

  const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin(delta_h_prime_rad / 2);

  const L_bar_prime_val = (L1 + L2) / 2;
  const C_bar_prime_val = (C1_prime + C2_prime) / 2;

  let h_bar_prime_rad;
  if (C1_prime === 0 || C2_prime === 0) {
    h_bar_prime_rad = h1_prime_rad + h2_prime_rad; // Sum of hues if one chroma is zero
  } else {
    if (Math.abs(h1_prime_rad - h2_prime_rad) > Math.PI) {
      h_bar_prime_rad = (h1_prime_rad + h2_prime_rad + 2 * Math.PI) / 2;
    } else {
      h_bar_prime_rad = (h1_prime_rad + h2_prime_rad) / 2;
    }
  }
  // Ensure average hue is in [0, 2*PI)
  h_bar_prime_rad = (h_bar_prime_rad % (2 * Math.PI) + 2 * Math.PI) % (2*Math.PI);


  const T_deg_term = radiansToDegrees(h_bar_prime_rad); // Convert average hue to degrees for T calculation
  const T = 1 - 0.17 * Math.cos(degreesToRadians(T_deg_term - 30)) +
            0.24 * Math.cos(degreesToRadians(2 * T_deg_term)) +
            0.32 * Math.cos(degreesToRadians(3 * T_deg_term + 6)) -
            0.20 * Math.cos(degreesToRadians(4 * T_deg_term - 63));

  const L_minus_50_sq = Math.pow(L_bar_prime_val - 50, 2);
  const S_L = 1 + (0.015 * L_minus_50_sq) / Math.sqrt(20 + L_minus_50_sq);
  const S_C = 1 + 0.045 * C_bar_prime_val;
  const S_H = 1 + 0.015 * C_bar_prime_val * T;

  const C_bar_prime_pow7 = Math.pow(C_bar_prime_val, 7);
  const R_C_term = Math.sqrt(C_bar_prime_pow7 / (C_bar_prime_pow7 + Math.pow(25, 7)));
  const delta_theta_rad = degreesToRadians(30 * Math.exp(-Math.pow((T_deg_term - 275) / 25, 2)));
  const R_T = -2 * R_C_term * Math.sin(2 * delta_theta_rad);

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

// --- Oklch Perceptual Difference (Simplified) ---

/**
 * Computes a simplified perceptual difference metric between two OklchColor objects.
 * This is a Euclidean distance in Oklch space, with optional normalization for chroma
 * and hue components to better approximate perceptual uniformity.
 * It's simpler than CIEDE2000 but aims to be more perceptually relevant than raw
 * Euclidean distance in some other color spaces.
 *
 * @param {OklchColor} oklch1 - The first Oklch color object {L, C, h}.
 * @param {OklchColor} oklch2 - The second Oklch color object {L, C, h}.
 * @param {number} [chromaWeight=1.0] - Weight for the chroma difference component.
 * Can be used to adjust the perceived importance of chroma differences.
 * A value around 0.1 to 0.3 might be more appropriate if C is on a much larger scale than L (0-1).
 * However, Oklch C is typically ~0-0.4. A factor for dH is usually related to C.
 * Let's use a weighted Euclidean distance: sqrt(dL^2 + (dC_eff)^2 + (dH_eff)^2)
 * dH_eff relates to arc length: C_avg * dH_rad
 *
 * @returns {number} The Oklch difference value.
 * @throws {TypeError} if inputs are invalid.
 * @example
 * const oklchA = { L: 0.8, C: 0.1, h: 50 };
 * const oklchB = { L: 0.78, C: 0.11, h: 55 };
 * const diff = calculateOklchDifference(oklchA, oklchB); // Example diff
 */
export function calculateOklchDifference(oklch1, oklch2) {
  const validateOklch = (oklch, name) => {
    if ( typeof oklch !== 'object' || oklch === null ||
      typeof oklch.L !== 'number' || Number.isNaN(oklch.L) || oklch.L < 0 || oklch.L > 1 || // Oklab L is 0-1
      typeof oklch.C !== 'number' || Number.isNaN(oklch.C) || oklch.C < 0 || // Oklch C is >= 0
      typeof oklch.h !== 'number' || Number.isNaN(oklch.h)
    ) {
      throw new TypeError(`Input ${name} must be a valid OklchColor object with L, C, h valid number properties and correct ranges.`);
    }
  };
  validateOklch(oklch1, 'oklch1');
  validateOklch(oklch2, 'oklch2');

  const dL = oklch1.L - oklch2.L; // Oklab L is typically 0-1

  // Effective chroma difference (dC)
  const dC = oklch1.C - oklch2.C;

  // Effective hue difference (dH_eff), similar to CIEDE2000's delta_H_prime
  // dH_eff = 2 * sqrt(C1*C2) * sin(delta_h_rad / 2)
  // delta_h_rad is the shortest angle between hues in radians
  let delta_h_deg = Math.abs(oklch1.h - oklch2.h);
  if (delta_h_deg > 180) {
    delta_h_deg = 360 - delta_h_deg;
  }
  const delta_h_rad = degreesToRadians(delta_h_deg);

  // Use average Chroma for weighting the hue difference, or handle C1/C2 being zero.
  const C_avg = (oklch1.C + oklch2.C) / 2;
  // let dH_effective;
  // if (oklch1.C * oklch2.C === 0) { // Or if C_avg is very small
  // dH_effective = 0; // Hue difference is meaningless if one or both chromas are zero
  // } else {
  // dH_effective = 2 * Math.sqrt(oklch1.C * oklch2.C) * Math.sin(delta_h_rad / 2);
  // }
  // A simpler, common approach for dH in LCh-like spaces: use arc length approx. C_avg * delta_h_rad
  // Or, as used in some Oklab difference discussions, a direct component for a*b* plane:
  // d_ab = sqrt( (a1-a2)^2 + (b1-b2)^2 )
  // a = C * cos(h_rad), b = C * sin(h_rad)
  const a1 = oklch1.C * Math.cos(degreesToRadians(oklch1.h));
  const b1 = oklch1.C * Math.sin(degreesToRadians(oklch1.h));
  const a2 = oklch2.C * Math.cos(degreesToRadians(oklch2.h));
  const b2 = oklch2.C * Math.sin(degreesToRadians(oklch2.h));
  const da = a1 - a2;
  const db = b1 - b2;

  // The Oklab paper suggests Euclidean distance in Lab is a good measure.
  // So, dE_Oklab = sqrt(dL^2 + da^2 + db^2)
  return Math.sqrt(dL * dL + da * da + db * db);
}