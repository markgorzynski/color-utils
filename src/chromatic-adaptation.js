/**
 * @module chromatic-adaptation
 * @description Chromatic adaptation transforms for converting colors between different illuminants.
 * Implements Bradford, CAT02, CAT16, and other chromatic adaptation transforms.
 * 
 * Chromatic adaptation is the human visual system's ability to adjust to changes in illumination
 * in order to preserve the appearance of object colors.
 * 
 * @see {@link http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html}
 */

import { multiplyMatrixVector } from './utils.js';

/** @typedef {{X: number, Y: number, Z: number}} XyzColor */
/** @typedef {{X: number, Y: number, Z: number}} WhitePoint */

// --- Standard Illuminants ---

/**
 * Standard CIE illuminants (normalized to Y=100)
 * @type {Object.<string, WhitePoint>}
 */
export const ILLUMINANTS = Object.freeze({
  // Daylight illuminants
  D50: Object.freeze({ X: 96.422, Y: 100.000, Z: 82.521 }),
  D55: Object.freeze({ X: 95.682, Y: 100.000, Z: 92.149 }),
  D65: Object.freeze({ X: 95.047, Y: 100.000, Z: 108.883 }),
  D75: Object.freeze({ X: 94.972, Y: 100.000, Z: 122.638 }),
  
  // Incandescent/Tungsten illuminants
  A: Object.freeze({ X: 109.850, Y: 100.000, Z: 35.585 }),
  
  // Fluorescent illuminants
  F2: Object.freeze({ X: 99.187, Y: 100.000, Z: 67.395 }),
  F7: Object.freeze({ X: 95.044, Y: 100.000, Z: 108.755 }),
  F11: Object.freeze({ X: 100.966, Y: 100.000, Z: 64.370 }),
  
  // Equal energy illuminant
  E: Object.freeze({ X: 100.000, Y: 100.000, Z: 100.000 }),
  
  // Old standard illuminants
  C: Object.freeze({ X: 98.074, Y: 100.000, Z: 118.232 })
});

// --- Chromatic Adaptation Matrices ---

/**
 * Bradford chromatic adaptation matrix (most common)
 * Transforms XYZ to cone response domain
 * @private
 */
const BRADFORD_MATRIX = Object.freeze([
  Object.freeze([0.8951, 0.2664, -0.1614]),
  Object.freeze([-0.7502, 1.7135, 0.0367]),
  Object.freeze([0.0389, -0.0685, 1.0296])
]);

/**
 * Inverse Bradford matrix
 * @private
 */
const BRADFORD_MATRIX_INV = Object.freeze([
  Object.freeze([0.9869929, -0.1470543, 0.1599627]),
  Object.freeze([0.4323053, 0.5183603, 0.0492912]),
  Object.freeze([-0.0085287, 0.0400428, 0.9684867])
]);

/**
 * CAT02 matrix from CIECAM02
 * @private
 */
const CAT02_MATRIX = Object.freeze([
  Object.freeze([0.7328, 0.4296, -0.1624]),
  Object.freeze([-0.7036, 1.6975, 0.0061]),
  Object.freeze([0.0030, 0.0136, 0.9834])
]);

/**
 * Inverse CAT02 matrix
 * @private
 */
const CAT02_MATRIX_INV = Object.freeze([
  Object.freeze([1.096124, -0.278869, 0.182745]),
  Object.freeze([0.454369, 0.473533, 0.072098]),
  Object.freeze([-0.009628, -0.005698, 1.015326])
]);

/**
 * CAT16 matrix from CIECAM16 (updated version)
 * @private
 */
const CAT16_MATRIX = Object.freeze([
  Object.freeze([0.401288, 0.650173, -0.051461]),
  Object.freeze([-0.250268, 1.204414, 0.045854]),
  Object.freeze([-0.002079, 0.048952, 0.953127])
]);

/**
 * Inverse CAT16 matrix
 * @private
 */
const CAT16_MATRIX_INV = Object.freeze([
  Object.freeze([1.86206786, -1.01125463, 0.14918677]),
  Object.freeze([0.38752654, 0.62144744, -0.00897398]),
  Object.freeze([-0.01557209, -0.03414112, 1.04971321])
]);

/**
 * Von Kries matrix (diagonal/simple adaptation)
 * @private
 */
const VON_KRIES_MATRIX = Object.freeze([
  Object.freeze([0.4002, 0.7076, -0.0808]),
  Object.freeze([-0.2263, 1.1653, 0.0457]),
  Object.freeze([0.0000, 0.0000, 0.9182])
]);

/**
 * Inverse Von Kries matrix
 * @private
 */
const VON_KRIES_MATRIX_INV = Object.freeze([
  Object.freeze([1.8599364, -1.1293816, 0.2198974]),
  Object.freeze([0.3611914, 0.6388125, -0.0000064]),
  Object.freeze([0.0000000, 0.0000000, 1.0890636])
]);

// --- Chromatic Adaptation Implementation ---

/**
 * Supported chromatic adaptation methods
 * @type {Object}
 */
const ADAPTATION_MATRICES = {
  bradford: { matrix: BRADFORD_MATRIX, inverse: BRADFORD_MATRIX_INV },
  cat02: { matrix: CAT02_MATRIX, inverse: CAT02_MATRIX_INV },
  cat16: { matrix: CAT16_MATRIX, inverse: CAT16_MATRIX_INV },
  vonKries: { matrix: VON_KRIES_MATRIX, inverse: VON_KRIES_MATRIX_INV }
};

/**
 * Apply chromatic adaptation transform to convert XYZ color from one illuminant to another
 * @param {XyzColor} xyzColor - Input XYZ color under source illuminant
 * @param {WhitePoint|string} sourceWhite - Source illuminant (white point or name)
 * @param {WhitePoint|string} destWhite - Destination illuminant (white point or name)
 * @param {string} [method='bradford'] - Adaptation method ('bradford', 'cat02', 'cat16', 'vonKries')
 * @returns {XyzColor} XYZ color adapted to destination illuminant
 * @example
 * // Convert XYZ from D65 to D50
 * const xyzD50 = chromaticAdaptation(xyzD65, 'D65', 'D50');
 */
export function chromaticAdaptation(xyzColor, sourceWhite, destWhite, method = 'bradford') {
  // Resolve white points
  const srcWhite = typeof sourceWhite === 'string' ? ILLUMINANTS[sourceWhite] : sourceWhite;
  const dstWhite = typeof destWhite === 'string' ? ILLUMINANTS[destWhite] : destWhite;
  
  if (!srcWhite || !dstWhite) {
    throw new Error('Invalid illuminant specified');
  }
  
  // If same white point, no adaptation needed
  if (srcWhite.X === dstWhite.X && srcWhite.Y === dstWhite.Y && srcWhite.Z === dstWhite.Z) {
    return xyzColor;
  }
  
  // Get adaptation matrices
  const adaptation = ADAPTATION_MATRICES[method];
  if (!adaptation) {
    throw new Error(`Unknown adaptation method: ${method}`);
  }
  
  const { matrix: M, inverse: M_inv } = adaptation;
  
  // Step 1: Convert source white point to cone response
  const srcCone = multiplyMatrixVector(M, [srcWhite.X, srcWhite.Y, srcWhite.Z]);
  
  // Step 2: Convert destination white point to cone response
  const dstCone = multiplyMatrixVector(M, [dstWhite.X, dstWhite.Y, dstWhite.Z]);
  
  // Step 3: Calculate adaptation transform (diagonal matrix as vector)
  const adaptation_transform = [
    dstCone[0] / srcCone[0],
    dstCone[1] / srcCone[1],
    dstCone[2] / srcCone[2]
  ];
  
  // Step 4: Convert input XYZ to cone response
  const inputCone = multiplyMatrixVector(M, [xyzColor.X, xyzColor.Y, xyzColor.Z]);
  
  // Step 5: Apply adaptation
  const adaptedCone = [
    inputCone[0] * adaptation_transform[0],
    inputCone[1] * adaptation_transform[1],
    inputCone[2] * adaptation_transform[2]
  ];
  
  // Step 6: Convert back to XYZ
  const [X, Y, Z] = multiplyMatrixVector(M_inv, adaptedCone);
  
  return { X, Y, Z };
}

/**
 * Convert XYZ color from D65 to D50 illuminant
 * Common conversion for ICC profiles and print work
 * @param {XyzColor} xyzD65 - XYZ color under D65
 * @param {string} [method='bradford'] - Adaptation method
 * @returns {XyzColor} XYZ color under D50
 */
export function xyzD65ToD50(xyzD65, method = 'bradford') {
  return chromaticAdaptation(xyzD65, ILLUMINANTS.D65, ILLUMINANTS.D50, method);
}

/**
 * Convert XYZ color from D50 to D65 illuminant
 * Common conversion for display work
 * @param {XyzColor} xyzD50 - XYZ color under D50
 * @param {string} [method='bradford'] - Adaptation method
 * @returns {XyzColor} XYZ color under D65
 */
export function xyzD50ToD65(xyzD50, method = 'bradford') {
  return chromaticAdaptation(xyzD50, ILLUMINANTS.D50, ILLUMINANTS.D65, method);
}

// --- Utility Functions ---

/**
 * Calculate the correlated color temperature (CCT) of a white point
 * Uses McCamy's approximation
 * @param {WhitePoint} whitePoint - White point in XYZ
 * @returns {number} CCT in Kelvin
 */
export function calculateCCT(whitePoint) {
  // Convert to chromaticity coordinates
  const sum = whitePoint.X + whitePoint.Y + whitePoint.Z;
  const x = whitePoint.X / sum;
  const y = whitePoint.Y / sum;
  
  // McCamy's formula
  const n = (x - 0.3320) / (0.1858 - y);
  const cct = 437 * n * n * n + 3601 * n * n + 6831 * n + 5517;
  
  return cct;
}

/**
 * Get a white point for a given color temperature
 * Approximation using Planckian locus
 * @param {number} temperature - Color temperature in Kelvin
 * @returns {WhitePoint} Approximate white point
 */
export function getWhitePointFromTemperature(temperature) {
  const T = temperature;
  let x, y;
  
  // Calculate chromaticity coordinates
  if (T >= 4000 && T <= 7000) {
    x = -4.6070e9 / (T * T * T) + 2.9678e6 / (T * T) + 0.09911e3 / T + 0.244063;
  } else if (T > 7000 && T <= 25000) {
    x = -2.0064e9 / (T * T * T) + 1.9018e6 / (T * T) + 0.24748e3 / T + 0.237040;
  } else {
    throw new Error('Temperature out of range (4000K - 25000K)');
  }
  
  // Calculate y from x
  y = -3.000 * x * x + 2.870 * x - 0.275;
  
  // Convert to XYZ (normalized to Y=100)
  const Y = 100;
  const X = (x * Y) / y;
  const Z = ((1 - x - y) * Y) / y;
  
  return { X, Y, Z };
}

/**
 * Determine the closest standard illuminant to a white point
 * @param {WhitePoint} whitePoint - White point to match
 * @returns {string} Name of closest standard illuminant
 */
export function findClosestIlluminant(whitePoint) {
  let minDistance = Infinity;
  let closestName = 'D65';
  
  for (const [name, illuminant] of Object.entries(ILLUMINANTS)) {
    const distance = Math.sqrt(
      Math.pow(whitePoint.X - illuminant.X, 2) +
      Math.pow(whitePoint.Y - illuminant.Y, 2) +
      Math.pow(whitePoint.Z - illuminant.Z, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestName = name;
    }
  }
  
  return closestName;
}

/**
 * Check if chromatic adaptation is needed between two white points
 * @param {WhitePoint|string} white1 - First white point
 * @param {WhitePoint|string} white2 - Second white point
 * @param {number} [threshold=0.001] - Difference threshold
 * @returns {boolean} True if adaptation is needed
 */
export function needsChromaticAdaptation(white1, white2, threshold = 0.001) {
  const w1 = typeof white1 === 'string' ? ILLUMINANTS[white1] : white1;
  const w2 = typeof white2 === 'string' ? ILLUMINANTS[white2] : white2;
  
  if (!w1 || !w2) return false;
  
  const distance = Math.sqrt(
    Math.pow(w1.X - w2.X, 2) +
    Math.pow(w1.Y - w2.Y, 2) +
    Math.pow(w1.Z - w2.Z, 2)
  );
  
  return distance > threshold;
}