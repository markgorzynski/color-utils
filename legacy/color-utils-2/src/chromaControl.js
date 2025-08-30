/**
 * @file src/chromaControl.js
 * @module color-utils/chromaControl
 * @description Provides advanced functions for controlling Oklch chroma and AOkLab Lightness
 * to achieve specific target CIE Luminance (derived from CIELAB L*) values,
 * while leveraging the AOkLab model for its surround adaptation and hue uniformity.
 * This enables the creation of color palettes that are both perceptually harmonious
 * under various viewing conditions and compliant with WCAG contrast requirements.
 *
 * **Key Features & Novel Approach:**
 *
 * This module offers a unique combination of capabilities not commonly found together:
 *
 * 1.  **Leverages Oklab's Excellent Hue Uniformity:**
 * By working with AOkLab Hue (H_aok) and Chroma (C_aok), which are based on Oklab's
 * structure, this module benefits from Oklab's superior hue linearity compared to
 * spaces like CIELAB (especially in blue regions, avoiding violet shifts).
 *
 * 2.  **Leverages Oklab's Simplicity and Speed (as a base for AOkLab):**
 * AOkLab, built upon Oklab, is computationally more efficient than full
 * Color Appearance Models (CAMs) like CIECAM16, making these advanced
 * adjustments practical for dynamic applications.
 *
 * 3.  **Integrates AOkLab's Surround Correction (New for an Oklab-based framework):**
 * The core AOkLab model (`AdaptiveOklab` class from `aoklab.js`) adjusts its
 * internal lightness mapping based on 'white', 'gray', or 'dark' surround
 * conditions. This module uses a configured AOkLab instance, meaning all
 * color transformations inherently account for the specified surround adaptation.
 * This is achieved by AOkLab using a derived adaptive exponent `p` and a
 * hue correction factor `x0^((1/3)-p)`.
 *
 * 4.  **Enables Constant WCAG Contrast & CIE Luminance Compatibility (Novel Combination):**
 * - Standard Oklab/AOkLab Lightness (L_ok / L_aok) does not directly correlate
 * with CIE Luminance (Y) or provide straightforward WCAG contrast control.
 * - This module solves this by allowing users to specify a **target CIELAB L*** value.
 * This target L\* is converted to a target CIE Relative Luminance (Y_cie).
 * - An iterative search then finds the **AOkLab Lightness (L_aok)** that, for a
 * given AOkLab Hue, AOkLab Chroma, and AOkLab surround setting, produces an
 * sRGB color matching the `Y_target_cie`.
 * - This provides precise control over physical luminance for accessibility,
 * while retaining the perceptual benefits (hue uniformity, surround adaptation)
 * of the AOkLab color model for defining the color's chromatic characteristics.
 *
 * **In essence, designers gain two powerful, previously incompatible control mechanisms:**
 * - Define color appearance (hue, colorfulness, adaptation to surround) using AOkLab.
 * - Simultaneously enforce precise luminance levels (for WCAG contrast) by targeting
 * a CIELAB L* value.
 */

// --- Type Imports for JSDoc ---
/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {import('./types.js').XyzColor} XyzColor */
/** @typedef {import('./types.js').OklabColor} OklabColor */
/** @typedef {import('./types.js').OklchColor} OklchColor */
/** @typedef {import('./types.js').AdaptiveOklabOptions} AdaptiveOklabOptions */
/**
 * @typedef {object} AokChromaControlOptions
 * @property {AdaptiveOklabOptions} [adaptiveOklabOptions]
 * @property {number} [tolerance=1e-4]
 * @property {number} [maxIterations=50]
 * @property {number} [chromaStep=0.005]
 * @property {number} [maxChromaSearchLimit=0.4]
 */
/** @typedef {AokChromaControlOptions & { globalTargetAokChroma?: number }} AdjustAokColorOptions */
/**
 * @typedef {object} AokChromaControlResult
 * @property {OklchColor} aokLCH
 * @property {SrgbColor} srgbColor
 * @property {number} relativeLuminanceY
 * @property {boolean} outOfGamut
 * @property {number} iterations
 */

// --- Utility and Color Module Imports ---
import { D65_WHITE_POINT_XYZ, normalizeHue } from './utils.js';
import { AdaptiveOklab } from './aoklab.js';
import { getSrgbRelativeLuminance } from './color-metrics.js';

// --- Constants for CIELAB L* to Y conversion ---
const EPSILON_CIELAB = Math.pow(6 / 29, 3);
const KAPPA_CIELAB = Math.pow(29 / 3, 3);

/**
 * Converts a CIELAB L* value to CIE relative luminance Y (0-1 scale).
 * @private
 * @param {number} L_star - CIELAB Lightness L* [0, 100].
 * @param {number} [referenceWhiteYn=100.0] - Y tristimulus of reference white.
 * @returns {number} CIE Relative Luminance Y (0-1).
 */
function _labLToRelativeY(L_star, referenceWhiteYn = 100.0) {
  if (typeof L_star !== 'number' || Number.isNaN(L_star) || L_star < 0 || L_star > 100) {
    throw new TypeError('L_star must be a number between 0 and 100.');
  }
  if (typeof referenceWhiteYn !== 'number' || Number.isNaN(referenceWhiteYn) || referenceWhiteYn <= 0) {
    throw new TypeError('referenceWhiteYn must be a positive number.');
  }
  const fy = (L_star + 16) / 116;
  const yr = (fy > Math.cbrt(EPSILON_CIELAB)) ? Math.pow(fy, 3) : (116 * fy - 16) / KAPPA_CIELAB;
  return Math.max(0, Math.min(1, yr * (referenceWhiteYn / 100.0)));
}

/**
 * Core search: Finds AOkLab L for a target CIE Y.
 * @private
 * @param {number} targetCieY
 * @param {number} targetAokChroma
 * @param {number} targetAokHue
 * @param {AdaptiveOklabOptions} aokOptions
 * @param {Required<Pick<AokChromaControlOptions, 'tolerance' | 'maxIterations'>>} searchCtrlOptions
 * @returns {{foundAokL: number, finalSrgb: SrgbColor, finalCieY: number, finalOutOfGamut: boolean, iterations: number}}
 */
function _findAokLForTargetCIELuminance(
  targetCieY,
  targetAokChroma,
  targetAokHue,
  aokOptions,
  searchCtrlOptions
) {
  const aokConverter = new AdaptiveOklab(aokOptions);
  let lowAokL = 0.0;
  let highAokL = 1.0;
  let midAokL = Math.max(0, Math.min(1, targetCieY));
  let iterations = 0;

  let bestMatch = {
    foundAokL: midAokL,
    finalSrgb: { r: 0.5, g: 0.5, b: 0.5 },
    finalCieY: 0.5,
    finalOutOfGamut: true,
    diffY: Infinity,
  };

  for (iterations = 0; iterations < searchCtrlOptions.maxIterations; iterations++) {
    midAokL = (lowAokL + highAokL) / 2;
    if (Math.abs(highAokL - lowAokL) < 1e-7) break;

    const candidateAokLCH = { L: midAokL, C: targetAokChroma, h: targetAokHue };
    const currentSrgb = aokConverter.toSrgb(candidateAokLCH);
    const currentCieY = getSrgbRelativeLuminance(currentSrgb);
    const epsilonGamut = 1e-7;
    const currentOutOfGamut =
      currentSrgb.r < -epsilonGamut || currentSrgb.r > 1 + epsilonGamut ||
      currentSrgb.g < -epsilonGamut || currentSrgb.g > 1 + epsilonGamut ||
      currentSrgb.b < -epsilonGamut || currentSrgb.b > 1 + epsilonGamut;
    const diffY = currentCieY - targetCieY;

    if (!currentOutOfGamut) {
      if (bestMatch.finalOutOfGamut || Math.abs(diffY) < Math.abs(bestMatch.diffY)) {
        bestMatch = { foundAokL: midAokL, finalSrgb: currentSrgb, finalCieY: currentCieY, finalOutOfGamut: false, diffY };
      }
      if (Math.abs(diffY) < searchCtrlOptions.tolerance) break;
    } else if (bestMatch.finalOutOfGamut && Math.abs(diffY) < Math.abs(bestMatch.diffY)) {
      bestMatch = { foundAokL: midAokL, finalSrgb: currentSrgb, finalCieY: currentCieY, finalOutOfGamut: true, diffY };
    }

    if (diffY < 0) { lowAokL = midAokL; }
    else { highAokL = midAokL; }
  }

  const finalEvalAokLCH = { L: bestMatch.foundAokL, C: targetAokChroma, h: targetAokHue };
  bestMatch.finalSrgb = aokConverter.toSrgb(finalEvalAokLCH);
  bestMatch.finalCieY = getSrgbRelativeLuminance(bestMatch.finalSrgb);
  const epsilonGamutFinal = 1e-7;
  bestMatch.finalOutOfGamut =
    bestMatch.finalSrgb.r < -epsilonGamutFinal || bestMatch.finalSrgb.r > 1 + epsilonGamutFinal ||
    bestMatch.finalSrgb.g < -epsilonGamutFinal || bestMatch.finalSrgb.g > 1 + epsilonGamutFinal ||
    bestMatch.finalSrgb.b < -epsilonGamutFinal || bestMatch.finalSrgb.b > 1 + epsilonGamutFinal;

  return { ...bestMatch, iterations };
}

/**
 * Default options for AOkLab chroma control functions.
 * @type {Readonly<Required<AokChromaControlOptions>>}
 */
const DEFAULT_AOK_CHROMA_CONTROL_OPTIONS = Object.freeze({
  adaptiveOklabOptions: { surround: 'gray', x0: 0.5 },
  tolerance: 1e-4,
  maxIterations: 50,
  chromaStep: 0.005,
  maxChromaSearchLimit: 0.4,
});

/**
 * Finds the maximum AOkLab Chroma for a given AOkLab Hue that results in an sRGB color
 * matching a target CIELAB L* (and thus a target CIE Y), within the sRGB gamut.
 * AOkLab Lightness is internally adjusted by the search.
 *
 * @param {number} targetAokHueInput - Target AOkLab Hue in degrees [0, 360).
 * @param {number} targetLabL_forY - Target CIELAB L* [0, 100], used to derive target CIE Y.
 * @param {Partial<AokChromaControlOptions>} [userOptions={}] - Optional parameters.
 * @returns {number} Maximum achievable AOkLab Chroma (C_aok), or 0 if no in-gamut solution.
 * @throws {TypeError}
 * @example
 * const maxC = findMaxAokChromaForLabL(265, 50, {
 * adaptiveOklabOptions: { surround: 'white' }
 * });
 * console.log(`Max C_aok for H_aok=265, L*_lab=50 (white surround): ${maxC}`);
 */
export function findMaxAokChromaForLabL(targetAokHueInput, targetLabL_forY, userOptions = {}) {
  const targetAokHue = normalizeHue(targetAokHueInput);
  if (typeof targetAokHue !== 'number' || Number.isNaN(targetAokHue)) {
    throw new TypeError('targetAokHue must be a valid number.');
  }
  if (typeof targetLabL_forY !== 'number' || Number.isNaN(targetLabL_forY) || targetLabL_forY < 0 || targetLabL_forY > 100) {
    throw new TypeError('targetLabL_forY must be a number between 0 and 100.');
  }

  const options = {
    ...DEFAULT_AOK_CHROMA_CONTROL_OPTIONS,
    ...userOptions,
    adaptiveOklabOptions: {
        ...DEFAULT_AOK_CHROMA_CONTROL_OPTIONS.adaptiveOklabOptions,
        ...(userOptions.adaptiveOklabOptions || {})
    }
  };

  const targetCieY = _labLToRelativeY(targetLabL_forY, D65_WHITE_POINT_XYZ.Y);
  let currentAokChroma = options.maxChromaSearchLimit;
  let maxInGamutAokChroma = 0;

  while (currentAokChroma >= -options.chromaStep/2) {
    const searchResult = _findAokLForTargetCIELuminance(
      targetCieY,
      Math.max(0, currentAokChroma),
      targetAokHue,
      options.adaptiveOklabOptions,
      options
    );
    if (!searchResult.finalOutOfGamut && Math.abs(searchResult.finalCieY - targetCieY) < options.tolerance * 5) {
      maxInGamutAokChroma = Math.max(0, currentAokChroma);
      break;
    }
    currentAokChroma -= options.chromaStep;
  }
  // Final check for C=0 if nothing found, as achromatic should always be possible if Y is valid.
  if (maxInGamutAokChroma === 0 && currentAokChroma < 0) {
      const achromaticSearch = _findAokLForTargetCIELuminance(targetCieY, 0, targetAokHue, options.adaptiveOklabOptions, options);
      if (!achromaticSearch.finalOutOfGamut && Math.abs(achromaticSearch.finalCieY - targetCieY) < options.tolerance * 5) {
          return 0; // Achromatic is possible
      }
      // else truly nothing found, return 0, or could throw error if Y target is impossible (e.g. Y=0 or Y=1 with C>0)
  }
  return maxInGamutAokChroma;
}

/**
 * Adjusts an AOkLab color (defined by Hue and target Chroma) to match a target CIELAB L*
 * (by matching its corresponding CIE Luminance Y), respecting sRGB gamut.
 * The output AOkLab Lightness is found by iterative search.
 *
 * @param {{L?: number, C: number, h: number}} inputAokLCHHint - Provides target AOkLab Hue (h),
 * and target/initial AOkLab Chroma (C). The L component is ignored.
 * @param {number} targetLabL_forY - Target CIELAB L* [0, 100] for the output's luminance.
 * @param {'clip' | 'target'} mode - How chroma is handled:
 * - 'clip': `inputAokLCHHint.C` is target, clipped to max achievable at `targetLabL_forY`.
 * - 'target': `userOptions.globalTargetAokChroma` is target, clipped to max achievable.
 * @param {Partial<AdjustAokColorOptions>} [userOptions={}] - Optional parameters.
 * If `mode` is 'target', `userOptions.globalTargetAokChroma` is required.
 * @returns {AokChromaControlResult} Result object.
 * @throws {TypeError|Error}
 * @example
 * const blueHint = { C: 0.1, h: 265 };
 * const result = adjustAokColorToLabL(blueHint, 50, 'clip', {
 * adaptiveOklabOptions: { surround: 'white' }
 * });
 * if (!result.outOfGamut) {
 * console.log('White adapted L*50 Blue:', result.aokLCH, 'sRGB:', result.srgbColor);
 * }
 */
export function adjustAokColorToLabL(inputAokLCHHint, targetLabL_forY, mode, userOptions = {}) {
  if (
    typeof inputAokLCHHint !== 'object' || inputAokLCHHint === null ||
    typeof inputAokLCHHint.C !== 'number' || Number.isNaN(inputAokLCHHint.C) ||
    typeof inputAokLCHHint.h !== 'number' || Number.isNaN(inputAokLCHHint.h)
  ) {
    throw new TypeError('inputAokLCHHint must be an object with C and h valid number properties.');
  }
  const targetAokHue = normalizeHue(inputAokLCHHint.h);

  if (typeof targetLabL_forY !== 'number' || Number.isNaN(targetLabL_forY) || targetLabL_forY < 0 || targetLabL_forY > 100) {
    throw new TypeError('targetLabL_forY must be a number between 0 and 100.');
  }
  if (mode !== 'clip' && mode !== 'target') {
    throw new TypeError("Mode must be either 'clip' or 'target'.");
  }

  const options = {
    ...DEFAULT_AOK_CHROMA_CONTROL_OPTIONS,
    ...userOptions,
    adaptiveOklabOptions: {
      ...DEFAULT_AOK_CHROMA_CONTROL_OPTIONS.adaptiveOklabOptions,
      ...(userOptions.adaptiveOklabOptions || {})
    }
  };

  if (mode === 'target' && (typeof options.globalTargetAokChroma !== 'number' || Number.isNaN(options.globalTargetAokChroma))) {
    throw new Error("The 'globalTargetAokChroma' option must be provided and be a valid number for 'target' mode.");
  }

  const maxAchievableAokChroma = findMaxAokChromaForLabL(targetAokHue, targetLabL_forY, options);

  let finalTargetAokChroma;
  if (mode === 'target') {
    finalTargetAokChroma = Math.min(options.globalTargetAokChroma, maxAchievableAokChroma);
  } else { // mode === 'clip'
    finalTargetAokChroma = Math.min(inputAokLCHHint.C, maxAchievableAokChroma);
  }
  finalTargetAokChroma = Math.max(0, finalTargetAokChroma);

  const targetCieY = _labLToRelativeY(targetLabL_forY, D65_WHITE_POINT_XYZ.Y);

  const searchResult = _findAokLForTargetCIELuminance(
    targetCieY,
    finalTargetAokChroma,
    targetAokHue,
    options.adaptiveOklabOptions,
    options
  );

  return {
    aokLCH: { L: searchResult.foundAokL, C: finalTargetAokChroma, h: targetAokHue },
    srgbColor: searchResult.finalSrgb,
    relativeLuminanceY: searchResult.finalCieY,
    outOfGamut: searchResult.finalOutOfGamut,
    iterations: searchResult.iterations,
  };
}