/**
 * @module cielab
 * @description Functions for CIE L*a*b* and CIE L*C*h_ab conversions and pipelines to/from XYZ and sRGB.
 *
 * RANGE CONVENTIONS:
 * ==================
 * Input/Output Ranges:
 *   - XYZ: X,Y,Z in 0-1 scale (Y=1 for white point)
 *   - Lab: L in 0-100, a/b typically -128 to +127
 *   - LCh: L in 0-100, C in 0+, h in 0-360 degrees
 *   - sRGB: r,g,b in 0-1
 *
 * Internal Processing:
 *   - Reference white (D65): X=95.047, Y=100, Z=108.883 (0-100 scale)
 *   - XYZ inputs are scaled from 0-1 to 0-100 for CIELAB math
 *   - XYZ outputs are scaled from 0-100 back to 0-1
 *
 * IMPORTANT:
 *   - None of these functions perform any clamping
 *   - Out-of-gamut colors will produce values outside typical ranges
 *   - Clamping should be applied separately when needed
 */


import {
  D65_WHITE_POINT_XYZ,
  degreesToRadians,
  radiansToDegrees,
  normalizeHue,
} from './utils.js';

import {
  srgbToXyz,
  xyzToSrgb,
  srgbToLinearSrgb,
  linearSrgbToSrgb,
  MATRIX_LINEAR_SRGB_TO_XYZ_D65,
  MATRIX_XYZ_TO_LINEAR_SRGB_D65,
} from './srgb.js';

// --- CIELAB Constants ---
const DELTA = 6 / 29;
const DELTA_CUBED = Math.pow(DELTA, 3);
const EPSILON = DELTA_CUBED;  // (6/29)^3
const KAPPA = Math.pow(29 / 3, 3);  // (29/3)^3

// --- Internal CIELAB Transform Functions (Optimized) ---

/**
 * Forward transform for CIELAB conversion (XYZ to Lab).
 * @private
 */
function cielabForwardTransform(t) {
  return t > DELTA_CUBED 
    ? Math.cbrt(t) 
    : (t / (3 * DELTA * DELTA)) + (4 / 29);
}

/**
 * Inverse transform for CIELAB conversion (Lab to XYZ).
 * @private
 */
function cielabInverseTransform(t) {
  return t > DELTA 
    ? Math.pow(t, 3) 
    : (3 * DELTA * DELTA) * (t - (4 / 29));
}

// --- CIELAB ↔ XYZ ---

/**
 * Converts CIE XYZ to CIELAB.
 * @param {XyzColor} xyzColor - XYZ color with values in 0-1 range.
 * @param {Object} [referenceWhite=D65_WHITE_POINT_XYZ] - Reference white point.
 * @returns {LabColor} CIELAB color { L, a, b }.
 */
export function xyzToLab(xyzColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  // Scale XYZ from 0-1 to 0-100 for standard CIELAB calculations
  const x = xyzColor.X * 100;
  const y = xyzColor.Y * 100;
  const z = xyzColor.Z * 100;
  
  const fx = cielabForwardTransform(x / referenceWhite.X);
  const fy = cielabForwardTransform(y / referenceWhite.Y);
  const fz = cielabForwardTransform(z / referenceWhite.Z);
  
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  
  return { L, a, b };
}

/**
 * Converts CIELAB to CIE XYZ.
 * @param {LabColor} labColor - CIELAB color { L, a, b }.
 * @param {Object} [referenceWhite=D65_WHITE_POINT_XYZ] - Reference white point.
 * @returns {XyzColor} XYZ color with values in 0-1 range.
 */
export function labToXyz(labColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  const { L, a, b } = labColor;
  
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  
  const x = cielabInverseTransform(fx) * referenceWhite.X;
  const y = cielabInverseTransform(fy) * referenceWhite.Y;
  const z = cielabInverseTransform(fz) * referenceWhite.Z;
  
  // Scale back to 0-1 range
  return { X: x / 100, Y: y / 100, Z: z / 100 };
}

// --- CIELAB ↔ CIELCh ---

/**
 * Converts CIELAB to CIELCh (cylindrical representation).
 * @param {LabColor} labColor - CIELAB color { L, a, b }.
 * @returns {LchColor} CIELCh color { L, C, h }.
 */
export function labToLch(labColor) {
  const { L, a, b } = labColor;
  
  const C = Math.sqrt(a * a + b * b);
  let h = radiansToDegrees(Math.atan2(b, a));
  
  // Normalize hue to [0, 360)
  if (h < 0) h += 360;
  
  return { L, C, h };
}

/**
 * Converts CIELCh to CIELAB.
 * @param {LchColor} lchColor - CIELCh color { L, C, h }.
 * @returns {LabColor} CIELAB color { L, a, b }.
 */
export function lchToLab(lchColor) {
  const { L, C, h } = lchColor;
  
  const hRad = degreesToRadians(h);
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  
  return { L, a, b };
}

// --- Direct sRGB ↔ CIELAB Conversions (Optimized from abridged) ---

/**
 * Converts sRGB directly to CIELAB.
 * Optimized implementation that bypasses intermediate XYZ object creation.
 * @param {SrgbColor} srgbColor - sRGB color { r, g, b } with values 0-1.
 * @param {Object} [referenceWhite=D65_WHITE_POINT_XYZ] - Reference white point.
 * @returns {LabColor} CIELAB color { L, a, b }.
 */
export function srgbToLab(srgbColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  // Convert to linear RGB
  const lin = srgbToLinearSrgb(srgbColor);
  
  // Convert to XYZ using matrix multiplication (scaled to 0-100)
  const x = (MATRIX_LINEAR_SRGB_TO_XYZ_D65[0][0] * lin.r + 
             MATRIX_LINEAR_SRGB_TO_XYZ_D65[0][1] * lin.g + 
             MATRIX_LINEAR_SRGB_TO_XYZ_D65[0][2] * lin.b) * 100;
  const y = (MATRIX_LINEAR_SRGB_TO_XYZ_D65[1][0] * lin.r + 
             MATRIX_LINEAR_SRGB_TO_XYZ_D65[1][1] * lin.g + 
             MATRIX_LINEAR_SRGB_TO_XYZ_D65[1][2] * lin.b) * 100;
  const z = (MATRIX_LINEAR_SRGB_TO_XYZ_D65[2][0] * lin.r + 
             MATRIX_LINEAR_SRGB_TO_XYZ_D65[2][1] * lin.g + 
             MATRIX_LINEAR_SRGB_TO_XYZ_D65[2][2] * lin.b) * 100;
  
  // Convert XYZ to Lab
  const fx = cielabForwardTransform(x / referenceWhite.X);
  const fy = cielabForwardTransform(y / referenceWhite.Y);
  const fz = cielabForwardTransform(z / referenceWhite.Z);
  
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

/**
 * Converts CIELAB directly to sRGB.
 * Optimized implementation that bypasses intermediate XYZ object creation.
 * @param {LabColor} labColor - CIELAB color { L, a, b }.
 * @param {Object} [referenceWhite=D65_WHITE_POINT_XYZ] - Reference white point.
 * @returns {SrgbColor} sRGB color { r, g, b } with values 0-1.
 */
export function labToSrgb(labColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  const { L, a, b } = labColor;
  
  // Convert Lab to XYZ
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  
  const x = cielabInverseTransform(fx) * referenceWhite.X;
  const y = cielabInverseTransform(fy) * referenceWhite.Y;
  const z = cielabInverseTransform(fz) * referenceWhite.Z;
  
  // Convert XYZ to linear RGB (scale from 100 to 1)
  const linR = (MATRIX_XYZ_TO_LINEAR_SRGB_D65[0][0] * x + 
                MATRIX_XYZ_TO_LINEAR_SRGB_D65[0][1] * y + 
                MATRIX_XYZ_TO_LINEAR_SRGB_D65[0][2] * z) / 100;
  const linG = (MATRIX_XYZ_TO_LINEAR_SRGB_D65[1][0] * x + 
                MATRIX_XYZ_TO_LINEAR_SRGB_D65[1][1] * y + 
                MATRIX_XYZ_TO_LINEAR_SRGB_D65[1][2] * z) / 100;
  const linB = (MATRIX_XYZ_TO_LINEAR_SRGB_D65[2][0] * x + 
                MATRIX_XYZ_TO_LINEAR_SRGB_D65[2][1] * y + 
                MATRIX_XYZ_TO_LINEAR_SRGB_D65[2][2] * z) / 100;
  
  // Apply gamma correction
  return linearSrgbToSrgb({ r: linR, g: linG, b: linB });
}

// --- sRGB ↔ CIELCh Convenience Functions ---

/**
 * Converts sRGB to CIELCh.
 * @param {SrgbColor} srgbColor - sRGB color { r, g, b } with values 0-1.
 * @param {Object} [referenceWhite=D65_WHITE_POINT_XYZ] - Reference white point.
 * @returns {LchColor} CIELCh color { L, C, h }.
 */
export function srgbToLch(srgbColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  const lab = srgbToLab(srgbColor, referenceWhite);
  return labToLch(lab);
}

/**
 * Converts CIELCh to sRGB.
 * @param {LchColor} lchColor - CIELCh color { L, C, h }.
 * @param {Object} [referenceWhite=D65_WHITE_POINT_XYZ] - Reference white point.
 * @returns {SrgbColor} sRGB color { r, g, b } with values 0-1.
 */
export function lchToSrgb(lchColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  const lab = lchToLab(lchColor);
  return labToSrgb(lab, referenceWhite);
}