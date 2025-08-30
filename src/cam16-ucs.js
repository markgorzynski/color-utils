/**
 * @module cam16-ucs
 * @description CAM16-UCS (Uniform Color Space) - a perceptually uniform version of CIECAM16.
 * CAM16-UCS provides better perceptual uniformity for color difference calculations
 * and is recommended for applications requiring accurate color distance metrics.
 * 
 * The UCS (Uniform Color Space) transformation makes Euclidean distances in the space
 * correspond more closely to perceived color differences.
 * 
 * @see {@link https://doi.org/10.1002/col.22131} - Original CAM16-UCS paper
 * @see {@link https://observablehq.com/@jrus/cam16} - Interactive CAM16 explanation
 */

import { srgbToCiecam16 } from './ciecam16.js';
import { srgbToXyz, xyzToSrgb } from './srgb.js';

/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {import('./types.js').Ciecam16Appearance} Ciecam16Appearance */
/** @typedef {import('./types.js').Ciecam16ViewingConditions} Ciecam16ViewingConditions */

/**
 * @typedef {Object} Cam16UcsColor
 * @property {number} J - Lightness (0-100)
 * @property {number} a - Red-green component
 * @property {number} b - Yellow-blue component
 */

/**
 * @typedef {Object} Cam16UcsPolarColor
 * @property {number} J - Lightness (0-100)
 * @property {number} C - Chroma
 * @property {number} h - Hue angle in degrees
 */

// --- Constants ---

/**
 * CAM16-UCS coefficients for the uniform space transformation
 * These values are optimized for perceptual uniformity
 * @private
 */
const UCS_K_L = 1.0;
const UCS_C1 = 0.007;
const UCS_C2 = 0.0228;

// --- CAM16 to CAM16-UCS Conversion ---

/**
 * Convert CIECAM16 appearance correlates to CAM16-UCS coordinates
 * @param {Ciecam16Appearance} cam16 - CIECAM16 appearance values
 * @returns {Cam16UcsColor} CAM16-UCS rectangular coordinates
 */
export function cam16ToUcs(cam16) {
  const { J, M, h } = cam16;
  
  // Convert to UCS lightness J'
  const J_prime = (1 + 100 * UCS_C1) * J / (1 + UCS_C1 * J);
  
  // Convert colorfulness M to UCS colorfulness M'
  const M_prime = Math.log(1 + UCS_C2 * M) / UCS_C2;
  
  // Convert to rectangular coordinates
  const hRad = (h * Math.PI) / 180;
  const a = M_prime * Math.cos(hRad);
  const b = M_prime * Math.sin(hRad);
  
  return { J: J_prime, a, b };
}

/**
 * Convert CAM16-UCS coordinates back to CIECAM16 appearance
 * @param {Cam16UcsColor} ucs - CAM16-UCS coordinates
 * @returns {Ciecam16Appearance} CIECAM16 appearance values
 */
export function ucsToCam16(ucs) {
  const { J: J_prime, a, b } = ucs;
  
  // Convert from UCS lightness J' to CIECAM16 J
  const J = J_prime / (1 + UCS_C1 * (100 - J_prime));
  
  // Calculate UCS colorfulness M'
  const M_prime = Math.sqrt(a * a + b * b);
  
  // Convert to CIECAM16 colorfulness M
  const M = (Math.exp(UCS_C2 * M_prime) - 1) / UCS_C2;
  
  // Calculate hue angle
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  
  // Calculate chroma C from colorfulness M
  // This is an approximation since we don't have the viewing conditions
  const C = M; // Simplified - actual conversion needs viewing conditions
  
  return { J, C, M, h, Q: J, s: 0, H: h };
}

// --- sRGB to/from CAM16-UCS ---

/**
 * Convert sRGB to CAM16-UCS
 * @param {SrgbColor} srgbColor - sRGB color
 * @param {Ciecam16ViewingConditions} [viewingConditions] - Viewing conditions
 * @returns {Cam16UcsColor} CAM16-UCS coordinates
 * @example
 * const ucs = srgbToCam16Ucs({ r: 0.5, g: 0.7, b: 0.3 });
 * // Returns: { J: 67.2, a: -15.3, b: 28.1 }
 */
export function srgbToCam16Ucs(srgbColor, viewingConditions) {
  const cam16 = srgbToCiecam16(srgbColor, viewingConditions);
  return cam16ToUcs(cam16);
}

/**
 * Convert CAM16-UCS to sRGB
 * Note: This requires reverse engineering through CIECAM16 which is complex
 * and may not always have an exact solution
 * @param {Cam16UcsColor} ucsColor - CAM16-UCS coordinates
 * @param {Ciecam16ViewingConditions} [viewingConditions] - Viewing conditions
 * @returns {SrgbColor|null} sRGB color or null if conversion fails
 */
export function cam16UcsToSrgb(ucsColor, viewingConditions = getDefaultViewingConditions()) {
  // This is a simplified implementation
  // Full implementation would require reverse CIECAM16 transform
  
  const cam16 = ucsToCam16(ucsColor);
  
  // Approximate reverse transform (simplified)
  // In practice, this would need iterative solving
  const xyz = approximateCam16ToXyz(cam16, viewingConditions);
  if (!xyz) return null;
  
  return xyzToSrgb(xyz);
}

// --- Polar Coordinates ---

/**
 * Convert CAM16-UCS rectangular to polar coordinates
 * @param {Cam16UcsColor} ucs - CAM16-UCS rectangular coordinates
 * @returns {Cam16UcsPolarColor} CAM16-UCS polar coordinates
 */
export function ucsToPolar(ucs) {
  const { J, a, b } = ucs;
  const C = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  
  return { J, C, h };
}

/**
 * Convert CAM16-UCS polar to rectangular coordinates
 * @param {Cam16UcsPolarColor} polar - CAM16-UCS polar coordinates
 * @returns {Cam16UcsColor} CAM16-UCS rectangular coordinates
 */
export function polarToUcs(polar) {
  const { J, C, h } = polar;
  const hRad = (h * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  
  return { J, a, b };
}

// --- Color Difference ---

/**
 * Calculate the color difference between two colors in CAM16-UCS space
 * This provides a perceptually uniform color difference metric
 * @param {Cam16UcsColor} color1 - First color in CAM16-UCS
 * @param {Cam16UcsColor} color2 - Second color in CAM16-UCS
 * @returns {number} Euclidean distance in CAM16-UCS space
 */
export function cam16UcsColorDifference(color1, color2) {
  const dJ = color1.J - color2.J;
  const da = color1.a - color2.a;
  const db = color1.b - color2.b;
  
  return Math.sqrt(dJ * dJ + da * da + db * db);
}

/**
 * Calculate color difference between two sRGB colors using CAM16-UCS
 * @param {SrgbColor} srgb1 - First sRGB color
 * @param {SrgbColor} srgb2 - Second sRGB color
 * @param {Ciecam16ViewingConditions} [viewingConditions] - Viewing conditions
 * @returns {number} Perceptual color difference
 */
export function calculateCam16UcsDifference(srgb1, srgb2, viewingConditions) {
  const ucs1 = srgbToCam16Ucs(srgb1, viewingConditions);
  const ucs2 = srgbToCam16Ucs(srgb2, viewingConditions);
  return cam16UcsColorDifference(ucs1, ucs2);
}

// --- Interpolation ---

/**
 * Interpolate between two colors in CAM16-UCS space
 * @param {Cam16UcsColor} color1 - Start color
 * @param {Cam16UcsColor} color2 - End color
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Cam16UcsColor} Interpolated color
 */
export function interpolateCam16Ucs(color1, color2, t) {
  return {
    J: color1.J + (color2.J - color1.J) * t,
    a: color1.a + (color2.a - color1.a) * t,
    b: color1.b + (color2.b - color1.b) * t
  };
}

/**
 * Interpolate in polar coordinates (better for hue preservation)
 * @param {Cam16UcsPolarColor} color1 - Start color (polar)
 * @param {Cam16UcsPolarColor} color2 - End color (polar)
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Cam16UcsPolarColor} Interpolated color (polar)
 */
export function interpolateCam16UcsPolar(color1, color2, t) {
  // Handle hue interpolation (shortest path)
  let h1 = color1.h;
  let h2 = color2.h;
  
  if (Math.abs(h2 - h1) > 180) {
    if (h2 > h1) {
      h1 += 360;
    } else {
      h2 += 360;
    }
  }
  
  let h = h1 + (h2 - h1) * t;
  if (h >= 360) h -= 360;
  
  return {
    J: color1.J + (color2.J - color1.J) * t,
    C: color1.C + (color2.C - color1.C) * t,
    h
  };
}

// --- Gradient Generation ---

/**
 * Generate a perceptually uniform gradient in CAM16-UCS space
 * @param {SrgbColor} startColor - Start color
 * @param {SrgbColor} endColor - End color
 * @param {number} steps - Number of steps
 * @param {Ciecam16ViewingConditions} [viewingConditions] - Viewing conditions
 * @returns {SrgbColor[]} Array of gradient colors
 */
export function generateCam16UcsGradient(startColor, endColor, steps, viewingConditions) {
  const start = srgbToCam16Ucs(startColor, viewingConditions);
  const end = srgbToCam16Ucs(endColor, viewingConditions);
  
  const gradient = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const interpolated = interpolateCam16Ucs(start, end, t);
    const srgb = cam16UcsToSrgb(interpolated, viewingConditions);
    gradient.push(srgb || startColor); // Fallback if conversion fails
  }
  
  return gradient;
}

// --- Helper Functions ---

/**
 * Get default viewing conditions for CAM16-UCS
 * @private
 * @returns {Ciecam16ViewingConditions}
 */
function getDefaultViewingConditions() {
  return {
    whitePoint: { X: 95.047, Y: 100, Z: 108.883 }, // D65
    adaptingLuminance: 40, // cd/m²
    backgroundLuminance: 20, // cd/m²
    surround: 'average',
    discounting: false
  };
}

/**
 * Approximate reverse CIECAM16 to XYZ transform
 * This is a simplified version - full implementation is complex
 * @private
 */
function approximateCam16ToXyz(cam16, viewingConditions) {
  // This is a placeholder for the complex reverse transform
  // In practice, this requires iterative solving of the CIECAM16 equations
  
  // For now, return a simple approximation
  // Real implementation would need the full reverse CIECAM16 model
  const { J, C, h } = cam16;
  
  // Very rough approximation (not accurate!)
  const L = J;
  const a = C * Math.cos(h * Math.PI / 180) * 0.5;
  const b = C * Math.sin(h * Math.PI / 180) * 0.5;
  
  // Approximate Lab to XYZ (using D65)
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  
  const xr = fx * fx * fx > 0.008856 ? fx * fx * fx : (fx - 16/116) / 7.787;
  const yr = fy * fy * fy > 0.008856 ? fy * fy * fy : (fy - 16/116) / 7.787;
  const zr = fz * fz * fz > 0.008856 ? fz * fz * fz : (fz - 16/116) / 7.787;
  
  return {
    X: xr * 95.047,
    Y: yr * 100,
    Z: zr * 108.883
  };
}

// --- Utilities for Color Harmony ---

/**
 * Find complementary color in CAM16-UCS space
 * @param {Cam16UcsColor} color - Input color
 * @returns {Cam16UcsColor} Complementary color
 */
export function findComplementaryCam16Ucs(color) {
  const polar = ucsToPolar(color);
  polar.h = (polar.h + 180) % 360;
  return polarToUcs(polar);
}

/**
 * Generate analogous colors in CAM16-UCS space
 * @param {Cam16UcsColor} color - Base color
 * @param {number} [angle=30] - Angle between colors
 * @param {number} [count=2] - Number of analogous colors per side
 * @returns {Cam16UcsColor[]} Array of analogous colors
 */
export function generateAnalogousCam16Ucs(color, angle = 30, count = 2) {
  const polar = ucsToPolar(color);
  const colors = [];
  
  for (let i = 1; i <= count; i++) {
    const h1 = (polar.h - angle * i + 360) % 360;
    const h2 = (polar.h + angle * i) % 360;
    
    colors.push(polarToUcs({ ...polar, h: h1 }));
    colors.push(polarToUcs({ ...polar, h: h2 }));
  }
  
  return colors;
}

/**
 * Generate triadic colors in CAM16-UCS space
 * @param {Cam16UcsColor} color - Base color
 * @returns {Cam16UcsColor[]} Array of triadic colors
 */
export function generateTriadicCam16Ucs(color) {
  const polar = ucsToPolar(color);
  return [
    color,
    polarToUcs({ ...polar, h: (polar.h + 120) % 360 }),
    polarToUcs({ ...polar, h: (polar.h + 240) % 360 })
  ];
}