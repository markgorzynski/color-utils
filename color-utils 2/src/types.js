/**
 * @file color-utils/types.js
 * @module color-utils/types
 * @description Centralized JSDoc type definitions for color objects and other
 * common structures used throughout the color-utils library.
 * This file contains no executable code, only JSDoc comments for type hinting.
 */

// --- Core Color Object Types ---

/**
 * Represents a color in the sRGB color space (gamma-corrected).
 * Component values are typically in the range [0, 1].
 * @typedef {object} SrgbColor
 * @property {number} r - Red component (0-1).
 * @property {number} g - Green component (0-1).
 * @property {number} b - Blue component (0-1).
 */

/**
 * Represents a color in the Linear sRGB color space (without gamma correction).
 * Component values are typically in the range [0, 1].
 * @typedef {object} LinearSrgbColor
 * @property {number} r - Red component (0-1).
 * @property {number} g - Green component (0-1).
 * @property {number} b - Blue component (0-1).
 */

/**
 * Represents a color in the CIE XYZ color space.
 * These are tristimulus values.
 * Assumes D65 illuminant and 2° observer unless otherwise specified in function context.
 * The Y component typically corresponds to luminance. Values are often scaled such that
 * the Y of the reference white (e.g., D65) is 100 or 1.
 * @typedef {object} XyzColor
 * @property {number} X - X tristimulus value.
 * @property {number} Y - Y tristimulus value (often proportional to luminance).
 * @property {number} Z - Z tristimulus value.
 */

/**
 * Represents a color in the CIE L*a*b* (CIELAB) color space.
 * Defined relative to a reference white point.
 * @typedef {object} LabColor
 * @property {number} L - Lightness (L*), typically in the range [0, 100].
 * @property {number} a - a* axis (green-red chromaticity).
 * @property {number} b - b* axis (blue-yellow chromaticity).
 */

/**
 * Represents a color in the CIE L*C*h_ab (CIELCh) color space.
 * This is the cylindrical representation of CIELAB.
 * @typedef {object} LchColor
 * @property {number} L - Lightness (L*), same as LabColor L*, typically [0, 100].
 * @property {number} C - Chroma (C*_ab), typically >= 0.
 * @property {number} h - Hue angle (h_ab) in degrees, typically [0, 360).
 */

/**
 * Represents a color in the Oklab color space.
 * @typedef {object} OklabColor
 * @property {number} L - Lightness, typically [0, 1].
 * @property {number} a - a-axis (green-red chromaticity).
 * @property {number} b - b-axis (blue-yellow chromaticity).
 */

/**
 * Represents a color in the OkLCh color space.
 * This is the cylindrical representation of Oklab.
 * @typedef {object} OklchColor
 * @property {number} L - Lightness, same as OklabColor L*, typically [0, 1].
 * @property {number} C - Chroma, typically >= 0.
 * @property {number} h - Hue angle in degrees, typically [0, 360).
 */

// --- Appearance Model Related Types ---

/**
 * Defines the type of surround for CIECAM16 viewing conditions.
 * These terms correspond to specific parameter values in the model.
 * @typedef {'average' | 'dim' | 'dark'} CiecamSurroundType
 */

/**
 * Defines the viewing conditions for CIECAM16 calculations.
 * @typedef {object} Ciecam16ViewingConditions
 * @property {number} adaptingLuminance - Adapting field luminance in cd/m^2 (L_A).
 * @property {number} backgroundLuminanceFactor - Luminance factor of the background (Y_b), relative to reference white Y (e.g., 0.2 for a background that is 20% as luminous as the reference white, typically in range [0,1] or [0,100] depending on Y_white scaling).
 * @property {CiecamSurroundType} surroundType - Type of surround, influencing model parameters.
 * @property {XyzColor} [referenceWhite] - Optional: The XYZ tristimulus values of the reference white (e.g., D65 scaled to Y=100). Defaults to D65 if not provided by the implementing function.
 * @property {number} [degreeOfAdaptation] - Optional: Degree of adaptation (D factor). If null or not provided, it's typically calculated by the model. Range [0, 1].
 */

/**
 * Represents the calculated appearance correlates from the CIECAM16 model.
 * @typedef {object} Ciecam16Appearance
 * @property {number} J - Lightness correlate.
 * @property {number} Q - Brightness correlate (absolute brightness).
 * @property {number} C - Chroma correlate (relative colorfulness).
 * @property {number} M - Colorfulness correlate (absolute colorfulness).
 * @property {number} s - Saturation correlate (chroma relative to lightness J).
 * @property {number} h - Hue angle in degrees, typically [0, 360).
 * @property {number} H - Hue quadrature or Hue composition correlate.
 * @property {number} a_c - Cartesian a-coordinate (red-green) for CAM16-UCS.
 * @property {number} b_c - Cartesian b-coordinate (yellow-blue) for CAM16-UCS.
 */

// --- Adaptive Oklab Related Types ---

/**
 * Defines the type of surround for AdaptiveOklab configuration.
 * These correspond to different adaptation levels in the model.
 * @typedef {'white' | 'gray' | 'dark'} AdaptiveOklabSurround
 */

/**
 * Defines configuration options for the AdaptiveOklab class or functions.
 * @typedef {object} AdaptiveOklabOptions
 * @property {AdaptiveOklabSurround} [surround='gray'] - The viewing surround condition, affecting adaptation.
 * @property {number} [x0=0.5] - Representative LMS cone response value for the correction factor calculation in the model. (Context-dependent parameter, consult model specifics).
 */

// --- Chroma Control Related Types (Updated for AOkLab based chromaControl.js) ---

/**
 * Options for AOkLab-based chroma control functions.
 * Matches the JSDoc in `chromaControl.js`.
 * @typedef {object} AokChromaControlOptions
 * @property {AdaptiveOklabOptions} [adaptiveOklabOptions] - Options for the underlying AdaptiveOklab instance.
 * @property {number} [tolerance=1e-4] - Convergence tolerance for iterative algorithms.
 * @property {number} [maxIterations=50] - Maximum iterations for searches.
 * @property {number} [chromaStep=0.005] - Step size for chroma search.
 * @property {number} [maxChromaSearchLimit=0.4] - Upper limit for AOkLab chroma search.
 */

/**
 * Options specifically for adjusting AOkLab color to a global target AOkLab chroma.
 * Includes all properties from {@link AokChromaControlOptions}.
 * Matches the JSDoc in `chromaControl.js`.
 * @typedef {AokChromaControlOptions & { globalTargetAokChroma?: number }} AdjustAokColorOptions
 * @property {number} [globalTargetAokChroma] - The target AOkLab chroma value to achieve.
 */

/**
 * Result object from AOkLab-based chroma control functions like `adjustAokColorToLabL`.
 * Matches the JSDoc in `chromaControl.js`.
 * @typedef {object} AokChromaControlResult
 * @property {OklchColor} aokLCH - The resulting AOkLab color in LCH form (L_aok, C_aok, H_aok).
 * @property {SrgbColor} srgbColor - The sRGB representation of the `aokLCH` color.
 * @property {number} relativeLuminanceY - The CIE relative luminance (Y, 0-1) of the `srgbColor`.
 * @property {boolean} outOfGamut - True if the `srgbColor` is out of sRGB gamut or if search failed.
 * @property {number} iterations - Number of iterations performed by the search algorithm.
 */


// --- Old/Generic Chroma Control Types (Review if still needed or can be deprecated) ---
// These were the previous definitions. If the new AOkLab based control is the sole approach,
// these might be deprecated or removed to avoid confusion.
// If you still have other functions using these exact types, keep them.

/**
 * General options for chroma control and gamut mapping algorithms.
 * @typedef {object} ChromaControlOptions
 * @property {number} [gamma=2.2]
 * @property {XyzColor} [whitePoint]
 * @property {number} [chromaStep=0.001]
 * @property {number} [tolerance=0.0001]
 * @property {number} [maxIterations=50]
 * @property {number} [maxChromaSearchLimit=0.5]
 */

/**
 * Options specifically for adjusting chroma to a global target value.
 * Includes all properties from {@link ChromaControlOptions}.
 * @typedef {ChromaControlOptions & { globalTargetChroma: number }} AdjustToGlobalChromaOptions
 * @property {number} globalTargetChroma - The target chroma value to achieve for the color.
 */

/**
 * Result object from a function that adjusts Oklch color, possibly to match a target Lab lightness or other criteria.
 * @typedef {object} AdjustedOklchResult
 * @property {OklchColor} color - The resulting (potentially adjusted) Oklch color.
 * @property {boolean} outOfGamut - True if the sRGB representation of the `color` is out of the sRGB gamut,
 * or if an iterative matching process (e.g., luminance) failed to converge adequately.
 * @property {number} [iterations] - Optional: Number of iterations performed by an underlying algorithm, if applicable.
 * @property {SrgbColor} finalSrgbColor - The sRGB representation of the `color`.
 * @property {number} finalLuminance - The relative luminance (Y from XYZ, scaled 0-1, assuming Y_white=1) of the `finalSrgbColor`.
 */

// This file is for JSDoc type definitions only.
// It should not contain any executable JavaScript code.