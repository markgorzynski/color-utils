/**
 * @module color-metrics
 * @description Provides functions to calculate various color metrics, including
 * CIE Relative Luminance (Y) from sRGB, WCAG contrast ratio, CIEDE2000 color
 * difference (between Lab colors), and a perceptual difference metric for Oklch colors.
 */

/** @typedef {import('./types.js').SrgbColor} SrgbColor */
/** @typedef {import('./types.js').LinearSrgbColor} LinearSrgbColor */
/** @typedef {import('./types.js').LabColor} LabColor */
/** @typedef {import('./types.js').OklchColor} OklchColor */

import { degreesToRadians, radiansToDegrees, normalizeHue } from './utils.js';
import { parseSrgbHex, srgbToLinearSrgb } from './srgb.js';
import { srgbToLab } from './cielab.js';

// --- CIE Relative Luminance ---

/**
 * Calculates CIE relative luminance (Y) from Linear sRGB components.
 * Uses standard coefficients: Y = 0.2126*R_lin + 0.7152*G_lin + 0.0722*B_lin.
 * @private
 */
function calculateRelativeLuminanceFromLinearSrgb(linearSrgb) {
  return 0.2126 * linearSrgb.r + 0.7152 * linearSrgb.g + 0.0722 * linearSrgb.b;
}

/**
 * Calculates the CIE relative luminance (Y) of an sRGB color.
 * The input can be an SrgbColor object or a hex string.
 * @param {SrgbColor | string} colorInput - The sRGB color.
 * @returns {number} The CIE relative luminance (Y), ranging from 0 to 1.
 * @example
 * getSrgbRelativeLuminance("#FFFFFF"); // ≈ 1.0
 * getSrgbRelativeLuminance({ r: 0.5, g: 0.5, b: 0.5 }); // ≈ 0.214
 */
export function getSrgbRelativeLuminance(colorInput) {
  const srgb = typeof colorInput === 'string' 
    ? parseSrgbHex(colorInput) 
    : colorInput;
    
  const linearSrgb = srgbToLinearSrgb(srgb);
  return calculateRelativeLuminanceFromLinearSrgb(linearSrgb);
}

// --- WCAG Contrast Ratio ---

/**
 * Calculates the WCAG contrast ratio between two colors.
 * @param {SrgbColor | string} color1 - First color (sRGB object or hex string).
 * @param {SrgbColor | string} color2 - Second color (sRGB object or hex string).
 * @returns {number} The contrast ratio (≥1, with 21 being the maximum).
 * @example
 * calculateWcagContrast("#FFFFFF", "#000000"); // 21
 * calculateWcagContrast("#777777", "#FFFFFF"); // ~4.48
 */
export function calculateWcagContrast(color1, color2) {
  const l1 = getSrgbRelativeLuminance(color1);
  const l2 = getSrgbRelativeLuminance(color2);
  
  // Ensure lighter color is in numerator
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if the WCAG contrast ratio between two colors meets a specified level.
 * @param {SrgbColor | string} color1 - First color.
 * @param {SrgbColor | string} color2 - Second color.
 * @param {('AA'|'AA-large'|'AAA'|'AAA-large')} [level='AA'] - WCAG conformance level.
 * @returns {boolean} True if the contrast meets or exceeds the required level.
 */
export function isWcagContrastSufficient(color1, color2, level = 'AA') {
  const contrastRatio = calculateWcagContrast(color1, color2);
  
  const requiredRatios = {
    'AA': 4.5,
    'AA-large': 3,
    'AAA': 7,
    'AAA-large': 4.5
  };
  
  const required = requiredRatios[level];
  if (required === undefined) {
    throw new Error(`Invalid WCAG level: ${level}`);
  }
  
  return contrastRatio >= required;
}

// --- CIEDE2000 Color Difference (Optimized from abridged) ---

/**
 * Calculates the perceptual color difference between two CIELAB colors using CIEDE2000.
 * @param {LabColor} lab1 - First CIELAB color.
 * @param {LabColor} lab2 - Second CIELAB color.
 * @param {Object} [weights] - Optional weighting factors.
 * @param {number} [weights.kL=1] - Lightness weighting factor.
 * @param {number} [weights.kC=1] - Chroma weighting factor.
 * @param {number} [weights.kH=1] - Hue weighting factor.
 * @returns {number} The Delta E (ΔE₀₀) value.
 */
export function calculateCiede2000(lab1, lab2, weights = {}) {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;
  const { kL = 1, kC = 1, kH = 1 } = weights;
  
  // Calculate C1 and C2 (Chroma)
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const C_bar = (C1 + C2) / 2;
  
  // Calculate G
  const G = 0.5 * (1 - Math.sqrt(Math.pow(C_bar, 7) / (Math.pow(C_bar, 7) + Math.pow(25, 7))));
  
  // Calculate a' (a prime)
  const a1_prime = (1 + G) * a1;
  const a2_prime = (1 + G) * a2;
  
  // Calculate C' (C prime) and h' (h prime)
  const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
  const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);
  
  let h1_prime = radiansToDegrees(Math.atan2(b1, a1_prime));
  if (h1_prime < 0) h1_prime += 360;
  
  let h2_prime = radiansToDegrees(Math.atan2(b2, a2_prime));
  if (h2_prime < 0) h2_prime += 360;
  
  // Calculate deltas
  const delta_L_prime = L2 - L1;
  const delta_C_prime = C2_prime - C1_prime;
  
  let delta_h_prime;
  if (C1_prime * C2_prime === 0) {
    delta_h_prime = 0;
  } else if (Math.abs(h1_prime - h2_prime) <= 180) {
    delta_h_prime = h2_prime - h1_prime;
  } else {
    delta_h_prime = (h2_prime - h1_prime > 180) 
      ? (h2_prime - h1_prime - 360) 
      : (h2_prime - h1_prime + 360);
  }
  
  const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin(degreesToRadians(delta_h_prime) / 2);
  
  // Calculate averages
  const L_bar_prime = (L1 + L2) / 2;
  const C_bar_prime = (C1_prime + C2_prime) / 2;
  
  let h_bar_prime;
  if (C1_prime * C2_prime === 0) {
    h_bar_prime = h1_prime + h2_prime;
  } else if (Math.abs(h1_prime - h2_prime) <= 180) {
    h_bar_prime = (h1_prime + h2_prime) / 2;
  } else {
    h_bar_prime = (h1_prime + h2_prime < 360) 
      ? (h1_prime + h2_prime + 360) / 2 
      : (h1_prime + h2_prime - 360) / 2;
  }
  
  // Calculate T
  const T = 1 
    - 0.17 * Math.cos(degreesToRadians(h_bar_prime - 30))
    + 0.24 * Math.cos(degreesToRadians(2 * h_bar_prime))
    + 0.32 * Math.cos(degreesToRadians(3 * h_bar_prime + 6))
    - 0.20 * Math.cos(degreesToRadians(4 * h_bar_prime - 63));
  
  // Calculate RT (rotation term)
  const delta_theta = 30 * Math.exp(-Math.pow((h_bar_prime - 275) / 25, 2));
  const R_C = 2 * Math.sqrt(Math.pow(C_bar_prime, 7) / (Math.pow(C_bar_prime, 7) + Math.pow(25, 7)));
  const R_T = -R_C * Math.sin(degreesToRadians(2 * delta_theta));
  
  // Calculate SL, SC, SH (weighting functions)
  const S_L = 1 + (0.015 * Math.pow(L_bar_prime - 50, 2)) / Math.sqrt(20 + Math.pow(L_bar_prime - 50, 2));
  const S_C = 1 + 0.045 * C_bar_prime;
  const S_H = 1 + 0.015 * C_bar_prime * T;
  
  // Calculate final terms
  const L_term = delta_L_prime / (kL * S_L);
  const C_term = delta_C_prime / (kC * S_C);
  const H_term = delta_H_prime / (kH * S_H);
  
  // Calculate total color difference
  return Math.sqrt(
    Math.pow(L_term, 2) + 
    Math.pow(C_term, 2) + 
    Math.pow(H_term, 2) + 
    R_T * C_term * H_term
  );
}

// --- Oklch Color Difference ---

/**
 * Calculates a perceptual difference metric between two Oklch colors.
 * This is a simplified weighted Euclidean distance in the Oklch space.
 * @param {OklchColor} oklch1 - First Oklch color.
 * @param {OklchColor} oklch2 - Second Oklch color.
 * @param {Object} [weights] - Optional weighting factors.
 * @param {number} [weights.wL=1] - Lightness weight.
 * @param {number} [weights.wC=1] - Chroma weight.
 * @param {number} [weights.wH=0.5] - Hue weight (scaled by mean chroma).
 * @returns {number} The perceptual difference value.
 */
export function calculateOklchDifference(oklch1, oklch2, weights = {}) {
  const { L: L1, C: C1, h: h1 } = oklch1;
  const { L: L2, C: C2, h: h2 } = oklch2;
  const { wL = 1, wC = 1, wH = 0.5 } = weights;
  
  // Lightness difference
  const deltaL = L2 - L1;
  
  // Chroma difference
  const deltaC = C2 - C1;
  
  // Hue difference (considering circular nature)
  let deltaH = h2 - h1;
  if (deltaH > 180) deltaH -= 360;
  if (deltaH < -180) deltaH += 360;
  
  // Convert hue difference to perceptual units
  // Scale by mean chroma (more chromatic colors show hue differences more)
  const meanC = (C1 + C2) / 2;
  const deltaH_perceptual = meanC * degreesToRadians(deltaH);
  
  // Calculate weighted Euclidean distance
  return Math.sqrt(
    Math.pow(wL * deltaL, 2) +
    Math.pow(wC * deltaC, 2) +
    Math.pow(wH * deltaH_perceptual, 2)
  );
}