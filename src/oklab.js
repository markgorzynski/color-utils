/**
 * @file src/oklab.js
 * @module color-utils/oklab
 * @description Functions for Oklab and OkLCh color space conversions.
 * Includes transformations to/from Linear sRGB and sRGB (gamma-corrected),
 * and between Oklab and OkLCh.
 * Oklab components (L, a, b) and OkLCh components (L, C, h) follow standard definitions
 * by Björn Ottosson, with Oklab L (Lightness) typically in the [0, 1] range.
 * @see {@link https://bottosson.github.io/posts/oklab/} for the Oklab specification.
 */

// --- Type Imports for JSDoc ---

// --- Utility Imports ---
import {
  multiplyMatrixVector,
  degreesToRadians,
  radiansToDegrees,
  normalizeHue, // Assuming this is exported from utils.js
  signPreservingPow, // For cube root and cubing, handles signs correctly
} from './utils.js';

// --- sRGB Module Imports (for convenience functions) ---
import {
  srgbToLinearSrgb,
  linearSrgbToSrgb,
} from './srgb.js';

// --- Constants for Oklab Transformations ---
// These matrices and steps are based on Björn Ottosson's Oklab formulation.

// Step 1: Convert Linear sRGB to an intermediate LMS-like space (specific to Oklab)
const MATRIX_LINEAR_SRGB_TO_LMS_OKLAB = Object.freeze([
  Object.freeze([0.4122214708, 0.5363325363, 0.0514459929]),
  Object.freeze([0.2119034982, 0.6806995451, 0.1073969566]),
  Object.freeze([0.0883024619, 0.2817188376, 0.6299787005]),
]);

// Step 2: Non-linearity applied to LMS (typically cube root)
// This is handled by signPreservingPow(value, 1/3)

// Step 3: Convert non-linear LMS' to Oklab (L, a, b)
const MATRIX_LMS_PRIME_TO_OKLAB = Object.freeze([
  Object.freeze([0.2104542553, 0.7936177850, -0.0040720468]),
  Object.freeze([1.9779984951, -2.4285922050, 0.4505937099]),
  Object.freeze([0.0259040371, 0.7827717662, -0.8086757660]),
]);

// Inverse Transformations:

// Step 1 (Inverse of Step 3): Convert Oklab (L, a, b) to non-linear LMS'
const MATRIX_OKLAB_TO_LMS_PRIME = Object.freeze([
  Object.freeze([1.0, 0.3963377774, 0.2158037573]),
  Object.freeze([1.0, -0.1055613458, -0.0638541728]),
  Object.freeze([1.0, -0.0894841775, -1.2914855480]),
]);

// Step 2 (Inverse of Step 2): Apply inverse non-linearity (cubing)
// This is handled by signPreservingPow(value, 3)

// Step 3 (Inverse of Step 1): Convert LMS to Linear sRGB
const MATRIX_LMS_OKLAB_TO_LINEAR_SRGB = Object.freeze([
  Object.freeze([4.0767416621, -3.3077115913, 0.2309699292]),
  Object.freeze([-1.2684380046, 2.6097574011, -0.3413193965]),
  Object.freeze([-0.0041960863, -0.7034186147, 1.7076147010]),
]);

// --- Linear sRGB <-> Oklab Conversions ---

/**
 * Converts a Linear sRGB color object to an Oklab color object.
 * @param {LinearSrgbColor} linearSrgbColor - The Linear sRGB color object {r, g, b} with components in [0, 1].
 * @returns {OklabColor} The Oklab color object {L, a, b}.
 * @throws {TypeError} if `linearSrgbColor` is not a valid LinearSrgbColor object.
 * @example
 * const oklabWhite = linearSrgbToOklab({ r: 1, g: 1, b: 1 });
 * // oklabWhite ≈ { L: 1, a: 0, b: 0 }
 * const oklabRed = linearSrgbToOklab({ r: 1, g: 0, b: 0 });
 * // oklabRed ≈ { L: 0.628, a: 0.225, b: 0.126 }
 */
export function linearSrgbToOklab(linearSrgbColor) {
  if (
    typeof linearSrgbColor !== 'object' || linearSrgbColor === null ||
    typeof linearSrgbColor.r !== 'number' || Number.isNaN(linearSrgbColor.r) ||
    typeof linearSrgbColor.g !== 'number' || Number.isNaN(linearSrgbColor.g) ||
    typeof linearSrgbColor.b !== 'number' || Number.isNaN(linearSrgbColor.b)
  ) {
    throw new TypeError('Input linearSrgbColor must be an object with r, g, b valid number properties.');
  }
  // Ensure components are non-negative for physical light before matrix multiply.
  const r = Math.max(0, linearSrgbColor.r);
  const g = Math.max(0, linearSrgbColor.g);
  const b = Math.max(0, linearSrgbColor.b);

  const lms = multiplyMatrixVector(MATRIX_LINEAR_SRGB_TO_LMS_OKLAB, [r, g, b]);

  // Apply cube-root non-linearity using sign-preserving power for negative intermediate results.
  // Oklab uses `cbrtf` which correctly handles negative numbers by preserving the sign.
  const lmsPrime = [
    signPreservingPow(lms[0], 1 / 3),
    signPreservingPow(lms[1], 1 / 3),
    signPreservingPow(lms[2], 1 / 3),
  ];

  const labArray = multiplyMatrixVector(MATRIX_LMS_PRIME_TO_OKLAB, lmsPrime);
  return { L: labArray[0], a: labArray[1], b: labArray[2] };
}

/**
 * Converts an Oklab color object to a Linear sRGB color object.
 * @param {OklabColor} oklabColor - The Oklab color object {L, a, b}.
 * @returns {LinearSrgbColor} The Linear sRGB color object {r, g, b}.
 * Components may be outside [0, 1] if the Oklab color is out of the sRGB gamut.
 * @throws {TypeError} if `oklabColor` is not a valid OklabColor object.
 * @example
 * const linearSRGBWhite = oklabToLinearSrgb({ L: 1, a: 0, b: 0 });
 * // linearSRGBWhite ≈ { r: 1, g: 1, b: 1 }
 * const linearSRGBRed = oklabToLinearSrgb({ L: 0.627955, a: 0.224863, b: 0.125846 });
 * // linearSRGBRed ≈ { r: 1, g: 0, b: 0 }
 */
export function oklabToLinearSrgb(oklabColor) {
  if (
    typeof oklabColor !== 'object' || oklabColor === null ||
    typeof oklabColor.L !== 'number' || Number.isNaN(oklabColor.L) ||
    typeof oklabColor.a !== 'number' || Number.isNaN(oklabColor.a) ||
    typeof oklabColor.b !== 'number' || Number.isNaN(oklabColor.b)
  ) {
    throw new TypeError('Input oklabColor must be an object with L, a, b valid number properties.');
  }
  const { L, a, b } = oklabColor;

  const lmsPrime = multiplyMatrixVector(MATRIX_OKLAB_TO_LMS_PRIME, [L, a, b]);

  // Apply cubing (inverse of cube-root non-linearity) using sign-preserving power.
  const lms = [
    signPreservingPow(lmsPrime[0], 3),
    signPreservingPow(lmsPrime[1], 3),
    signPreservingPow(lmsPrime[2], 3),
  ];

  const rgbArray = multiplyMatrixVector(MATRIX_LMS_OKLAB_TO_LINEAR_SRGB, lms);
  return { r: rgbArray[0], g: rgbArray[1], b: rgbArray[2] };
}

// --- Oklab <-> OkLCh Conversions ---

/**
 * Converts an Oklab color object to an OkLCh color object.
 * Hue (h) is returned in degrees [0, 360).
 * @param {OklabColor} oklabColor - The Oklab color object {L, a, b}.
 * @returns {OklchColor} The OkLCh color object {L, C, h}.
 * @throws {TypeError} if `oklabColor` is not a valid OklabColor object.
 * @example
 * const oklch = oklabToOklch({ L: 0.6, a: 0.1, b: 0.1 });
 * // L=0.6, C ≈ 0.1414, h=45
 */
export function oklabToOklch(oklabColor) {
  if (
    typeof oklabColor !== 'object' || oklabColor === null ||
    typeof oklabColor.L !== 'number' || Number.isNaN(oklabColor.L) ||
    typeof oklabColor.a !== 'number' || Number.isNaN(oklabColor.a) ||
    typeof oklabColor.b !== 'number' || Number.isNaN(oklabColor.b)
  ) {
    throw new TypeError('Input oklabColor must be an object with L, a, b valid number properties.');
  }
  const { L, a, b } = oklabColor;

  const C = Math.sqrt(a * a + b * b);
  const h_rad = Math.atan2(b, a);
  let h_deg = radiansToDegrees(h_rad);

  h_deg = normalizeHue(h_deg); // Normalize to [0, 360)

  if (C < 1e-7) { // Tolerance for C being effectively zero
      h_deg = 0; // Hue is undefined for achromatic colors, conventionally set to 0.
  }

  return { L, C, h: h_deg };
}

/**
 * Converts an OkLCh color object to an Oklab color object.
 * Hue (h) is expected in degrees.
 * @param {OklchColor} oklchColor - The OkLCh color object {L, C, h}.
 * @returns {OklabColor} The Oklab color object {L, a, b}.
 * @throws {TypeError} if `oklchColor` is not a valid OklchColor object.
 * @example
 * const oklab = oklchToOklab({ L: 0.6, C: 0.141421356, h: 45 });
 * // L=0.6, a ≈ 0.1, b ≈ 0.1
 */
export function oklchToOklab(oklchColor) {
  if (
    typeof oklchColor !== 'object' || oklchColor === null ||
    typeof oklchColor.L !== 'number' || Number.isNaN(oklchColor.L) ||
    typeof oklchColor.C !== 'number' || Number.isNaN(oklchColor.C) ||
    typeof oklchColor.h !== 'number' || Number.isNaN(oklchColor.h)
  ) {
    throw new TypeError('Input oklchColor must be an object with L, C, h valid number properties.');
  }
  const { L, C, h } = oklchColor;
  const C_abs = Math.max(0, C); // Chroma cannot be negative

  const h_rad = degreesToRadians(h);
  const a = C_abs * Math.cos(h_rad);
  const b = C_abs * Math.sin(h_rad);

  if (C_abs < 1e-7) {
    return { L, a: 0, b: 0 };
  }

  return { L, a, b };
}

// --- sRGB <-> Oklab Convenience Pipeline Functions ---

/**
 * Converts an sRGB color object directly to an Oklab color object.
 * @param {SrgbColor} srgbColor - The sRGB color object {r, g, b} with components in [0, 1].
 * @returns {OklabColor} The Oklab color object {L, a, b}.
 * @throws {TypeError} if `srgbColor` is not a valid SrgbColor object.
 * @example
 * const oklabRed = srgbToOklab({ r: 1, g: 0, b: 0 });
 * // oklabRed ≈ { L: 0.628, a: 0.225, b: 0.126 }
 */
export function srgbToOklab(srgbColor) {
  // Type checking for srgbColor is handled by srgbToLinearSrgb
  const linearSrgb = srgbToLinearSrgb(srgbColor); // from srgb.js
  return linearSrgbToOklab(linearSrgb);
}

/**
 * Converts an Oklab color object directly to an sRGB (gamma-corrected) color object.
 * The resulting sRGB values are not guaranteed to be in gamut [0,1].
 * `linearSrgbToSrgb` (from srgb.js) will apply gamma correction; resulting values might
 * still be outside [0,1] if the Oklab color was far out of sRGB gamut.
 * @param {OklabColor} oklabColor - The Oklab color object {L, a, b}.
 * @returns {SrgbColor} The sRGB color object {r, g, b}.
 * @throws {TypeError} if `oklabColor` is not a valid OklabColor object.
 * @example
 * const srgbRed = oklabToSrgb({ L: 0.627955, a: 0.224863, b: 0.125846 });
 * // srgbRed ≈ { r: 1, g: 0, b: 0 }
 */
export function oklabToSrgb(oklabColor) {
  // Type checking for oklabColor is handled by oklabToLinearSrgb
  const linearSrgb = oklabToLinearSrgb(oklabColor);
  return linearSrgbToSrgb(linearSrgb); // from srgb.js
}

// --- sRGB <-> OkLCh Convenience Pipeline Functions ---

/**
 * Converts an sRGB color object directly to an OkLCh color object.
 * @param {SrgbColor} srgbColor - The sRGB color object {r, g, b} with components in [0, 1].
 * @returns {OklchColor} The OkLCh color object {L, C, h}.
 * @throws {TypeError} if `srgbColor` is not a valid SrgbColor object.
 * @example
 * const oklchRed = srgbToOklch({ r: 1, g: 0, b: 0 });
 * // oklchRed ≈ { L: 0.628, C: 0.258, h: 29.2 }
 */
export function srgbToOklch(srgbColor) {
    const oklab = srgbToOklab(srgbColor); // Type checking handled by srgbToOklab
    return oklabToOklch(oklab);
}

/**
 * Converts an OkLCh color object directly to an sRGB (gamma-corrected) color object.
 * The resulting sRGB values are not guaranteed to be in gamut [0,1].
 * @param {OklchColor} oklchColor - The OkLCh color object {L, C, h}.
 * @returns {SrgbColor} The sRGB color object {r, g, b}.
 * @throws {TypeError} if `oklchColor` is not a valid OklchColor object.
 * @example
 * const srgbRed = oklchToSrgb({ L: 0.627955, C: 0.25782, h: 29.233 });
 * // srgbRed ≈ { r: 1, g: 0, b: 0 }
 */
export function oklchToSrgb(oklchColor) {
    const oklab = oklchToOklab(oklchColor); // Type checking handled by oklchToOklab
    return oklabToSrgb(oklab);
}