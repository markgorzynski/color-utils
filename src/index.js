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

// --- Gamut Management ---
export {
  // Validation
  isSrgbInGamut,
  isLabInTypicalRange,
  isOklabInTypicalRange,
  isValidSrgbObject,
  isValidLabObject,
  // Clamping and scaling
  clampSrgb,
  scaleToSrgbGamut,
  clamp,
  // Analysis
  getSrgbGamutInfo,
  getMaxChroma
} from './gamut.js';

// --- Chroma Control ---
export {
  findMaxAokChromaForLabL,
  adjustAokColorToLabL
} from './chromaControl.js';

// --- Display P3 Color Space ---
export {
  // Constants
  DISPLAY_P3_PRIMARIES,
  MATRIX_LINEAR_DISPLAY_P3_TO_XYZ_D65,
  MATRIX_XYZ_TO_LINEAR_DISPLAY_P3_D65,
  // Conversions
  displayP3ToLinearDisplayP3,
  linearDisplayP3ToDisplayP3,
  srgbToDisplayP3,
  displayP3ToSrgb,
  linearDisplayP3ToXyz,
  xyzToLinearDisplayP3,
  // Utilities
  isDisplayP3InSrgbGamut,
  benefitsFromDisplayP3,
  formatDisplayP3ForCSS,
  parseDisplayP3FromCSS
} from './display-p3.js';

// --- Gamut Mapping ---
export {
  // Gamut checking
  isInGamut,
  needsGamutMapping,
  getGamutVolumeRatio,
  // CSS Color 4 algorithm
  gamutMapOklch,
  gamutMapSrgb,
  // Alternative algorithms
  clipGamutMapping,
  cuspGamutMapping,
  adaptiveGamutMapping
} from './gamut-mapping.js';

// --- Chromatic Adaptation ---
export {
  // Illuminants
  ILLUMINANTS,
  // Main adaptation function
  chromaticAdaptation,
  // Common conversions
  xyzD65ToD50,
  xyzD50ToD65,
  // Utilities
  calculateCCT,
  getWhitePointFromTemperature,
  findClosestIlluminant,
  needsChromaticAdaptation
} from './chromatic-adaptation.js';

// --- CSS Color Module Level 4 Parsing ---
export {
  // Main parsing and formatting
  parseCSS,
  formatCSS
} from './css-color-parser.js';

// --- Rec. 2020 Color Space ---
export {
  // Constants
  REC2020_PRIMARIES,
  MATRIX_LINEAR_REC2020_TO_XYZ_D65,
  MATRIX_XYZ_TO_LINEAR_REC2020_D65,
  // Conversions
  rec2020ToLinearRec2020,
  linearRec2020ToRec2020,
  srgbToRec2020,
  rec2020ToSrgb,
  linearRec2020ToXyz,
  xyzToLinearRec2020,
  // Utilities
  isRec2020InSrgbGamut,
  benefitsFromRec2020,
  formatRec2020ForCSS,
  parseRec2020FromCSS,
  getRec2020GamutRatio
} from './rec2020.js';

// --- CAM16-UCS Uniform Color Space ---
export {
  // Conversions
  cam16ToUcs,
  ucsToCam16,
  srgbToCam16Ucs,
  cam16UcsToSrgb,
  // Polar coordinates
  ucsToPolar,
  polarToUcs,
  // Color difference
  cam16UcsColorDifference,
  calculateCam16UcsDifference,
  // Interpolation
  interpolateCam16Ucs,
  interpolateCam16UcsPolar,
  // Gradient generation
  generateCam16UcsGradient,
  // Color harmony
  findComplementaryCam16Ucs,
  generateAnalogousCam16Ucs,
  generateTriadicCam16Ucs
} from './cam16-ucs.js';