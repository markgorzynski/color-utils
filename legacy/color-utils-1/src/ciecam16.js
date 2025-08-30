/**
 * @module ciecam16
 * @description Functions for CIECAM16 color appearance model calculations.
 * CIECAM16 predicts the appearance of colors under various viewing conditions.
 * This module converts sRGB colors to CIECAM16 appearance correlates.
 */

import { D65_WHITE_POINT_XYZ, multiplyMatrixVector, radiansToDegrees } from './utils.js';
import { srgbToXyz } from './srgb.js';

// Assuming SrgbColor, XyzColor, CiecamSurroundType, Ciecam16ViewingConditions, and Ciecam16Appearance are defined in types.js

/**
 * @typedef {'average' | 'dim' | 'dark'} CiecamSurroundType
 * Defines the type of surround for viewing conditions.
 */

/**
 * @typedef {object} Ciecam16ViewingConditions
 * @property {number} adaptingLuminance - Adapting field luminance in cd/m^2 (L_A).
 * @property {number} backgroundLuminance - Luminance of the background (Y_b), as a percentage of reference white Y (e.g., 20 for 20% gray, 100 for white).
 * @property {CiecamSurroundType} surroundType - Type of surround: 'average', 'dim', or 'dark'.
 * @property {number} [degreeOfAdaptation=null] - Optional: Degree of adaptation (D). If null or not provided, it's calculated. Range 0-1.
 */

/**
 * @typedef {object} Ciecam16Appearance
 * @property {number} J - Lightness
 * @property {number} Q - Brightness
 * @property {number} C - Chroma
 * @property {number} M - Colorfulness
 * @property {number} s - Saturation
 * @property {number} h - Hue angle in degrees (0-360)
 * @property {number} H - Hue quadrature (not always calculated or used, can be same as h or a specific index)
 * @property {number} a_c - Cartesian a-coordinate (red-green) for CAM16
 * @property {number} b_c - Cartesian b-coordinate (yellow-blue) for CAM16
 */

// CIECAM16 Constants and Matrices
// CAT16 Chromatic Adaptation Transform Matrix (from CAT02, often used in CIECAM16)
// This matrix transforms XYZ to an LMS-like space.
const MATRIX_CAT16 = Object.freeze([
  Object.freeze([0.401288, 0.650173, -0.051461]),
  Object.freeze([-0.250268, 1.204414, 0.045854]),
  Object.freeze([-0.002079, 0.048952, 0.953127]),
]);

// Surround condition parameters (F, c, Nc)
const SURROUND_PARAMS = Object.freeze({
  average: { F: 1.0, c: 0.69, Nc: 1.0 },
  dim:     { F: 0.9, c: 0.59, Nc: 0.9 }, // Nc can vary, 0.9 is a common value
  dark:    { F: 0.8, c: 0.525, Nc: 0.8 },// Nc can vary, 0.8 is a common value
});


/**
 * Computes CIECAM16 color appearance correlates from an sRGB color.
 *
 * @param {SrgbColor} srgbColor - The input sRGB color object {r, g, b} (components 0-1).
 * @param {Ciecam16ViewingConditions} viewingConditions - The viewing conditions.
 * @returns {Ciecam16Appearance} The CIECAM16 appearance correlates.
 * @throws {TypeError} if inputs are not valid.
 */
export function srgbToCiecam16(srgbColor, viewingConditions) {
  if (typeof srgbColor !== 'object' || srgbColor === null ||
      typeof srgbColor.r !== 'number' || typeof srgbColor.g !== 'number' || typeof srgbColor.b !== 'number') {
    throw new TypeError('Input srgbColor must be an object with r, g, b number properties.');
  }
  if (typeof viewingConditions !== 'object' || viewingConditions === null ||
      typeof viewingConditions.adaptingLuminance !== 'number' ||
      typeof viewingConditions.backgroundLuminance !== 'number' ||
      !SURROUND_PARAMS[viewingConditions.surroundType]) {
    throw new TypeError('Invalid viewingConditions object or missing/invalid properties.');
  }

  // --- Step 0: Prepare inputs and viewing condition parameters ---
  const L_A = viewingConditions.adaptingLuminance;
  const Y_b = viewingConditions.backgroundLuminance; // This is Yb relative to Yw=100.
  const surround = SURROUND_PARAMS[viewingConditions.surroundType];
  const F = surround.F;
  const c = surround.c;
  const N_c = surround.Nc;

  // Convert sRGB (0-1) to XYZ (Y in 0-1 range)
  const xyz_sample_01 = srgbToXyz(srgbColor);

  // Scale XYZ to Y=100 range for CIECAM16 calculations
  const X_s = xyz_sample_01.x * 100;
  const Y_s = xyz_sample_01.y * 100;
  const Z_s = xyz_sample_01.z * 100;

  // Reference white (D65, Yw=100) from utils.js
  const X_w = D65_WHITE_POINT_XYZ.X;
  const Y_w = D65_WHITE_POINT_XYZ.Y; // Should be 100
  const Z_w = D65_WHITE_POINT_XYZ.Z;

  // --- Step 1: Calculate "cone" responses for sample and white ---
  const [R_s, G_s, B_s] = multiplyMatrixVector(MATRIX_CAT16, [X_s, Y_s, Z_s]);
  const [R_w, G_w, B_w] = multiplyMatrixVector(MATRIX_CAT16, [X_w, Y_w, Z_w]);

  // --- Step 2: Chromatic Adaptation ---
  // Degree of adaptation (D)
  let D;
  if (viewingConditions.degreeOfAdaptation !== null && viewingConditions.degreeOfAdaptation !== undefined) {
    D = Math.max(0, Math.min(1, viewingConditions.degreeOfAdaptation));
  } else {
    D = F * (1 - (1 / 3.6) * Math.exp((-L_A - 42) / 92));
    D = Math.max(0, Math.min(1, D)); // Clamp D to [0, 1]
  }

  // Calculate D * Y_w / LMS_w terms for adaptation.
  // These are often simplified if the CAT matrix is chosen such that R_w=G_w=B_w=Y_w for the adapted white.
  // The original cat16.js uses a simplified LMS_c calculation which implies this.
  // For a more general CAT, you'd use:
  // R_c = (D * (Y_w / R_w) + (1 - D)) * R_s; etc.
  // The cat16.js simplifies this to: ((D * 1) + (1 - D)) * LMS.L,
  // which is just LMS.L if D=1, or a weighted average if D<1.
  // This simplification is valid if the CAT matrix is normalized such that R_w, G_w, B_w are equal (or related to Y_w in a specific way).
  // Given the cat16.js simplification, we'll follow it.
  const R_c = (D * (Y_w / R_w) + (1.0 - D)) * R_s; // More general form
  const G_c = (D * (Y_w / G_w) + (1.0 - D)) * G_s;
  const B_c = (D * (Y_w / B_w) + (1.0 - D)) * B_s;
  // Simpler version as in cat16.js (assumes Y_w/R_w etc. factors are 1 or handled by D):
  // const R_c = (D * 1 + (1 - D)) * R_s; // effectively R_s if D=1
  // const G_c = (D * 1 + (1 - D)) * G_s;
  // const B_c = (D * 1 + (1 - D)) * B_s;


  // --- Step 3: Post-adaptation cone response non-linearity ---
  // Luminance level adaptation factor
  const k = 1 / (5 * L_A + 1);
  const F_L = 0.2 * Math.pow(k, 4) * (5 * L_A) + 0.1 * Math.pow(1 - Math.pow(k, 4), 2) * Math.pow(5 * L_A, 1/3);
  // Prevent F_L from being zero or too small if L_A is very low, to avoid division by zero or instability.
  const FL_prime = Math.max(F_L, 0.001); // Minimum F_L to avoid issues

  // Non-linear response function (Hunt-Pointer-Estevez type, adapted)
  // Note: factor = (channel * F_L) / 100 in cat16.js implies channel is scaled 0-100.
  // R_c, G_c, B_c are already scaled appropriately if X_s, Y_s, Z_s were 0-100.
  const R_a_prime = Math.pow(FL_prime * Math.abs(R_c) / 100, 0.42);
  const G_a_prime = Math.pow(FL_prime * Math.abs(G_c) / 100, 0.42);
  const B_a_prime = Math.pow(FL_prime * Math.abs(B_c) / 100, 0.42);

  const R_a = (400 * R_a_prime / (R_a_prime + 27.13)) * Math.sign(R_c);
  const G_a = (400 * G_a_prime / (G_a_prime + 27.13)) * Math.sign(G_c);
  const B_a = (400 * B_a_prime / (B_a_prime + 27.13)) * Math.sign(B_c);

  // --- Step 4 & 5: Opponent color dimensions and hue angle ---
  const a_c16 = R_a - (12 * G_a / 11) + (B_a / 11);
  const b_c16 = (1 / 9) * (R_a + G_a - 2 * B_a);

  let h_rad = Math.atan2(b_c16, a_c16);
  let h_deg = radiansToDegrees(h_rad);
  if (h_deg < 0) {
    h_deg += 360;
  }
  if (Math.sqrt(a_c16*a_c16 + b_c16*b_c16) < 1e-5) h_deg = 0; // Achromatic

  // --- Step 6: Eccentricity factor (e_t) ---
  // (h_rad here should be the one before ensuring positive, or adjust angle for cos)
  // cat16.js uses h_rad + 2, assuming 2 radians. CIECAM02 uses h in degrees + 20.14. Let's stick to cat16.js for now.
  const e_t = (1/4) * (Math.cos(h_rad + (2 * Math.PI / 180) * radiansToDegrees(1)) + 3.8); // Corrected from cat16.js to use radians consistently if 2 is degrees, or just use h_rad + 2 if 2 is radians. The original cat16.js just added 2. Let's stick to h_rad + 2 for now but note ambiguity.

  // --- Step 7: Achromatic response (A) ---
  // Achromatic response for sample
  const A_s = (2 * R_a + G_a + (1/20) * B_a - 0.305) * N_c; // N_c is surround.Nc

  // Achromatic response for white (reference)
  // Need R_aw, G_aw, B_aw (adapted cone responses for white)
  // R_w, G_w, B_w are cone responses for white before adaptation.
  // If D=1 (full adaptation to specified white), then R_wc = R_w, etc.
  // The original cat16.js calculates A_w using R_aw, G_aw, B_aw which are nonLinearResponse(whiteLMS.L) etc.
  // This implies whiteLMS are the pre-adapted cone responses of the illuminant.
  const R_w_a_prime = Math.pow(FL_prime * Math.abs(R_w) / 100, 0.42);
  const G_w_a_prime = Math.pow(FL_prime * Math.abs(G_w) / 100, 0.42);
  const B_w_a_prime = Math.pow(FL_prime * Math.abs(B_w) / 100, 0.42);

  const R_aw = (400 * R_w_a_prime / (R_w_a_prime + 27.13)) * Math.sign(R_w);
  const G_aw = (400 * G_w_a_prime / (G_w_a_prime + 27.13)) * Math.sign(G_w);
  const B_aw = (400 * B_w_a_prime / (B_w_a_prime + 27.13)) * Math.sign(B_w);

  const A_w = (2 * R_aw + G_aw + (1/20) * B_aw - 0.305) * N_c;


  // --- Step 8: Lightness (J) ---
  const z_factor = 1.48 + Math.sqrt(Y_b / Y_w); // Y_b is relative to Y_w=100. cat16.js used N_bb = 0.725 * (1/Y_b)^0.2 and z = 1.48 + sqrt(N_bb). This is different.
                                         // Let's use the simpler form from CIECAM02 if N_bb is not clearly defined.
                                         // The z in cat16.js used N_bb which is related to Y_b. Let's use Y_b directly.
                                         // CIECAM16 uses N_bb = 0.725 * (Y_w / Y_b)^0.2, if Y_b is absolute.
                                         // If Y_b is relative to Y_w (0-100), then Y_w/Y_b becomes 100/Y_b
  const N_bb = 0.725 * Math.pow(Y_w / Y_b, 0.2); // Assuming Y_b is relative luminance (0-100) of background
  const z = 1.48 + Math.sqrt(N_bb); // As per cat16.js structure with N_bb
  const J = (A_s === 0 && A_w === 0) ? 0 : 100 * Math.pow(A_s / A_w, c * z);


  // --- Step 9: Brightness (Q) ---
  const Q = (4 / c) * Math.sqrt(J / 100) * (A_w + 4) * Math.pow(F_L, 0.25);

  // --- Step 10: Chroma (C) ---
  // Temporary magnitude t
  // cat16.js uses: t = sqrt((a_val * a_val + b_val * b_val) / (R_aw + G_aw + (21 / 20) * B_aw));
  const t_cat16 = (R_aw + G_aw + (21/20) * B_aw === 0) ? 0 : Math.sqrt((a_c16 * a_c16 + b_c16 * b_c16) / (R_aw + G_aw + (21/20) * B_aw));

  const C = Math.pow(t_cat16, 0.9) * Math.sqrt(J / 100) * Math.pow(1.64 - Math.pow(0.29, N_bb), 0.73);

  // --- Step 11: Colorfulness (M) ---
  const M = C * Math.pow(F_L, 0.25);

  // --- Step 12: Saturation (s) ---
  const s = (Q === 0) ? 0 : 100 * Math.sqrt(M / Q);

  return {
    J: J || 0, //Ensure not NaN
    Q: Q || 0,
    C: C || 0,
    M: M || 0,
    s: s || 0,
    h: h_deg,
    H: h_deg, // Hue quadrature H often same as h for basic implementation
    a_c: a_c16 || 0,
    b_c: b_c16 || 0,
  };
}