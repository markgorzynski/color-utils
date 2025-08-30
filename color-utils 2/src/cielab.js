/**
 * color-utils/cielab.js
 *
 * Functions for CIE L*a*b* and CIE L*C*h_ab conversions and pipelines to/from XYZ and sRGB.
 *
 * IMPORTANT:
 *   - None of these functions perform any clamping.
 *   - Intermediate and output values may lie outside their usual ranges (e.g., Lab or sRGB) if out-of-gamut.
 *   - Clamping (to [0,1] or other valid ranges) should be applied separately when formatting or displaying colors.
 *   - Use the shared `clamp` utility from utils.js or `formatSrgbAsHex` in srgb.js to clamp when needed.
 *
 * XYZ Value Scaling Convention:
 *   - This module assumes XyzColor objects with Y~0–1 scale.
 *   - Internally `xyzToLab`/`labToXyz` handle scaling against the reference white (Y_n=100) correctly.
 *
 * @module color-utils/cielab
 */

// --- Type Imports --------------------------------------------
/** @typedef {import('./types.js').SrgbColor}    SrgbColor */
/** @typedef {import('./types.js').XyzColor}     XyzColor */
/** @typedef {import('./types.js').LabColor}     LabColor */
/** @typedef {import('./types.js').LchColor}     LchColor */

// --- Utility Imports -----------------------------------------
import {
  D65_WHITE_POINT_XYZ,
  degreesToRadians,
  radiansToDegrees,
  normalizeHue,
} from './utils.js';

// --- sRGB Module Imports -------------------------------------
import {
  srgbToXyz as srgbObjectToXyzObject,
  xyzToSrgb as xyzObjectToSrgbObject,
} from './srgb.js';

// --- Constants ------------------------------------------------
const EPSILON = 216 / 24389; // (6/29)^3
const KAPPA   = 24389 / 27;   // (29/3)^3

// --- Internal Transforms -------------------------------------
function _cielabForwardTransform(t) {
  return t > EPSILON
    ? Math.cbrt(t)
    : (KAPPA * t + 16) / 116;
}

function _cielabInverseTransform(ft) {
  const ftCubed = ft * ft * ft;
  return ftCubed > EPSILON
    ? ftCubed
    : (116 * ft - 16) / KAPPA;
}

// --- CIELAB ↔ XYZ ---------------------------------------------
export function xyzToLab(xyzColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  // ... implementation unchanged ...
}

export function labToXyz(labColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  // ... implementation unchanged ...
}

// --- CIELAB ↔ CIELCh -------------------------------------------
export function labToLch(labColor) {
  // ... implementation unchanged ...
}

export function lchToLab(lchColor) {
  // ... implementation unchanged ...
}

// --- Convenience Pipelines -----------------------------------
export function srgbToLab(srgbColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  const xyz = srgbObjectToXyzObject(srgbColor);
  return xyzToLab(xyz, referenceWhite);
}

export function labToSrgb(labColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  const xyz  = labToXyz(labColor, referenceWhite);
  return xyzObjectToSrgbObject(xyz);
}

export function srgbToLch(srgbColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  const lab = srgbToLab(srgbColor, referenceWhite);
  return labToLch(lab);
}

export function lchToSrgb(lchColor, referenceWhite = D65_WHITE_POINT_XYZ) {
  const lab = lchToLab(lchColor);
  return labToSrgb(lab, referenceWhite);
}
