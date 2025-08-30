/**
 * @file src/types.js
 * @module types
 * @description Centralized JSDoc type definitions for color objects and other
 * common structures used throughout the color-utils library.
 * This file contains no executable code, only JSDoc comments for type hinting.
 */

// --- Core Color Object Types ---

/**
 * Represents a color in the sRGB color space (gamma-corrected).
 * Component values are typically in the range [0, 1].
 * @typedef {object} SrgbColor
 * @property {number} r - Red component.
 * @property {number} g - Green component.
 * @property {number} b - Blue component.
 */

/**
 * Represents a color in the Linear sRGB color space.
 * Component values are typically in the range [0, 1].
 * @typedef {object} LinearSrgbColor
 * @property {number} r - Red component.
 * @property {number} g - Green component.
 * @property {number} b - Blue component.
 */

/**
 * Represents a color in the CIE XYZ color space.
 * Assumes D65 illuminant unless otherwise specified in function context.
 * The Y component is typically in the range [0, 1] (relative to Y_n=1 for D65).
 * @typedef {object} XyzColor
 * @property {number} x - X tristimulus value.
 * @property {number} y - Y tristimulus value (luminance factor).
 * @property {number} z - Z tristimulus value.
 */

/**
 * Represents a color in the CIE L*a*b* (CIELAB) color space.
 * @typedef {object} LabColor
 * @property {number} L - Lightness (L*), typically 0-100.
 * @property {number} a - a* axis (green-red).
 * @property {number} b - b* axis (blue-yellow).
 */

/**
 * Represents a color in the CIE L*C*h_ab (CIELCh) color space.
 * This is the cylindrical representation of CIELAB.
 * @typedef {object} LchColor
 * @property {number} L - Lightness (L*), same as LabColor L*.
 * @property {number} C - Chroma (C*_ab), typically >= 0.
 * @property {number} h - Hue angle (h_ab) in degrees, typically 0-360.
 */

/**
 * Represents a color in the Oklab color space.
 * @typedef {object} OklabColor
 * @property {number} L - Lightness, typically 0-1.
 * @property {number} a - a-axis (green-red).
 * @property {number} b - b-axis (blue-yellow).
 */

/**
 * Represents a color in the OkLCh color space.
 * This is the cylindrical representation of Oklab.
 * @typedef {object} OklchColor
 * @property {number} L - Lightness, same as OklabColor L*.
 * @property {number} C - Chroma, typically >= 0.
 * @property {number} h - Hue angle in degrees, typically 0-360.
 */


// --- Appearance Model Related Types ---

/**
 * Defines the type of surround for CIECAM16 viewing conditions.
 * @typedef {'average' | 'dim' | 'dark'} CiecamSurroundType
 */

/**
 * Defines the viewing conditions for CIECAM16 calculations.
 * @typedef {object} Ciecam16ViewingConditions
 * @property {number} adaptingLuminance - Adapting field luminance in cd/m^2 (L_A).
 * @property {number} backgroundLuminanceFactor - Luminance factor of the background (Y_b), as a percentage of reference white Y (e.g., 20 for 20% gray, 100 for white).
 * @property {CiecamSurroundType} surroundType - Type of surround: 'average', 'dim', or 'dark'.
 * @property {XyzColor} [referenceWhite=D65_WHITE_POINT_XYZ] - Optional: The XYZ coordinates of the reference white, scaled to Y=100. Defaults to D65.
 * @property {number} [degreeOfAdaptation=null] - Optional: Degree of adaptation (D). If null or not provided, it's calculated. Range 0-1.
 */

/**
 * Represents the calculated appearance correlates from the CIECAM16 model.
 * @typedef {object} Ciecam16Appearance
 * @property {number} J - Lightness correlate.
 * @property {number} Q - Brightness correlate.
 * @property {number} C - Chroma correlate.
 * @property {number} M - Colorfulness correlate.
 * @property {number} s - Saturation correlate.
 * @property {number} h - Hue angle in degrees (0-360).
 * @property {number} H - Hue quadrature / Hue composition.
 * @property {number} a_c - Cartesian a-coordinate (red-green) for CAM16.
 * @property {number} b_c - Cartesian b-coordinate (yellow-blue) for CAM16.
 */


// --- Adaptive Oklab Related Types ---

/**
 * Defines the type of surround for AdaptiveOklab configuration.
 * @typedef {'white' | 'gray' | 'dark'} AdaptiveOklabSurround
 */

/**
 * Defines configuration options for the AdaptiveOklab class.
 * @typedef {object} AdaptiveOklabOptions
 * @property {AdaptiveOklabSurround} [surround='gray'] - The viewing surround condition.
 * @property {number} [x0=0.5] - Representative LMS value for correction factor calculation.
 */

// --- Chroma Control Related Types ---
/**
 * Options for chroma control functions.
 * Combines properties from ChromaControlOptions and the specific globalTargetChroma property.
 * @typedef {object} AdjustChromaOptions
 * @property {number} [gamma=3.0] - Gamma value for the modified Lab L* to target luminance conversion.
 * @property {XyzColor} [whitePoint=D65_WHITE_POINT_XYZ] - Reference white point for the modified Lab conversion (Y=100 scale).
 * @property {number} [chromaStep=0.001] - Step size for iterating chroma in findMaxChroma.
 * @property {number} [tolerance=0.0001] - Tolerance for luminance matching in binary search.
 * @property {number} [maxIterations=50] - Maximum iterations for binary search in lightness matching.
 * @property {number} [maxChromaSearchLimit=0.5] - Upper limit for chroma search.
 * @property {number} [globalTargetChroma] - Required for 'target' mode in adjustOklchForLabLightness.
 */

/**
 * Options for chroma control functions (excluding globalTargetChroma which is specific to one function).
 * @typedef {object} ChromaControlOptions
 * @property {number} [gamma=3.0] - Gamma value for the modified Lab L* to target luminance conversion.
 * @property {XyzColor} [whitePoint=D65_WHITE_POINT_XYZ] - Reference white point for the modified Lab conversion (Y=100 scale).
 * @property {number} [chromaStep=0.001] - Step size for iterating chroma in findMaxChroma.
 * @property {number} [tolerance=0.0001] - Tolerance for luminance matching in binary search.
 * @property {number} [maxIterations=50] - Maximum iterations for binary search in lightness matching.
 * @property {number} [maxChromaSearchLimit=0.5] - Upper limit for chroma search.
 */


/**
 * Result object from adjustOklchForLabLightness function.
 * @typedef {object} AdjustedOklchResult
 * @property {OklchColor} color - The adjusted Oklch color.
 * @property {boolean} outOfGamut - True if the matched sRGB color is out of gamut, or if luminance match failed significantly.
 * @property {number} iterations - Number of iterations performed by the lightness matching algorithm.
 * @property {SrgbColor} finalSrgbColor - The sRGB representation of the adjusted Oklch color.
 * @property {number} finalLuminance - The relative luminance of the finalSrgbColor.
 */

// This file is for JSDoc type definitions only.
// It should not contain any executable JavaScript code.
// To use these types in JSDoc:
// /** @param {SrgbColor} color */
// function myFunction(color) { /* ... */ }