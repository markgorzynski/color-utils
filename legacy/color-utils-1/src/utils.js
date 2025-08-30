/**
 * @module utils
 * @description Core utility functions for generic mathematical and array operations.
 * This module provides common helpers used across the color library.
 */

// --- Constants ---

/**
 * Standard CIE Illuminant D65 reference white point in XYZ, scaled to Y=100.
 * As defined in architecture_v02.md.
 * @type {Readonly<{X: number, Y: number, Z: number}>}
 * @see {@link https://en.wikipedia.org/wiki/Standard_illuminant#Illuminant_series_D}
 */
export const D65_WHITE_POINT_XYZ = Object.freeze({ X: 95.047, Y: 100.0, Z: 108.883 });

// --- Angle Conversions ---

/**
 * Converts an angle from degrees to radians.
 * @param {number} degrees - The angle in degrees.
 * @returns {number} The angle in radians.
 * @throws {TypeError} if degrees is not a number.
 * @example
 * const rad = degreesToRadians(180); // Math.PI
 */
export function degreesToRadians(degrees) {
  if (typeof degrees !== 'number') {
    throw new TypeError('Input degrees must be a number.');
  }
  return degrees * (Math.PI / 180);
}

/**
 * Converts an angle from radians to degrees.
 * @param {number} radians - The angle in radians.
 * @returns {number} The angle in degrees.
 * @throws {TypeError} if radians is not a number.
 * @example
 * const deg = radiansToDegrees(Math.PI); // 180
 */
export function radiansToDegrees(radians) {
  if (typeof radians !== 'number') {
    throw new TypeError('Input radians must be a number.');
  }
  return radians * (180 / Math.PI);
}

// --- Matrix/Vector Operations ---

/**
 * Multiplies a 3x3 matrix by a 3x1 column vector.
 * @param {ReadonlyArray<ReadonlyArray<number>>} matrix - The 3x3 matrix.
 * @param {ReadonlyArray<number>} vector - The 3-element vector.
 * @returns {number[]} The resulting 3-element vector.
 * @throws {TypeError} if inputs are not valid matrix/vector.
 */
export function multiplyMatrixVector(matrix, vector) {
  if (!Array.isArray(matrix) || matrix.length !== 3 ||
      !matrix.every(row => Array.isArray(row) && row.length === 3 && row.every(el => typeof el === 'number'))) {
    throw new TypeError('Matrix must be a 3x3 array of numbers.');
  }
  if (!Array.isArray(vector) || vector.length !== 3 || !vector.every(el => typeof el === 'number')) {
    throw new TypeError('Vector must be a 3-element array of numbers.');
  }

  return [
    matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
    matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
    matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
  ];
}

// --- General Math Helpers ---

/**
 * Applies an exponent to the absolute value of a number, then reapplies the original sign.
 * result = sign(value) * (abs(value) ^ exponent)
 * @param {number} value - The base value.
 * @param {number} exponent - The exponent.
 * @returns {number} The result of the sign-preserving power operation.
 * @throws {TypeError} if value or exponent is not a number.
 * @example
 * const res = signPreservingPow(-2, 3); // -8
 */
export function signPreservingPow(value, exponent) {
  if (typeof value !== 'number' || typeof exponent !== 'number') {
    throw new TypeError('Both value and exponent must be numbers.');
  }
  if (value === 0) return 0;
  return Math.sign(value) * Math.pow(Math.abs(value), exponent);
}

/**
 * Clamps a number to a given range [min, max].
 * @param {number} value - The number to clamp.
 * @param {number} min - The minimum value of the range.
 * @param {number} max - The maximum value of the range.
 * @returns {number} The clamped value.
 * @throws {TypeError} if inputs are not numbers.
 * @throws {RangeError} if min > max.
 * @example
 * const clamped = clamp(15, 0, 10); // 10
 */
export function clamp(value, min, max) {
  if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
    throw new TypeError('All arguments to clamp must be numbers.');
  }
  if (min > max) {
    throw new RangeError('Min value cannot be greater than max value in clamp.');
  }
  return Math.max(min, Math.min(value, max));
}
