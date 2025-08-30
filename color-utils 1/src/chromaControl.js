/**
 * @module chromaControl
 * @description Provides functions to find the maximum achievable OkLCh chroma for a given
 * CIELAB L* and hue, and to adjust an OkLCh color's chroma and lightness to match
 * a target CIELAB L* while staying within the sRGB gamut.
 * This module incorporates logic for a "modified Lab" transformation where lightness (L*)
 * can be influenced by a gamma parameter, typically for surround correction simulation.
 */

import { D65_WHITE_POINT_XYZ } from './utils.js';
import { oklchToSrgb } from './oklab.js';
import { getSrgbRelativeLuminance } from './color-metrics.js';

// Assuming OklchColor, SrgbColor, XyzColor, ChromaControlOptions, AdjustedOklchResult, and AdjustChromaOptions are defined in types.js


// --- Internal Helper: Modified CIELAB L* to Relative Luminance ---
// This section adapts logic originally from cielab-modified.v3.js (fCustomInv)
// to convert a CIELAB L* (potentially adjusted by a gamma for surround simulation)
// into a target relative luminance (Y component of XYZ, scaled 0-1).

/**
 * Inverse of the custom piecewise non-linearity for L* (inspired by fCustomInv from cielab-modified.v3.js).
 * Used to convert a modified L* component back to a Y/Yn ratio.
 * The 'gamma' parameter here dictates the shape of this inverse non-linear function.
 * @private
 * @param {number} fVal - Value derived from (L* + 16) / 116. This is the input to the inverse function.
 * @param {number} gamma - Gamma value used in the original custom transformation.
 * @returns {number} Original Y/Yn ratio.
 * @throws {Error} if gamma is not positive.
 */
function _modifiedLabFInverse(fVal, gamma) {
  if (gamma <= 0) {
    throw new Error('Gamma must be positive for modified Lab conversion.');
  }
  const B = 16 / 116; // Standard CIELAB constant: 4/29

  // Calculate the pivot point in the transformed space (fVal-space)
  // and the corresponding point in the original t-space (Y/Yn-space).
  // The pivot is where the linear segment meets the power-law segment.
  // If gamma is 1, it's effectively linear (or a special case).
  const pivotTransformedValue = (gamma === 1) ? Infinity : (B * (gamma / (gamma - 1)));
  const pivotOriginalT = (gamma === 1) ? 0 : Math.pow(pivotTransformedValue, gamma);

  // Calculate the slope 'A' of the linear segment.
  // A = (1/gamma) * p^( (1/gamma) - 1 ) where p is pivotOriginalT
  const slopeA = (gamma === 1) ? 1 : ((1 / gamma) * Math.pow(pivotOriginalT, (1 / gamma) - 1));

  fVal = Math.max(0, fVal); // Ensure fVal is not negative before processing.

  if (fVal > pivotTransformedValue) {
    // If fVal is beyond the pivot, apply the inverse power law.
    return Math.pow(fVal, gamma);
  } else {
    // If fVal is on the linear segment.
    if (slopeA === 0 || Math.abs(slopeA) < 1e-9) { // Avoid division by zero or near-zero if slope is effectively zero
        return 0; // Or handle as an edge case, implies B was also 0 or fVal is B
    }
    return (fVal - B) / slopeA;
  }
}

/**
 * Converts a target CIELAB L* (potentially modified by a gamma factor) to a target relative luminance.
 * @private
 * @param {number} targetLabLightness - The target CIELAB L* value (0-100).
 * @param {number} gamma - The gamma value for the modified L* interpretation.
 * @param {XyzColor} whitePoint - The reference white point (e.g., D65, where Y is typically 100).
 * @returns {number} The target relative luminance (scaled 0-1).
 * @throws {Error} if whitePoint.Y is zero.
 */
function _labLightnessToRelativeLuminance(targetLabLightness, gamma, whitePoint) {
  if (whitePoint.Y === 0) {
    throw new Error("White point Y component cannot be zero for luminance calculation.");
  }
  // The L* component is transformed using the inverse modified function.
  // (targetLabLightness + 16) / 116 converts L* back to the f(Y/Yn) form.
  const yRatio = _modifiedLabFInverse((targetLabLightness + 16) / 116, gamma);

  // yRatio is Y/Yn. Since Yn (from whitePoint.Y) is on a 0-100 scale,
  // and we want relative luminance (0-1), this yRatio is directly the value.
  return Math.max(0, Math.min(1, yRatio)); // Clamp to ensure valid luminance range [0,1]
}


// --- Internal Helper: Get sRGB Gamut and Luminance from Oklch ---

/**
 * Converts an Oklch color to sRGB, checks if it's within the sRGB gamut,
 * and calculates its relative luminance.
 * @private
 * @param {number} oklchL - Oklch Lightness.
 * @param {number} oklchC - Oklch Chroma.
 * @param {number} oklchH - Oklch Hue (degrees).
 * @returns {{srgbColor: SrgbColor, luminance: number, outOfGamut: boolean}}
 * Contains the converted sRGB color, its luminance, and a flag indicating if it's out of gamut.
 */
function _getSrgbGamutAndLuminanceFromOklch(oklchL, oklchC, oklchH) {
  const srgbColor = oklchToSrgb({ L: oklchL, C: oklchC, h: oklchH }); // from oklab.js

  const r = srgbColor.r;
  const g = srgbColor.g;
  const b = srgbColor.b;

  // Check sRGB gamut (0-1 for each channel), allowing for small floating point inaccuracies.
  const epsilon = 1e-7; // A small tolerance for floating point comparisons
  const outOfGamut = r < -epsilon || r > 1 + epsilon ||
                     g < -epsilon || g > 1 + epsilon ||
                     b < -epsilon || b > 1 + epsilon;

  // For luminance calculation, use sRGB values clamped to the [0, 1] gamut,
  // as this represents the color that would actually be displayed.
  const r_clamped = Math.min(Math.max(r, 0), 1);
  const g_clamped = Math.min(Math.max(g, 0), 1);
  const b_clamped = Math.min(Math.max(b, 0), 1);

  const luminance = getSrgbRelativeLuminance({ r: r_clamped, g: g_clamped, b: b_clamped }); // from color-metrics.js

  return { srgbColor, luminance, outOfGamut };
}


// --- Internal Helper: Core Lightness Matching Logic ---

/**
 * Iteratively adjusts Oklch.L to match a target sRGB relative luminance,
 * keeping Oklch.C and Oklch.H constant. Uses a binary search algorithm.
 * @private
 * @param {number} oklchChroma - The fixed Oklch Chroma.
 * @param {number} oklchHue - The fixed Oklch Hue (degrees).
 * @param {number} targetRelativeLuminance - The target sRGB relative luminance (0-1).
 * @param {AdjustChromaOptions} options - Fully populated control options for the search.
 * @returns {AdjustedOklchResult} Result of the matching process.
 */
function _matchOklchLightnessToTargetLuminance(oklchChroma, oklchHue, targetRelativeLuminance, options) {
  let lowL = 0.0;
  let highL = 1.0;
  // Initial guess for Oklch.L: often, Oklch L tracks perceptual lightness, which is related to luminance.
  // Using targetRelativeLuminance directly can be a reasonable starting point.
  let midL = Math.max(0, Math.min(1, targetRelativeLuminance));
  let bestMatchL = midL;
  let bestDiff = Infinity;
  let iterations = 0;
  let lastResult = _getSrgbGamutAndLuminanceFromOklch(midL, oklchChroma, oklchHue); // Initial check

  for (iterations = 0; iterations < options.maxIterations; iterations++) {
    midL = (lowL + highL) / 2;
    // If the search range for L becomes too small, break to prevent infinite loops.
    if (Math.abs(highL - lowL) < 1e-7) break;

    const currentResult = _getSrgbGamutAndLuminanceFromOklch(midL, oklchChroma, oklchHue);
    lastResult = currentResult;
    const currentLuminance = currentResult.luminance;
    const diff = currentLuminance - targetRelativeLuminance;

    // If the current Oklch.L produces an in-gamut sRGB color,
    // and its luminance is closer to the target, update our best guess.
    if (!currentResult.outOfGamut) {
      if (Math.abs(diff) < bestDiff) {
        bestDiff = Math.abs(diff);
        bestMatchL = midL;
      }
    }

    // Check for convergence: if luminance difference is within tolerance AND in gamut.
    if (Math.abs(diff) < options.tolerance && !currentResult.outOfGamut) {
      break;
    }

    // Adjust search range based on gamut status and luminance difference.
    if (currentResult.outOfGamut) {
      const { r, g, b } = currentResult.srgbColor;
      // Heuristic: if any sRGB channel > 1, the color is likely "too bright" for this Oklch.L,
      // so we need to try a lower Oklch.L.
      // If any sRGB channel < 0, it's "too dark", try a higher Oklch.L.
      const epsilon = 1e-5; // Small tolerance for gamut check
      const tooBright = r > 1 + epsilon || g > 1 + epsilon || b > 1 + epsilon;
      const tooDark   = r < -epsilon || g < -epsilon || b < -epsilon;

      if (tooBright && !tooDark) { // Primarily too bright
        highL = midL;
      } else if (tooDark && !tooBright) { // Primarily too dark
        lowL = midL;
      } else { // Both out of gamut, or complex case. Fallback to luminance difference.
        if (currentLuminance > targetRelativeLuminance) highL = midL;
        else lowL = midL;
      }
    } else { // In gamut, adjust based on luminance difference
      if (diff < 0) { // Current luminance is too low, need higher Oklch.L
        lowL = midL;
      } else { // Current luminance is too high (or exact match already handled)
        highL = midL;
      }
    }
  }

  // Perform a final check with the best Oklch.L found during the search.
  const finalResult = _getSrgbGamutAndLuminanceFromOklch(bestMatchL, oklchChroma, oklchHue);

  // Determine final outOfGamut status: either the color itself is out of sRGB gamut,
  // or the luminance match is not within a reasonable tolerance (e.g., 5x initial tolerance).
  const luminanceMatchFailed = Math.abs(finalResult.luminance - targetRelativeLuminance) > (options.tolerance * 5);

  return {
    color: { L: matchResult.matchedOklchL, C: finalChroma, h: oklchHue },
    outOfGamut: finalResult.outOfGamut || luminanceMatchFailed,
    iterations: matchResult.iterations,
    finalSrgbColor: finalResult.srgbColor,
    finalLuminance: finalResult.luminance
  };
}


// --- Public API Functions ---

/**
 * Default options for chroma control functions.
 * @type {Readonly<Required<ChromaControlOptions>>}
 */
const DEFAULT_OPTIONS = Object.freeze({
  gamma: 3.0, // Corresponds to a gray surround perception
  whitePoint: D65_WHITE_POINT_XYZ, // Standard D65 white point
  chromaStep: 0.001, // Step for iterating chroma
  tolerance: 0.0001, // Luminance matching tolerance
  maxIterations: 50,   // Max iterations for binary search
  maxChromaSearchLimit: 0.5, // Practical upper limit for Oklch chroma in sRGB
  globalTargetChroma: 0.1 // Default for target mode, though typically user-supplied
});

/**
 * Finds the maximum Oklch chroma for a given hue and target CIELAB L*
 * that is still within the sRGB gamut. The Oklch Lightness (L) is adjusted
 * to match the luminance corresponding to the target CIELAB L*.
 *
 * @param {number} oklchHue - The Oklch hue angle (0-360 degrees).
 * @param {number} targetLabLightness - The target CIELAB L* value (0-100).
 * @param {AdjustChromaOptions} [userOptions={}] - Optional control parameters.
 * @returns {number} The maximum achievable Oklch chroma (typically 0 to ~0.4 for sRGB),
 * or 0 if no in-gamut chroma can be found.
 * @throws {TypeError} if inputs are invalid.
 */
export function findMaxChromaForLabLightness(oklchHue, targetLabLightness, userOptions = {}) {
  if (typeof oklchHue !== 'number' || oklchHue < 0 || oklchHue > 360) {
    throw new TypeError('oklchHue must be a number between 0 and 360.');
  }
  if (typeof targetLabLightness !== 'number' || targetLabLightness < 0 || targetLabLightness > 100) {
    throw new TypeError('targetLabLightness must be a number between 0 and 100.');
  }

  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  const targetRelLum = _labLightnessToRelativeLuminance(targetLabLightness, options.gamma, options.whitePoint);

  let currentChroma = 0;
  let maxInGamutChroma = 0;

  // Iterate chroma upwards until an out-of-gamut color is found or search limit is reached.
  while (currentChroma <= options.maxChromaSearchLimit) {
    const matchResult = _matchOklchLightnessToTargetLuminance(currentChroma, oklchHue, targetRelLum, options);
    if (matchResult.outOfGamut) {
      // If currentChroma is out of gamut, the previous step was the maximum in-gamut.
      break;
    }
    maxInGamutChroma = currentChroma; // This chroma is achievable and in gamut.
    currentChroma += options.chromaStep;
  }
  return maxInGamutChroma;
}

/**
 * Adjusts an Oklch color to match a target CIELAB L* and a target/clipped chroma.
 * It finds the Oklch Lightness (L) that yields the sRGB luminance corresponding
 * to the target CIELAB L*, for the determined final chroma and original hue,
 * while trying to stay within the sRGB gamut.
 *
 * @param {OklchColor} inputOklchColor - The input Oklch color {L, C, h}. The L component is an initial guess/ignored.
 * @param {number} targetLabLightness - The target CIELAB L* value (0-100).
 * @param {'clip' | 'target'} mode - Determines how chroma is handled:
 * - 'clip': The input chroma (`inputOklchColor.C`) is capped at the maximum achievable chroma
 * for the `targetLabLightness` and `inputOklchColor.h`.
 * - 'target': Aims for `options.globalTargetChroma`, but capped at the maximum achievable chroma.
 * @param {AdjustChromaOptions} [userOptions={}] - Optional parameters.
 * `globalTargetChroma` is required if `mode` is 'target'.
 * @returns {AdjustedOklchResult} An object containing the adjusted Oklch color,
 * its sRGB representation, final luminance, gamut status, and iteration count.
 * @throws {TypeError|Error} if inputs are invalid.
 */
export function adjustOklchForLabLightness(inputOklchColor, targetLabLightness, mode, userOptions = {}) {
  if (typeof inputOklchColor !== 'object' || inputOklchColor === null ||
      typeof inputOklchColor.L !== 'number' || // L is used as starting point in some contexts, but primarily C and h are used.
      typeof inputOklchColor.C !== 'number' ||
      typeof inputOklchColor.h !== 'number') {
    throw new TypeError('inputOklchColor must be a valid OklchColor object with L, C, h properties.');
  }
  if (typeof targetLabLightness !== 'number' || targetLabLightness < 0 || targetLabLightness > 100) {
    throw new TypeError('targetLabLightness must be a number between 0 and 100.');
  }
  if (mode !== 'clip' && mode !== 'target') {
    throw new TypeError("Mode must be either 'clip' or 'target'.");
  }

  const options = { ...DEFAULT_OPTIONS, ...userOptions };

  if (mode === 'target' && typeof options.globalTargetChroma !== 'number') {
    throw new Error("globalTargetChroma option must be provided and be a number for 'target' mode.");
  }

  const oklchHue = inputOklchColor.h;
  // Find the maximum chroma achievable for this hue at the target L*'s luminance.
  const maxAchievableChromaAtTargetL = findMaxChromaForLabLightness(oklchHue, targetLabLightness, options);

  let finalChroma;
  if (mode === 'target') {
    // Aim for globalTargetChroma, but don't exceed what's possible for this L* and hue.
    finalChroma = Math.min(options.globalTargetChroma, maxAchievableChromaAtTargetL);
  } else { // mode === 'clip'
    // Use the input chroma, but don't exceed what's possible for this L* and hue.
    finalChroma = Math.min(inputOklchColor.C, maxAchievableChromaAtTargetL);
  }
  finalChroma = Math.max(0, finalChroma); // Ensure chroma is not negative.

  // Calculate the target relative luminance based on the target CIELAB L* and gamma.
  const targetRelLum = _labLightnessToRelativeLuminance(targetLabLightness, options.gamma, options.whitePoint);

  // Find the Oklch.L that produces this targetRelLum for the finalChroma and oklchHue.
  const matchResult = _matchOklchLightnessToTargetLuminance(finalChroma, oklchHue, targetRelLum, options);

  return {
    color: { L: matchResult.matchedOklchL, C: finalChroma, h: oklchHue },
    outOfGamut: matchResult.outOfGamut,
    iterations: matchResult.iterations,
    finalSrgbColor: matchResult.finalSrgbColor,
    finalLuminance: matchResult.finalLuminance
  };
}