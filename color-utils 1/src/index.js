/**
 * @file src/index.js
 * @module color-utils
 * @description Main entry point for the color-utils library.
 * This file re-exports the primary public-facing functions and classes
 * from the various modules within the library, providing a consolidated API
 * for users.
 */

// Utility functions (generic helpers)
export {
  D65_WHITE_POINT_XYZ,
  degreesToRadians,
  radiansToDegrees,
  multiplyMatrixVector,
  signPreservingPow,
  clamp
} from './utils.js';

// sRGB color space conversions and utilities
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

// CIELAB and CIELCh color space conversions
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

// Oklab and OkLCh color space conversions
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

// Adaptive Oklab color model
export { AdaptiveOklab } from './aoklab.js';

// CIECAM16 color appearance model
export { srgbToCiecam16 } from './ciecam16.js';

// Color metrics and difference calculations
export {
  getSrgbRelativeLuminance,
  calculateWcagContrast,
  isWcagContrastSufficient,
  calculateCiede2000,
  calculateOklchDifference
} from './color-metrics.js';

// Chroma control functionalities
export {
  findMaxChromaForLabLightness,
  adjustOklchForLabLightness
} from './chromaControl.js';

// Type definitions will be in types.js and used via JSDoc/TypeScript,
// not typically re-exported directly in the main index.js for runtime use,
// unless they are classes or enums intended for runtime instantiation/checking.
// For JSDoc @typedefs, users would rely on their IDE's understanding or import
// them directly in their JSDoc if needed for their own documentation.
