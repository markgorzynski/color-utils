/**
 * @file src/index.js
 * @module color-utils
 * @description Main entry point for the color-utils library.
 * This file re-exports the primary public-facing functions, classes,
 * and constants from the various modules within the library.
 */

// --- Type Definitions ---
// Re-export all types for TypeScript/JSDoc support
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
/** @typedef {import('./types.js').AokChromaControlOptions} AokChromaControlOptions */
/** @typedef {import('./types.js').AdjustAokColorOptions} AdjustAokColorOptions */
/** @typedef {import('./types.js').AokChromaControlResult} AokChromaControlResult */

// --- Utility Functions ---
export {
  // Constants
  D65_WHITE_POINT_XYZ,
  // Angle conversions
  degreesToRadians,
  radiansToDegrees,
  // Math utilities
  multiplyMatrixVector,
  signPreservingPow,
  clamp,
  lerp,
  normalizeHue
} from './utils.js';

// --- sRGB Color Space ---
export {
  // Gamma correction
  srgbToLinearSrgb,
  linearSrgbToSrgb,
  // XYZ conversions
  linearSrgbToXyz,
  xyzToLinearSrgb,
  srgbToXyz,
  xyzToSrgb,
  // Hex utilities
  parseSrgbHex,
  formatSrgbAsHex,
  isSrgbInGamut,
  // Matrix constants (for advanced use)
  MATRIX_LINEAR_SRGB_TO_XYZ_D65,
  MATRIX_XYZ_TO_LINEAR_SRGB_D65
} from './srgb.js';

// --- CIELAB and CIELCh Color Spaces ---
export {
  // XYZ ↔ Lab
  xyzToLab,
  labToXyz,
  // Lab ↔ LCh
  labToLch,
  lchToLab,
  // sRGB ↔ Lab
  srgbToLab,
  labToSrgb,
  // sRGB ↔ LCh
  srgbToLch,
  lchToSrgb
} from './cielab.js';

// --- Oklab and OkLCh Color Spaces ---
export {
  // Linear sRGB ↔ Oklab
  linearSrgbToOklab,
  oklabToLinearSrgb,
  // Oklab ↔ OkLCh
  oklabToOklch,
  oklchToOklab,
  // sRGB ↔ Oklab
  srgbToOklab,
  oklabToSrgb,
  // sRGB ↔ OkLCh
  srgbToOklch,
  oklchToSrgb
} from './oklab.js';

// --- Adaptive Oklab ---
export { 
  AdaptiveOklab 
} from './aoklab.js';

// --- CIECAM16 Color Appearance Model ---
export { 
  srgbToCiecam16 
} from './ciecam16.js';

// --- Color Metrics ---
export {
  // Luminance and contrast
  getSrgbRelativeLuminance,
  calculateWcagContrast,
  isWcagContrastSufficient,
  // Color difference
  calculateCiede2000,
  calculateOklchDifference
} from './color-metrics.js';

// --- Chroma Control ---
export {
  findMaxAokChromaForLabL,
  adjustAokColorToLabL
} from './chromaControl.js';