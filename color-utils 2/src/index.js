/**
 * @file src/index.js
 * @module color-utils
 * @description Main entry point for the color-utils library.
 * This file re-exports the primary public-facing functions, classes,
 * and constants from the various modules within the library, providing
 * a consolidated API for users. All underlying modules are also located
 * within the 'src' directory.
 */

// --- Type Imports for JSDoc (to ensure this file itself is well-documented if needed) ---
// Not strictly necessary for functionality but good for maintainability of this file.
/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {import('./types.js').LinearSrgbColor} LinearSrgbColor */
/** @typedef {import('./types.js').XyzColor} XyzColor */
/** @typedef {import('./types.js').LabColor} LabColor */
/** @typedef {import('./types.js').LchColor} LchColor */
/** @typedef {import('./types.js').OklabColor} OklabColor */
/** @typedef {import('./types.js').OklchColor} OklchColor */
/** @typedef {import('./types.js').Ciecam16ViewingConditions} Ciecam16ViewingConditions */
/** @typedef {import('./types.js').Ciecam16Appearance} Ciecam16Appearance */
/** @typedef {import('./types.js').AdaptiveOklabOptions} AdaptiveOklabOptions */
/** @typedef {import('./types.js').AokChromaControlOptions} AokChromaControlOptions */ // Added
/** @typedef {import('./types.js').AdjustAokColorOptions} AdjustAokColorOptions */   // Added
/** @typedef {import('./types.js').AokChromaControlResult} AokChromaControlResult */ // Added


// --- Utility functions (generic helpers) ---
export {
  // From utils.js
  D65_WHITE_POINT_XYZ,
  degreesToRadians,
  radiansToDegrees,
  multiplyMatrixVector,
  signPreservingPow,
  clamp,
  lerp,
  normalizeHue // Exported from utils.js
} from './utils.js';

// --- sRGB color space conversions and utilities ---
export {
  srgbToLinearSrgb,
  linearSrgbToSrgb,
  linearSrgbToXyz,
  xyzToLinearSrgb,
  srgbToXyz,
  xyzToSrgb,
  parseSrgbHex,
  formatSrgbAsHex
} from './srgb.js';

// --- CIELAB and CIELCh color space conversions ---
export {
  xyzToLab,
  labToXyz,
  labToLch,
  lchToLab,
  srgbToLab,
  labToSrgb,
  srgbToLch,
  lchToSrgb
} from './cielab.js';

// --- Oklab and OkLCh color space conversions ---
export {
  linearSrgbToOklab,
  oklabToLinearSrgb,
  oklabToOklch,
  oklchToOklab,
  srgbToOklab,
  oklabToSrgb,
  srgbToOklch,
  oklchToSrgb
} from './oklab.js';

// --- Adaptive Oklab color model ---
// Assuming AdaptiveOklab is a class or a primary function for this module
export { AdaptiveOklab } from './aoklab.js'; // Assuming aoklab.js exists and exports this

// --- CIECAM16 color appearance model ---
export { srgbToCiecam16 } from './ciecam16.js'; // Assuming ciecam16.js exists

// --- Color metrics and difference calculations ---
export {
  getSrgbRelativeLuminance,
  calculateWcagContrast,
  isWcagContrastSufficient,
  calculateCiede2000,
  calculateOklchDifference
} from './color-metrics.js';

// --- Chroma control functionalities ---
export {
  findMaxAokChromaForLabL,     // Updated name
  adjustAokColorToLabL       // Updated name
} from './chromaControl.js';

// --- Note on Type Definitions ---
// JSDoc @typedefs from types.js are used for static analysis and editor type hinting.
// They are not typically re-exported as runtime values from index.js.
// Consumers of the library rely on their IDE's JSDoc parsing capabilities or can
// import types directly in their own JSDoc for documentation purposes if needed:
// /** @typedef {import('path/to/your/src/types.js').SrgbColor} SrgbColor */