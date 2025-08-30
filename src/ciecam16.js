/**
 * @file src/ciecam16.js
 * @module color-utils/ciecam16
 * @description Implements the forward CIECAM16 color appearance model,
 * predicting color appearance correlates (Lightness J, Chroma C, Hue h, etc.)
 * from CIE XYZ tristimulus values under specified viewing conditions.
 *
 * CIECAM16 is the successor to CIECAM02, recommended by the CIE for color
 * appearance modeling in most applications. It accounts for chromatic adaptation,
 * background induction, surround effects, and luminance adaptation.
 *
 * **XYZ Scaling Convention:**
 * - Input XYZ values (for both sample and reference white) are expected to be on
 * a scale where Y (luminance) is typically between 0 and 100 (e.g., Y_white = 100).
 * - The `srgbToXyz` function from `srgb.js` (if used to get input XYZ) returns
 * XYZ with Y scaled 0-1. This module's `srgbToCiecam16` function handles the
 * necessary scaling (multiplying by 100) before feeding into the core CIECAM16 calculation.
 *
 * @see CIE 224:2017 "CIECAM16 Colour Appearance Model" (Primary reference)
 * @see Moroney, N., Fairchild, M. D., Hunt, R. W. G., Li, C., Luo, M. R., & Newman, T. (2002).
 * The CIECAM02 color appearance model. (CIECAM16 builds upon CIECAM02)
 * @see Li, C. J., Li, Z. Q., Wang, Z. F., Xu, Y. G., Luo, M. R., Cui, G. H., ... & Pointer, M. (2017).
 * Comprehensive color solutions: CAM16, CAT16, and CAM16-UCS. Coloration Technology, 133(3), 209-223.
 * (Details on CAT16 and CAM16-UCS which are part of the broader CAM16 framework).
 */

// --- Type Imports for JSDoc ---
/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {import('./types.js').XyzColor} XyzColor */ // As defined: Y ~0-1 or Y ~0-100 based on context.
/** @typedef {import('./types.js').CiecamSurroundType} CiecamSurroundType */
/** @typedef {import('./types.js').Ciecam16ViewingConditions} Ciecam16ViewingConditions */
/** @typedef {import('./types.js').Ciecam16Appearance} Ciecam16Appearance */

// --- Utility and Color Module Imports ---
import { D65_WHITE_POINT_XYZ, multiplyMatrixVector, degreesToRadians, radiansToDegrees, normalizeHue, signPreservingPow } from './utils.js';
import { srgbToXyz } from './srgb.js'; // Returns XYZ with Y in 0-1 range for D65

// --- CIECAM16 Constants and Matrices ---

/**
 * CAT16 Chromatic Adaptation Transform Matrix (Bradford-like, optimized).
 * Transforms XYZ to an LMS-like cone response space (R_16 G_16 B_16).
 * This is M_16 from Li et al. (2017).
 * @private
 * @type {ReadonlyArray<ReadonlyArray<number>>}
 */
const MATRIX_CAT16_XYZ_TO_LMS = Object.freeze([
  Object.freeze([0.401288, 0.650173, -0.051461]),
  Object.freeze([-0.250268, 1.204414, 0.045854]),
  Object.freeze([-0.002079, 0.048952, 0.953127]),
]);

/**
 * Inverse of MATRIX_CAT16_XYZ_TO_LMS (M_16_inv).
 * Transforms LMS-like cone responses (R_16 G_16 B_16) back to XYZ.
 * @private
 * @type {ReadonlyArray<ReadonlyArray<number>>}
 */
const MATRIX_CAT16_LMS_TO_XYZ = Object.freeze([
  Object.freeze([1.86206786, -1.01125463, 0.14918677]),
  Object.freeze([0.38752654, 0.62144744, -0.00897398]),
  Object.freeze([-0.01557209, -0.03414112, 1.04971321]),
]);


/**
 * Parameters associated with surround conditions (F, c, Nc).
 * These values are standard for CIECAM16.
 * - F: Factor determining degree of adaptation.
 * - c: Impact of surround.
 * - Nc: Chromatic induction factor.
 * @private
 * @type {Readonly<Record<CiecamSurroundType, {F: number, c: number, Nc: number}>>}
 */
const SURROUND_PARAMS = Object.freeze({
  average: { F: 1.0, c: 0.69, Nc: 1.0 },
  dim:     { F: 0.9, c: 0.59, Nc: 0.9 },
  dark:    { F: 0.8, c: 0.525, Nc: 0.8 },
});

/**
 * Core CIECAM16 forward calculation from CIE XYZ to appearance correlates.
 * @private
 * @param {XyzColor} xyzSample - XYZ of the sample (Y typically 0-100).
 * @param {XyzColor} xyzWhite - XYZ of the reference white (Y typically 100).
 * @param {Ciecam16ViewingConditions} vc - Viewing conditions.
 * @returns {Ciecam16Appearance} Calculated appearance correlates.
 */
function _xyzToCiecam16Correlates(xyzSample, xyzWhite, vc) {
  // --- Step 0: Prepare viewing condition parameters ---
  const L_A = vc.adaptingLuminance; // Adapting field luminance in cd/m^2
  // Y_b is luminance factor of background (0-100, relative to Y_w=100)
  const Y_b = Math.max(0.1, Math.min(100, vc.backgroundLuminanceFactor)); // Clamp Y_b to avoid issues, 0.1 to prevent div by zero

  const surround = SURROUND_PARAMS[vc.surroundType];
  if (!surround) {
    throw new Error(`Invalid surroundType: ${vc.surroundType}`);
  }
  const F = surround.F;
  const c = surround.c;
  const N_c = surround.Nc;

  // Degree of adaptation (D factor)
  let D;
  if (vc.degreeOfAdaptation !== null && vc.degreeOfAdaptation !== undefined &&
      typeof vc.degreeOfAdaptation === 'number' && !Number.isNaN(vc.degreeOfAdaptation)) {
    D = Math.max(0, Math.min(1, vc.degreeOfAdaptation));
  } else {
    // Default D calculation if not provided (or invalid)
    D = F * (1 - (1 / 3.6) * Math.exp((-L_A - 42) / 92));
    D = Math.max(0, Math.min(1, D)); // Clamp D to [0, 1]
  }

  // --- Step 1: Convert to CAT16 LMS-like space ---
  const [R_s, G_s, B_s] = multiplyMatrixVector(MATRIX_CAT16_XYZ_TO_LMS, [xyzSample.X, xyzSample.Y, xyzSample.Z]);
  const [R_w, G_w, B_w] = multiplyMatrixVector(MATRIX_CAT16_XYZ_TO_LMS, [xyzWhite.X, xyzWhite.Y, xyzWhite.Z]);

  // --- Step 2: Chromatic adaptation (CAT16) ---
  // Calculate D_R, D_G, D_B which are effectively (Y_w / LMS_w) terms, scaled by D for incomplete adaptation.
  // If R_w, G_w, B_w are zero (e.g. black illuminant, though unlikely), set D_comp to 0 to avoid division by zero.
  const D_R = R_w === 0 ? 0 : D * (xyzWhite.Y / R_w) + (1 - D);
  const D_G = G_w === 0 ? 0 : D * (xyzWhite.Y / G_w) + (1 - D);
  const D_B = B_w === 0 ? 0 : D * (xyzWhite.Y / B_w) + (1 - D);

  const R_c = D_R * R_s; // Chromatically adapted cone responses for sample
  const G_c = D_G * G_s;
  const B_c = D_B * B_s;

  // --- Step 3: Post-adaptation non-linear response compression ---
  // Luminance level adaptation factor F_L (derived from L_A)
  const F_L_pow_025 = Math.pow(0.1758 * L_A + 0.0228, 0.25); // (k*L_A + 0.1)^0.25 where k = 1/(5*L_A_max_approx + 1) and simplified. More direct:
  // From CAM16 paper: F_L = 0.2 * k^4 * (5*L_A) + 0.1 * (1-k^4)^2 * (5*L_A)^(1/3)
  // where k = 1 / (5*L_A + 1)
  // Simpler form often used from CIECAM02 (and appears valid for CAM16):
  const k_FL = 1 / (5 * L_A + 1);
  const F_L = 0.2 * Math.pow(k_FL, 4) * (5 * L_A) +
              0.1 * Math.pow(1 - Math.pow(k_FL, 4), 2) * Math.pow(5 * L_A, 1/3);
  const FL_prime = Math.max(F_L, 1e-4); // Ensure F_L is positive to avoid issues

  // Non-linear compression applied to adapted cone responses
  // Ensure R_c, G_c, B_c are non-negative before Math.pow for exponent < 1
  const R_a_prime = signPreservingPow(FL_prime * R_c / 100, 0.42);
  const G_a_prime = signPreservingPow(FL_prime * G_c / 100, 0.42);
  const B_a_prime = signPreservingPow(FL_prime * B_c / 100, 0.42);
  // The division by 100 scales LMS to be roughly 0-1 if original Y was 0-100.

  const R_a = (400 * R_a_prime) / (R_a_prime + 27.13);
  const G_a = (400 * G_a_prime) / (G_a_prime + 27.13);
  const B_a = (400 * B_a_prime) / (B_a_prime + 27.13);
  // Adding Math.sign() if R_c, etc. could be negative, though typically they aren't.
  // R_a = (400 * signPreservingPow(FL_prime * R_c / 100, 0.42)) / (signPreservingPow(FL_prime * Math.abs(R_c) / 100, 0.42) + 27.13); (More robust if R_c can be negative)

  // --- Step 4 & 5: Opponent color dimensions (a, b) and Hue angle (h) ---
  // These are specific to CAM16-UCS, often denoted a_16, b_16 in papers
  const a_16 = R_a + B_a/11 - (12 * G_a / 11) ; // R_a - 12/11 G_a + 1/11 B_a
  const b_16 = (1 / 9) * (R_a + G_a - 2 * B_a);

  const h_rad = Math.atan2(b_16, a_16);
  let h_deg = normalizeHue(radiansToDegrees(h_rad)); // Normalize to [0, 360)

  // --- Step 6: Eccentricity factor (e_t) for hue ---
  // (h_rad here should be the original atan2 result, or ensure h_deg is used correctly)
  const e_t = (1/4) * (Math.cos(h_rad + degreesToRadians(2)) + 3.8); // From Li et al. (2017) CAM16-UCS

  // --- Step 7: Achromatic response (A) ---
  // Achromatic response for the sample
  const A_s = ( (2 * R_a) + G_a + (B_a / 20) - 0.305 ) * N_c;

  // Achromatic response for the reference white (A_w)
  // R_w, G_w, B_w are pre-adaptation. We need adapted-then-non-linear-compressed white.
  // Assuming full adaptation to the reference white (D=1 for white itself)
  const R_wc = R_w; // If D=1 for white adaptation, R_wc = (1 * Yw/Rw + 0) * Rw = Yw. This needs care.
  const G_wc = G_w; // The CAT16 output for white point should be used.
  const B_wc = B_w;
  // Then apply non-linearity:
  const R_aw_prime = signPreservingPow(FL_prime * R_wc / 100, 0.42);
  const G_aw_prime = signPreservingPow(FL_prime * G_wc / 100, 0.42);
  const B_aw_prime = signPreservingPow(FL_prime * B_wc / 100, 0.42);

  const R_aw = (400 * R_aw_prime) / (R_aw_prime + 27.13);
  const G_aw = (400 * G_aw_prime) / (G_aw_prime + 27.13);
  const B_aw = (400 * B_aw_prime) / (B_aw_prime + 27.13);

  const A_w = ( (2 * R_aw) + G_aw + (B_aw / 20) - 0.305 ) * N_c;
  const A_w_clamped = Math.max(1e-5, A_w); // Prevent division by zero for J

  // --- Step 8: Lightness (J) ---
  // Background induction factor n (derived from Y_b and Y_w)
  const N_bb = 0.725 * Math.pow(xyzWhite.Y / Y_b, 0.2); // Assuming Y_b is absolute or relative to Y_w=100
                                                       // If Y_b from vc is already relative 0-100 of Y_w, then Y_w/Y_b = 100/Y_b
  const n = N_bb; // In CAM16, n = N_bb (simplified from CIECAM02's complex N_bb/N_cb calc)

  const z_cam16 = 1.48 + Math.sqrt(n); // Exponent for J calculation, different from z_cielab
  const J = 100 * Math.pow(A_s / A_w_clamped, c * z_cam16);

  // --- Step 9: Brightness (Q) ---
  const Q = (4 / c) * Math.sqrt(J / 100) * (A_w_clamped + 4) * Math.pow(F_L, 0.25); // Use A_w_clamped

  // --- Step 10: Chroma (C) ---
  // Temporary magnitude 't'
  const t = (50000 / 13) * N_c * N_bb * e_t * Math.sqrt(a_16 * a_16 + b_16 * b_16) / (R_a + G_a + (21/20)*B_a + 0.305);
  // Chroma C
  const C = Math.pow(t, 0.9) * Math.sqrt(J / 100) * Math.pow(1.64 - Math.pow(0.29, n), 0.73);

  // --- Step 11: Colorfulness (M) ---
  const M = C * Math.pow(F_L, 0.25);

  // --- Step 12: Saturation (s) ---
  const s = (Q === 0) ? 0 : 100 * Math.sqrt(M / Q);

  // Hue Quadrature (H) - For simplicity, often H=h, but can be more complex.
  // For now, setting H = h. Calculation of H from unique hues is beyond basic CIECAM16 implementation.
  const H = h_deg;

  // Ensure non-NaN outputs, defaulting to 0 for safety if intermediate calculations fail
  const ensureNumber = val => (typeof val === 'number' && !Number.isNaN(val) ? val : 0);

  return {
    J: ensureNumber(J),
    Q: ensureNumber(Q),
    C: ensureNumber(C),
    M: ensureNumber(M),
    s: ensureNumber(s),
    h: ensureNumber(h_deg),
    H: ensureNumber(H),
    a_c: ensureNumber(a_16), // Cartesian a for CAM16-UCS (often denoted a_16)
    b_c: ensureNumber(b_16), // Cartesian b for CAM16-UCS (often denoted b_16)
  };
}

/**
 * Computes CIECAM16 color appearance correlates from an sRGB color.
 *
 * @param {SrgbColor | string} colorInput - The input sRGB color, either as an
 * `SrgbColor` object {r, g, b} (components 0-1) or a hex string (e.g., "#FF0000").
 * @param {Ciecam16ViewingConditions} viewingConditions - The viewing conditions under which
 * the color appearance is to be predicted. This includes:
 * - `adaptingLuminance` (L_A): Luminance of the adapting field in cd/m^2 (e.g., 50-300 for typical office/daylight).
 * - `backgroundLuminanceFactor` (Y_b): Luminance factor of the background, as a percentage
 * relative to the reference white's Y (e.g., 20 for a 20% gray card, 100 for a white background).
 * - `surroundType`: One of 'average', 'dim', 'dark'.
 * - `referenceWhite` (Optional, XyzColor): Tristimulus values of the reference white (e.g., D65).
 * If not provided, standard D65 (`D65_WHITE_POINT_XYZ` from `utils.js`, Y=100) is assumed.
 * If provided, ensure its Y value corresponds to the scale expected by CIECAM16 (typically Y=100).
 * - `degreeOfAdaptation` (D, Optional): Degree of chromatic adaptation [0,1]. If null/undefined,
 * it's calculated based on `adaptingLuminance` and `surroundType.F`.
 * @returns {Ciecam16Appearance} The CIECAM16 appearance correlates.
 * @throws {TypeError} if inputs are not valid.
 * @example
 * const srgbRed = { r: 1, g: 0, b: 0 };
 * const conditions = {
 * adaptingLuminance: 200,       // Bright environment (e.g. office L_A often 100-500 cd/m^2)
 * backgroundLuminanceFactor: 20, // Background is 20% gray (Y_b = 20 relative to Y_w=100)
 * surroundType: 'average',
 * // referenceWhite: D65_WHITE_POINT_XYZ, // Implicitly D65 Y=100 if not given
 * // degreeOfAdaptation: null,         // Will be calculated
 * };
 * const appearanceRed = srgbToCiecam16(srgbRed, conditions);
 * console.log('CIECAM16 for sRGB Red:', appearanceRed);
 * // Example output: { J: ~45-55, Q: ..., C: ~80-100, M: ..., s: ..., h: ~20-40, H: ..., a_c: ..., b_c: ... }
 * // Actual values depend heavily on precise viewing conditions and full model steps.
 */
export function srgbToCiecam16(colorInput, viewingConditions) {
  let srgbObj;
  if (typeof colorInput === 'string') {
    srgbObj = parseSrgbHex(colorInput);
  } else if (
    typeof colorInput === 'object' && colorInput !== null &&
    typeof colorInput.r === 'number' && !Number.isNaN(colorInput.r) &&
    typeof colorInput.g === 'number' && !Number.isNaN(colorInput.g) &&
    typeof colorInput.b === 'number' && !Number.isNaN(colorInput.b)
  ) {
    srgbObj = colorInput;
  } else {
    throw new TypeError('Invalid srgbColor input: Must be an SrgbColor object or a hex string.');
  }

  if (typeof viewingConditions !== 'object' || viewingConditions === null ||
      typeof viewingConditions.adaptingLuminance !== 'number' || Number.isNaN(viewingConditions.adaptingLuminance) ||
      typeof viewingConditions.backgroundLuminanceFactor !== 'number' || Number.isNaN(viewingConditions.backgroundLuminanceFactor) ||
      !SURROUND_PARAMS[viewingConditions.surroundType]) {
    throw new TypeError('Invalid viewingConditions object or missing/invalid essential properties (adaptingLuminance, backgroundLuminanceFactor, surroundType).');
  }
  if (viewingConditions.adaptingLuminance < 0) {
      console.warn("CIECAM16: adaptingLuminance (L_A) should be non-negative. Using Math.abs().");
      viewingConditions.adaptingLuminance = Math.abs(viewingConditions.adaptingLuminance);
  }
   if (viewingConditions.backgroundLuminanceFactor <= 0) {
      console.warn("CIECAM16: backgroundLuminanceFactor (Y_b) should be positive. Clamping to a small positive value (0.1).");
      viewingConditions.backgroundLuminanceFactor = 0.1;
  }


  // Convert sRGB (0-1 components) to XYZ (Y in 0-1 range, D65)
  const xyz_sample_scaled_Y01 = srgbToXyz(srgbObj);

  // Scale sample XYZ to Y=100 range for CIECAM16 internal calculations
  const xyz_sample_scaled_Y100 = {
    X: xyz_sample_scaled_Y01.X * 100,
    Y: xyz_sample_scaled_Y01.Y * 100,
    Z: xyz_sample_scaled_Y01.Z * 100,
  };

  // Determine reference white for CIECAM16
  // The model expects X_w, Y_w, Z_w where Y_w is typically 100.
  // D65_WHITE_POINT_XYZ from utils.js is already { X:95.047, Y:100.0, Z:108.883 }
  const xyz_ref_white = viewingConditions.referenceWhite || D65_WHITE_POINT_XYZ;
  if (typeof xyz_ref_white !== 'object' || xyz_ref_white === null ||
      typeof xyz_ref_white.X !== 'number' || Number.isNaN(xyz_ref_white.X) ||
      typeof xyz_ref_white.Y !== 'number' || Number.isNaN(xyz_ref_white.Y) || xyz_ref_white.Y === 0 ||
      typeof xyz_ref_white.Z !== 'number' || Number.isNaN(xyz_ref_white.Z) ) {
      throw new TypeError('Provided referenceWhite in viewingConditions is invalid or has Y_w=0.');
  }
  // Ensure the provided reference white Y_w is used correctly, especially if it's not 100.
  // The internal CAM16 formulas often assume Y_w=100 for some normalizations (e.g. Y_b relative to it).
  // For simplicity, this implementation assumes xyz_ref_white.Y is the absolute luminance of white,
  // and that Y_b in viewingConditions is given as a percentage relative to THIS white's Y.
  // Or more simply, that both Y_b and xyz_ref_white.Y are on a consistent scale (e.g. Y_w=100 for D65)


  // Call the core calculation function
  return _xyzToCiecam16Correlates(xyz_sample_scaled_Y100, xyz_ref_white, viewingConditions);
}