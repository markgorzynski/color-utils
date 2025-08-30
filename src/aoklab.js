/**
 * @file src/aoklab.js
 * @module color-utils/aoklab
 * @description Provides an `AdaptiveOklab` class for color space conversions.
 * This model modifies the standard Oklab color space to account for perceptual
 * adaptation to different viewing surround conditions (white, gray, dark).
 *
 * **Novel Approach of Adaptive Oklab (AOkLab):**
 *
 * 1.  **Foundation in Oklab:** AOkLab builds upon the standard Oklab transformation pipeline,
 * which typically involves:
 * Linear sRGB -> LMS_Oklab (via Oklab M1 matrix) -> LMS'_Oklab (via cube-root non-linearity, exponent 1/3) -> Oklab L,a,b (via Oklab M2 matrix).
 *
 * 2.  **Adaptive Non-linearity:** Instead of the fixed 1/3 exponent, AOkLab introduces a
 * **surround-dependent adaptive exponent `p`**. This `p` is applied to the
 * LMS_Oklab values: `LMS'_adaptive = LMS_Oklab ^ p`.
 *
 * 3.  **Goal-Derived Exponents `p`:** The exponents `p` for 'white', 'gray', and 'dark'
 * surrounds are specifically derived to achieve a consistent target *adapted lightness*
 * (L_AOk = 40). This means colors that would have certain *standard Oklab lightnesses*
 * (L_std = 55.9 for white, 48.3 for gray, 41.7 for dark) are all mapped to L_AOk = 40
 * when processed with the corresponding surround's adaptive exponent `p`.
 * The derivation formula is: `p = ln(0.40) / (3 * ln(L_std_for_surround / 100))`.
 *
 * 4.  **Hue Uniformity Correction:** Since the Oklab M2 matrix (LMS' -> Lab) was optimized
 * for the 1/3 exponent, changing this exponent to `p` would alter hue appearance.
 * To preserve hue uniformity relative to standard Oklab, a correction factor is
 * applied to the resulting `a` and `b` opponent channels:
 * `correction = x0 ^ ((1/3) - p)`, where `x0` is a representative LMS value (default 0.5).
 * The final AOkLab `a` and `b` are `a_raw * correction` and `b_raw * correction`.
 * The AOkLab `L` component is taken directly from the M2 matrix transformation.
 *
 * 5.  **Pipeline Summary:**
 * - Input (sRGB or XYZ) -> Linear sRGB
 * - Linear sRGB -> LMS_Oklab (using standard Oklab M1 matrix)
 * - LMS_Oklab -> LMS'_adaptive (using exponent `p`)
 * - LMS'_adaptive -> Preliminary L', a', b' (using standard Oklab M2 matrix)
 * - L = L', a = a' * correction, b = b' * correction -> Final AOkLab {L, a, b}
 *
 * The reverse transformations undo these adaptive steps before applying standard Oklab inverse matrices.
 *
 * @see {@link https://bottosson.github.io/posts/oklab/} for the base Oklab model.
 * The adaptive mechanism and exponent derivation are based on custom design notes.
 */

// --- Type Imports for JSDoc ---

// --- Utility Imports ---
import {
  signPreservingPow,
  multiplyMatrixVector,
} from './utils.js';

// --- sRGB Module Imports ---
import {
  srgbToLinearSrgb,
  linearSrgbToSrgb,
  xyzToLinearSrgb, // To convert XYZ to Linear sRGB as the starting point
  linearSrgbToXyz,  // For the .toXyz() method
  parseSrgbHex,
  formatSrgbAsHex,
} from './srgb.js';

// --- Standard Oklab Transformation Matrices (as defined in oklab.js or by Ottosson) ---
// These are the matrices from the standard Oklab model.

/**
 * Standard Oklab M1 Matrix: Converts Linear sRGB to Oklab's specific LMS-like space.
 * @private
 */
const MATRIX_LINEAR_SRGB_TO_LMS_OKLAB = Object.freeze([
  Object.freeze([0.4122214708, 0.5363325363, 0.0514459929]),
  Object.freeze([0.2119034982, 0.6806995451, 0.1073969566]),
  Object.freeze([0.0883024619, 0.2817188376, 0.6299787005]),
]);

/**
 * Standard Oklab M2 Matrix: Converts non-linearly compressed LMS' (exponent 1/3) to Oklab (L, a, b).
 * This matrix is also used by AOkLab with its adaptively exponentiated LMS'_adaptive.
 * @private
 */
const MATRIX_LMS_PRIME_TO_OKLAB = Object.freeze([ // Renamed for clarity from MATRIX_LMS_PRIME_TO_AOKLAB
  Object.freeze([0.2104542553, 0.7936177850, -0.0040720468]), // L component
  Object.freeze([1.9779984951, -2.4285922050, 0.4505937099]), // a component
  Object.freeze([0.0259040371, 0.7827717662, -0.8086757660]), // b component
]);

/**
 * Inverse of Standard Oklab M2 Matrix: Converts Oklab (L, a, b) to non-linear LMS'.
 * Used in the reverse AOkLab transformation.
 * @private
 */
const MATRIX_OKLAB_TO_LMS_PRIME = Object.freeze([ // Renamed for clarity from MATRIX_AOKLAB_TO_LMS_PRIME
  Object.freeze([1.0, 0.3963377774, 0.2158037573]),
  Object.freeze([1.0, -0.1055613458, -0.0638541728]),
  Object.freeze([1.0, -0.0894841775, -1.2914855480]),
]);

/**
 * Inverse of Standard Oklab M1 Matrix: Converts Oklab's LMS space to Linear sRGB.
 * Used in the reverse AOkLab transformation.
 * @private
 */
const MATRIX_LMS_OKLAB_TO_LINEAR_SRGB = Object.freeze([ // Renamed from MATRIX_LMS_AOKLAB_TO_LINEAR_SRGB
  Object.freeze([4.0767416621, -3.3077115913, 0.2309699292]),
  Object.freeze([-1.2684380046, 2.6097574011, -0.3413193965]),
  Object.freeze([-0.0041960863, -0.7034186147, 1.7076147010]),
]);

/**
 * Pre-calculated adaptive exponents 'p' for different surround conditions.
 * Derived from `p = ln(0.40) / (3 * ln(L_std_for_surround / 100))`
 * where L_std values (55.9 white, 48.3 gray, 41.7 dark) map to L_AOk = 40.
 * @private
 * @type {Readonly<Record<AdaptiveOklabSurround, number>>}
 */
const SURROUND_EXPONENTS = Object.freeze({
  white: 0.526,
  gray:  0.420,
  dark:  0.349,
});

/**
 * The standard non-linearity exponent used in Oklab (1/3).
 * Used in calculating the hue correction factor.
 * @private
 * @type {number}
 */
const STANDARD_OKLAB_EXPONENT = 1 / 3;

/**
 * @class AdaptiveOklab
 * @classdesc A class to perform color conversions to and from an adaptive version of Oklab.
 * This model adjusts lightness and chroma based on specified viewing surround conditions,
 * building upon the standard Oklab color space.
 */
export class AdaptiveOklab {
  /**
   * The configured viewing surround.
   * @type {AdaptiveOklabSurround}
   * @readonly
   */
  surround;

  /**
   * The adaptive exponent 'p' for the current surround.
   * @type {number}
   * @private
   * @readonly
   */
  _exponent;

  /**
   * A representative LMS value (default 0.5) for hue correction factor calculation.
   * @type {number}
   * @private
   * @readonly
   */
  _x0;

  /**
   * Correction factor `x0^((1/3) - p)` applied to 'a' and 'b' channels to maintain hue.
   * @type {number}
   * @private
   * @readonly
   */
  _correctionFactor;

  /**
   * Creates an instance of the AdaptiveOklab converter.
   * @param {AdaptiveOklabOptions} [options={}] - Configuration options.
   * @example
   * const aokWhite = new AdaptiveOklab({ surround: 'white' });
   * const aokGray = new AdaptiveOklab(); // Defaults to 'gray' surround
   * const aokDarkHighX0 = new AdaptiveOklab({ surround: 'dark', x0: 0.6 });
   */
  constructor(options = {}) {
    this.surround = options.surround || 'gray';

    if (!SURROUND_EXPONENTS[this.surround]) {
      console.warn(`AdaptiveOklab: Unknown surround "${this.surround}". Defaulting to "gray".`);
      this.surround = 'gray';
    }

    this._exponent = SURROUND_EXPONENTS[this.surround];
    this._x0 = (typeof options.x0 === 'number' && !Number.isNaN(options.x0)) ? options.x0 : 0.5;
    // Handle x0 = 0 edge case to avoid infinity
    if (this._x0 === 0) {
      this._correctionFactor = 0; // Will make a and b channels 0
    } else {
      this._correctionFactor = Math.pow(this._x0, STANDARD_OKLAB_EXPONENT - this._exponent);
    }
  }
  
  /**
   * Get internal adaptation parameters (for testing/debugging)
   * @returns {Object} Object containing FL (luminance factor) and other params
   */
  get params() {
    return {
      FL: this._exponent, // Luminance adaptation factor (surround exponent)
      x0: this._x0,       // Reference LMS value
      correctionFactor: this._correctionFactor,
      surround: this.surround
    };
  }

  /**
   * Core conversion from Linear sRGB to Adaptive Oklab components.
   * This is the central part of the forward AOkLab transformation.
   * @private
   * @param {LinearSrgbColor} linearSrgbColor - Linear sRGB color {r, g, b}.
   * @returns {OklabColor} The Adaptive Oklab color object {L, a, b}.
   */
  _fromLinearSrgbToAOkLab(linearSrgbColor) {
    // Ensure components are non-negative for physical light before matrix multiply.
    const r = Math.max(0, linearSrgbColor.r);
    const g = Math.max(0, linearSrgbColor.g);
    const b = Math.max(0, linearSrgbColor.b);

    // Step 1: Linear sRGB to Oklab's specific LMS-like space (using Oklab M1)
    const lmsOklab = multiplyMatrixVector(MATRIX_LINEAR_SRGB_TO_LMS_OKLAB, [r, g, b]);

    // Step 2: Apply adaptive non-linearity (exponent 'p')
    const lmsPrimeAdaptive = [
      signPreservingPow(lmsOklab[0], this._exponent),
      signPreservingPow(lmsOklab[1], this._exponent),
      signPreservingPow(lmsOklab[2], this._exponent),
    ];

    // Step 3: Convert adaptively non-linear LMS' to preliminary Oklab-like (L', a', b') (using Oklab M2)
    const labArrayPrime = multiplyMatrixVector(MATRIX_LMS_PRIME_TO_OKLAB, lmsPrimeAdaptive);

    // Step 4: Apply hue correction factor to a' and b'
    return {
      L: labArrayPrime[0], // L component from M2
      a: labArrayPrime[1] * this._correctionFactor, // Corrected a component
      b: labArrayPrime[2] * this._correctionFactor, // Corrected b component
    };
  }

  /**
   * Converts a CIE XYZ (D65) color object to an Adaptive Oklab color object.
   * Input `XyzColor` should have Y scaled relative to Y_n=1.0.
   * @param {XyzColor} xyzColor - The CIE XYZ color object {X, Y, Z}.
   * @returns {OklabColor} The Adaptive Oklab color object {L, a, b}.
   * @throws {TypeError} if `xyzColor` is not a valid XyzColor object.
   */
  fromXyz(xyzColor) {
    // Type validation for xyzColor
    if (
      typeof xyzColor !== 'object' || xyzColor === null ||
      typeof xyzColor.X !== 'number' || Number.isNaN(xyzColor.X) ||
      typeof xyzColor.Y !== 'number' || Number.isNaN(xyzColor.Y) ||
      typeof xyzColor.Z !== 'number' || Number.isNaN(xyzColor.Z)
    ) {
      throw new TypeError('Input xyzColor must be an object with X, Y, Z valid number properties.');
    }
    const linearSrgbColor = xyzToLinearSrgb(xyzColor); // Convert XYZ (Y~0-1) to Linear sRGB
    return this._fromLinearSrgbToAOkLab(linearSrgbColor);
  }

  /**
   * Converts an sRGB color object to an Adaptive Oklab color object
   * for the configured surround of this converter instance.
   * @param {SrgbColor} srgbColor - The sRGB color object {r, g, b} with components in [0, 1].
   * @returns {OklabColor} The Adaptive Oklab color object {L, a, b}.
   * @throws {TypeError} if `srgbColor` is not a valid SrgbColor object.
   * @example
   * const aokConverter = new AdaptiveOklab({ surround: 'dark' });
   * const adaptiveColor = aokConverter.fromSrgb({ r: 0.8, g: 0.2, b: 0.3 });
   * console.log(adaptiveColor); // { L: ..., a: ..., b: ... }
   */
  fromSrgb(srgbColor) {
    // Type validation for srgbColor
    if (
      typeof srgbColor !== 'object' || srgbColor === null ||
      typeof srgbColor.r !== 'number' || Number.isNaN(srgbColor.r) ||
      typeof srgbColor.g !== 'number' || Number.isNaN(srgbColor.g) ||
      typeof srgbColor.b !== 'number' || Number.isNaN(srgbColor.b)
    ) {
      throw new TypeError('Input srgbColor must be an object with r, g, b valid number properties.');
    }
    const linearSrgbColor = srgbToLinearSrgb(srgbColor);
    return this._fromLinearSrgbToAOkLab(linearSrgbColor);
  }

  /**
   * Static helper method to convert an sRGB hex string directly to an Adaptive Oklab color object.
   * Creates a temporary AdaptiveOklab converter instance with the specified options.
   * @param {string} hexString - The sRGB hex color string (e.g., "#FF0000", "aabbcc").
   * @param {AdaptiveOklabOptions} [options={}] - Configuration options for the AdaptiveOklab conversion.
   * @returns {OklabColor} The Adaptive Oklab color object {L, a, b}.
   * @throws {TypeError|SyntaxError} if `hexString` is invalid.
   */
  static fromHex(hexString, options = {}) {
    const srgbColor = parseSrgbHex(hexString); // from srgb.js
    const converter = new AdaptiveOklab(options);
    return converter.fromSrgb(srgbColor); // which will call _fromLinearSrgbToAOkLab
  }

  /**
   * Converts an Adaptive Oklab color object back to a Linear sRGB color object.
   * This method reverses the adaptive transformation applied by this instance.
   * @param {OklabColor} adaptiveOklabColor - The Adaptive Oklab color {L, a, b} to convert.
   * @returns {LinearSrgbColor} The corresponding Linear sRGB color object {r, g, b}.
   * Components may be outside [0, 1] if the color is out of sRGB gamut.
   * @throws {TypeError} if `adaptiveOklabColor` is not a valid OklabColor object.
   */
  toLinearSrgb(adaptiveOklabColor) {
    if (
      typeof adaptiveOklabColor !== 'object' || adaptiveOklabColor === null ||
      typeof adaptiveOklabColor.L !== 'number' || Number.isNaN(adaptiveOklabColor.L) ||
      typeof adaptiveOklabColor.a !== 'number' || Number.isNaN(adaptiveOklabColor.a) ||
      typeof adaptiveOklabColor.b !== 'number' || Number.isNaN(adaptiveOklabColor.b)
    ) {
      throw new TypeError('Input adaptiveOklabColor must be an object with L, a, b valid number properties.');
    }

    const { L } = adaptiveOklabColor;
    // Step 1: Undo the hue correction factor
    // Handle potential division by zero if _correctionFactor is somehow zero
    let aUncorrected, bUncorrected;
    if (this._correctionFactor === 0 || Number.isNaN(this._correctionFactor)) {
      // If correction factor is 0, assume a and b were zeroed out in forward transform
      aUncorrected = 0;
      bUncorrected = 0;
    } else {
      const correctionFactorInv = 1 / this._correctionFactor;
      aUncorrected = adaptiveOklabColor.a * correctionFactorInv;
      bUncorrected = adaptiveOklabColor.b * correctionFactorInv;
    }

    // Step 2: Convert "uncorrected" Oklab-like (L, a', b') to non-linear LMS'_adaptive (using Oklab M2_inverse)
    const lmsPrimeAdaptive = multiplyMatrixVector(MATRIX_OKLAB_TO_LMS_PRIME, [L, aUncorrected, bUncorrected]);

    // Step 3: Undo adaptive non-linearity (apply inverse exponent 1/p)
    // Handle potential division by zero if _exponent is somehow zero
    const inverseExponent = (this._exponent === 0 || Number.isNaN(this._exponent)) ?
                            Infinity : 1 / this._exponent;
    const lmsOklab = [
      signPreservingPow(lmsPrimeAdaptive[0], inverseExponent),
      signPreservingPow(lmsPrimeAdaptive[1], inverseExponent),
      signPreservingPow(lmsPrimeAdaptive[2], inverseExponent),
    ];

    // Step 4: Convert Oklab's LMS space to Linear sRGB (using Oklab M1_inverse)
    const linearRgbArray = multiplyMatrixVector(MATRIX_LMS_OKLAB_TO_LINEAR_SRGB, lmsOklab);
    return { r: linearRgbArray[0], g: linearRgbArray[1], b: linearRgbArray[2] };
  }

  /**
   * Converts an Adaptive Oklab color object to an sRGB (gamma-corrected) color object
   * using the settings of this converter instance.
   * @param {OklabColor} adaptiveOklabColor - The Adaptive Oklab color {L, a, b}.
   * @returns {SrgbColor} The sRGB color object {r, g, b}. (Values may be outside [0,1]).
   * @throws {TypeError} if `adaptiveOklabColor` is not a valid OklabColor object.
   * @example
   * const aokConverter = new AdaptiveOklab({ surround: 'white' });
   * const aokColor = aokConverter.fromSrgb({r:0.5, g:0.5, b:0.5});
   * const srgbOutput = aokConverter.toSrgb(aokColor); // srgbOutput reflects adaptation
   */
  toSrgb(adaptiveOklabColor) {
    // Type validation for adaptiveOklabColor is handled by this.toLinearSrgb
    const linearSrgb = this.toLinearSrgb(adaptiveOklabColor);
    return linearSrgbToSrgb(linearSrgb); // from srgb.js
  }

   /**
   * Converts an Adaptive Oklab color object to a CIE XYZ (D65) color object
   * using the settings of this converter instance. Output XYZ has Y scaled relative to Y_n=1.0.
   * @param {OklabColor} adaptiveOklabColor - The Adaptive Oklab color {L, a, b}.
   * @returns {XyzColor} The CIE XYZ color object {X, Y, Z}.
   * @throws {TypeError} if `adaptiveOklabColor` is not a valid OklabColor object.
   * @example
   * const aokConverter = new AdaptiveOklab(); // Gray surround
   * const aokColor = { L: 0.7, a: 0.05, b: -0.02 }; // Example AOkLab color
   * const xyzOutput = aokConverter.toXyz(aokColor);
   */
  toXyz(adaptiveOklabColor) {
    // Type validation for adaptiveOklabColor is handled by this.toLinearSrgb
    const linearSrgb = this.toLinearSrgb(adaptiveOklabColor);
    // linearSrgbToXyz (from srgb.js) expects LinearSrgbColor and returns XyzColor (Y ~0-1)
    return linearSrgbToXyz(linearSrgb);
  }

  /**
   * Converts an Adaptive Oklab color object to an sRGB hex string
   * using the settings of this converter instance.
   * @param {OklabColor} adaptiveOklabColor - The Adaptive Oklab color {L, a, b}.
   * @returns {string} The sRGB hex string (e.g., "#RRGGBB").
   * @throws {TypeError} if `adaptiveOklabColor` is not a valid OklabColor object.
   * @example
   * const aokConverter = new AdaptiveOklab({ surround: 'dark' });
   * const aokColor = aokConverter.fromHex("#336699");
   * const hexOutput = aokConverter.toHex(aokColor);
   */
  toHex(adaptiveOklabColor) {
    // Type validation for adaptiveOklabColor is handled by this.toSrgb
    const srgbColor = this.toSrgb(adaptiveOklabColor);
    return formatSrgbAsHex(srgbColor); // from srgb.js
  }
}