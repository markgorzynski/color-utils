/**
 * @module cielab
 * @description Functions for CIE L*a*b* (CIELAB) and CIE L*C*h_ab (CIELCh) color space conversions.
 * Includes transformations to/from CIE XYZ (D65) and sRGB (gamma-corrected),
 * and between CIELAB and CIELCh.
 * CIELAB and CIELCh components follow standard definitions (e.g., L* 0-100).
 * XYZ values assume Y is in the 0-100 range for D65 when converting to/from Lab internally,
 * but are stored as Y 0-1 in XyzColor objects as per architecture. This module handles scaling.
 */

import {
  D65_WHITE_POINT_XYZ,
  degreesToRadians,
  radiansToDegrees
} from './utils.js';

import {
  srgbToXyz as srgbObjectToXyzObject, // Renaming to avoid conflict if used internally
  xyzToSrgb as xyzObjectToSrgbObject  // Renaming to avoid conflict if used internally
} from './srgb.js';

// Assuming SrgbColor, XyzColor, LabColor, and LchColor are defined in types.js


// --- Internal CIELAB Helper Functions ---

const DELTA_CIELAB = 6 / 29;
const DELTA_CUBED_CIELAB = DELTA_CIELAB * DELTA_CIELAB * DELTA_CIELAB; // (6/29)^3 approx 0.008856
const FACTOR_CIELAB = (1 / 3) * (1 / (DELTA_CIELAB * DELTA_CIELAB)); // (1/3) * (29/6)^2 approx 7.787

/**
 * The non-linear function f(t) used in standard XYZ to CIELAB conversions.
 * Internal to this module.
 * @param {number} t - The input ratio (e.g., X/Xn, Y/Yn, Z/Zn).
 * @returns {number} The transformed value.
 * @private
 */
function _cielabForwardTransform(t) {
  return t > DELTA_CUBED_CIELAB ? Math.cbrt(t) : FACTOR_CIELAB * t + 4 / 29;
}

/**
 * The inverse of the non-linear function f(t) used in CIELAB conversions.
 * Internal to this module.
 * @param {number} value - The transformed value.
 * @returns {number} The original ratio.
 * @private
 */
function _cielabInverseTransform(value) {
  return value > DELTA_CIELAB ? Math.pow(value, 3) : (value - 4 / 29) / FACTOR_CIELAB;
}


// --- CIE XYZ <-> CIELAB Conversions ---

/**
 * Converts a CIE XYZ (D65) color object to a CIELAB color object.
 * The input XyzColor has Y in the 0-1 range.
 * @param {XyzColor} xyzColor - The CIE XYZ color object {x, y, z}.
 * @param {XyzColor} [whitePoint=D65_WHITE_POINT_XYZ] - The reference white point (Y=100 scale from utils).
 * @returns {LabColor} The CIELAB color object {L, a, b}.
 * @throws {TypeError} if xyzColor or whitePoint is not valid.
 */
export function xyzToLab(xyzColor, whitePoint = D65_WHITE_POINT_XYZ) {
  if (typeof xyzColor !== 'object' || xyzColor === null ||
      typeof xyzColor.x !== 'number' || typeof xyzColor.y !== 'number' || typeof xyzColor.z !== 'number') {
    throw new TypeError('Input xyzColor must be an object with x, y, z number properties.');
  }
  if (typeof whitePoint !== 'object' || whitePoint === null ||
      typeof whitePoint.X !== 'number' || typeof whitePoint.Y !== 'number' || typeof whitePoint.Z !== 'number' || whitePoint.Y === 0) {
    throw new TypeError('Input whitePoint must be an object with X, Y, Z number properties, and Y_n cannot be zero.');
  }

  // Input xyzColor.y is 0-1. whitePoint.Y is 100.
  // Ratios X/Xn, Y/Yn, Z/Zn should use XYZ values on the same scale.
  // We scale Xn, Yn, Zn to be 0-1 based before division for consistency with xyzColor type.
  const xnRel = whitePoint.X / 100;
  const ynRel = whitePoint.Y / 100; // Should be 1.0 for D65_WHITE_POINT_XYZ
  const znRel = whitePoint.Z / 100;

  const xr = xyzColor.x / xnRel;
  const yr = xyzColor.y / ynRel;
  const zr = xyzColor.z / znRel;

  const fx = _cielabForwardTransform(xr);
  const fy = _cielabForwardTransform(yr);
  const fz = _cielabForwardTransform(zr);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
}

/**
 * Converts a CIELAB color object to a CIE XYZ (D65) color object.
 * The output XyzColor will have Y in the 0-1 range.
 * @param {LabColor} labColor - The CIELAB color object {L, a, b}.
 * @param {XyzColor} [whitePoint=D65_WHITE_POINT_XYZ] - The reference white point (Y=100 scale from utils).
 * @returns {XyzColor} The CIE XYZ color object {x, y, z}.
 * @throws {TypeError} if labColor or whitePoint is not valid.
 */
export function labToXyz(labColor, whitePoint = D65_WHITE_POINT_XYZ) {
  if (typeof labColor !== 'object' || labColor === null ||
      typeof labColor.L !== 'number' || typeof labColor.a !== 'number' || typeof labColor.b !== 'number') {
    throw new TypeError('Input labColor must be an object with L, a, b number properties.');
  }
  if (typeof whitePoint !== 'object' || whitePoint === null ||
      typeof whitePoint.X !== 'number' || typeof whitePoint.Y !== 'number' || typeof whitePoint.Z !== 'number' || whitePoint.Y === 0) {
    throw new TypeError('Input whitePoint must be an object with X, Y, Z number properties, and Y_n cannot be zero.');
  }

  const fy = (labColor.L + 16) / 116;
  const fx = labColor.a / 500 + fy;
  const fz = fy - labColor.b / 200;

  const xr = _cielabInverseTransform(fx);
  const yr = _cielabInverseTransform(fy);
  const zr = _cielabInverseTransform(fz);

  // Scale Xn, Yn, Zn to be 0-1 based for multiplication
  const xnRel = whitePoint.X / 100;
  const ynRel = whitePoint.Y / 100; // Should be 1.0 for D65_WHITE_POINT_XYZ
  const znRel = whitePoint.Z / 100;

  const x = xr * xnRel;
  const y = yr * ynRel;
  const z = zr * znRel;

  return { x, y, z };
}


// --- CIELAB <-> CIELCh Conversions ---

/**
 * Converts a CIELAB color object to a CIELCh color object.
 * Hue (h) is returned in degrees [0, 360).
 * @param {LabColor} labColor - The CIELAB color object {L, a, b}.
 * @returns {LchColor} The CIELCh color object {L, C, h}.
 * @throws {TypeError} if labColor is not a valid LabColor object.
 */
export function labToLch(labColor) {
  if (typeof labColor !== 'object' || labColor === null ||
      typeof labColor.L !== 'number' || typeof labColor.a !== 'number' || typeof labColor.b !== 'number') {
    throw new TypeError('Input labColor must be an object with L, a, b number properties.');
  }
  const { L, a, b } = labColor;

  const C = Math.sqrt(a * a + b * b);
  let h = radiansToDegrees(Math.atan2(b, a));

  if (h < 0) {
    h += 360;
  }
  // Ensure h is exactly 0 for achromatic colors where C is very close to 0
  if (C < 1e-7) { // Tolerance for C being effectively zero
      h = 0;
  }


  return { L, C, h };
}

/**
 * Converts a CIELCh color object to a CIELAB color object.
 * Hue (h) is expected in degrees.
 * @param {LchColor} lchColor - The CIELCh color object {L, C, h}.
 * @returns {LabColor} The CIELAB color object {L, a, b}.
 * @throws {TypeError} if lchColor is not a valid LchColor object.
 */
export function lchToLab(lchColor) {
  if (typeof lchColor !== 'object' || lchColor === null ||
      typeof lchColor.L !== 'number' || typeof lchColor.C !== 'number' || typeof lchColor.h !== 'number') {
    throw new TypeError('Input lchColor must be an object with L, C, h number properties.');
  }
  const { L, C, h } = lchColor;

  const hRadians = degreesToRadians(h);
  const a = C * Math.cos(hRadians);
  const b = C * Math.sin(hRadians);

  return { L, a, b };
}

// --- sRGB <-> CIELAB/CIELCh Convenience Pipeline Functions ---

/**
 * Converts an sRGB color object directly to a CIELAB color object.
 * @param {SrgbColor} srgbColor - The sRGB color object {r, g, b}.
 * @param {XyzColor} [whitePoint=D65_WHITE_POINT_XYZ] - The reference white point.
 * @returns {LabColor} The CIELAB color object {L, a, b}.
 */
export function srgbToLab(srgbColor, whitePoint = D65_WHITE_POINT_XYZ) {
  const xyz = srgbObjectToXyzObject(srgbColor); // srgb.js handles SrgbColor type check
  return xyzToLab(xyz, whitePoint);
}

/**
 * Converts a CIELAB color object directly to an sRGB color object.
 * @param {LabColor} labColor - The CIELAB color object {L, a, b}.
 * @param {XyzColor} [whitePoint=D65_WHITE_POINT_XYZ] - The reference white point.
 * @returns {SrgbColor} The sRGB color object {r, g, b}.
 */
export function labToSrgb(labColor, whitePoint = D65_WHITE_POINT_XYZ) {
  const xyz = labToXyz(labColor, whitePoint); // Handles LabColor type check
  return xyzObjectToSrgbObject(xyz);
}

/**
 * Converts an sRGB color object directly to a CIELCh color object.
 * @param {SrgbColor} srgbColor - The sRGB color object {r, g, b}.
 * @param {XyzColor} [whitePoint=D65_WHITE_POINT_XYZ] - The reference white point.
 * @returns {LchColor} The CIELCh color object {L, C, h}.
 */
export function srgbToLch(srgbColor, whitePoint = D65_WHITE_POINT_XYZ) {
  const lab = srgbToLab(srgbColor, whitePoint);
  return labToLch(lab);
}

/**
 * Converts a CIELCh color object directly to an sRGB color object.
 * @param {LchColor} lchColor - The CIELCh color object {L, C, h}.
 * @param {XyzColor} [whitePoint=D65_WHITE_POINT_XYZ] - The reference white point.
 * @returns {SrgbColor} The sRGB color object {r, g, b}.
 */
export function lchToSrgb(lchColor, whitePoint = D65_WHITE_POINT_XYZ) {
  const lab = lchToLab(lchColor); // Handles LchColor type check
  return labToSrgb(lab, whitePoint);
}