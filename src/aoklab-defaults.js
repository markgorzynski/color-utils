/**
 * @file src/aoklab-defaults.js
 * @module color-utils/aoklab-defaults
 * @description Default presets for Adaptive Oklab based on empirical testing.
 * 
 * These presets were derived through perceptual matching experiments where
 * Aoklab grayscale ramps were calibrated to match CIELAB under mid-gray
 * surround conditions, then extended to other viewing conditions.
 * 
 * The key insight: Oklab is optimized for dark viewing, so it requires
 * significant shadow lifting to match perception under brighter surrounds.
 */

import { AdaptiveOklab } from './aoklab.js';

/**
 * Default tone mapping presets for different surround conditions.
 * Based on empirical testing to achieve perceptual uniformity.
 * All surrounds require maximum shadow lifting (sigmoid = 1.0) to properly
 * separate dark tones when adapting from Oklab's dark-optimized baseline.
 * 
 * @type {Object.<string, Object>}
 */
export const AOKLAB_PRESETS = {
  /**
   * Black surround (cinema/dark room viewing)
   * Slight darkening with full shadow lift
   * The strong sigmoid allows overall darkening while maintaining shadow separation
   */
  black: {
    surround: 'black',
    toneMapping: {
      gammaAdjustment: 0.05,  // γ = 1.05 (slight darkening)
      sigmoidStrength: 1.0    // Maximum shadow lift
    }
  },
  
  /**
   * Dark gray surround (dim room)
   * More darkening with full shadow lift
   */
  dark: {
    surround: 'dark',
    toneMapping: {
      gammaAdjustment: 0.1,   // γ = 1.1 (darkening)
      sigmoidStrength: 1.0    // Maximum shadow lift
    }
  },
  
  /**
   * Mid-gray surround (typical office/studio)
   * Calibrated to match CIELAB perception
   * Moderate lightening with full shadow lift
   */
  gray: {
    surround: 'gray',
    toneMapping: {
      gammaAdjustment: -0.15, // γ = 0.85
      sigmoidStrength: 1.0    // Maximum shadow lift
    }
  },
  
  /**
   * Light gray surround (bright room)
   * More lightening with full shadow lift
   */
  light: {
    surround: 'light',
    toneMapping: {
      gammaAdjustment: -0.2,  // γ = 0.8
      sigmoidStrength: 1.0    // Maximum shadow lift
    }
  },
  
  /**
   * White surround (outdoor/bright display)
   * Significant lightening with full shadow lift
   */
  white: {
    surround: 'white',
    toneMapping: {
      gammaAdjustment: -0.25, // γ = 0.75
      sigmoidStrength: 1.0    // Maximum shadow lift
    }
  }
};

/**
 * Simple presets without sigmoid enhancement
 * For users who prefer gamma-only adjustment
 */
export const AOKLAB_SIMPLE_PRESETS = {
  black: { surround: 'black' },
  dark: { surround: 'dark' },
  gray: { surround: 'gray' },
  light: { surround: 'light' },
  white: { surround: 'white' }
};

/**
 * Factory function to create an AdaptiveOklab instance with preset configuration
 * @param {('black'|'dark'|'gray'|'light'|'white')} surroundType - The viewing surround condition
 * @param {boolean} [useAdvanced=true] - Whether to use advanced tone mapping (with sigmoid)
 * @returns {AdaptiveOklab} Configured AdaptiveOklab instance
 * @throws {Error} If surroundType is not recognized
 * 
 * @example
 * // Create instance for gray surround with full tone mapping
 * const aokGray = createAoklabForSurround('gray');
 * const labColor = aokGray.fromHex('#336699');
 * 
 * @example
 * // Create instance with simple gamma-only adjustment
 * const aokSimple = createAoklabForSurround('white', false);
 */
export function createAoklabForSurround(surroundType, useAdvanced = true) {
  const presets = useAdvanced ? AOKLAB_PRESETS : AOKLAB_SIMPLE_PRESETS;
  
  if (!presets[surroundType]) {
    throw new Error(`Unknown surround type: ${surroundType}. Valid options are: black, dark, gray, light, white`);
  }
  
  return new AdaptiveOklab(presets[surroundType]);
}

/**
 * Get recommended preset based on ambient light sensor or user preference
 * @param {number} lux - Ambient light level in lux (0-10000+)
 * @returns {string} Recommended surround type
 * 
 * @example
 * // Use with ambient light sensor
 * const lux = await getAmbientLight(); // Your sensor API
 * const surround = getRecommendedSurround(lux);
 * const aok = createAoklabForSurround(surround);
 */
export function getRecommendedSurround(lux) {
  if (lux < 10) return 'black';       // Very dark (cinema)
  if (lux < 50) return 'dark';        // Dim room
  if (lux < 300) return 'gray';       // Office lighting
  if (lux < 1000) return 'light';     // Bright room
  return 'white';                      // Outdoor/very bright
}

/**
 * Export configuration for saving user preferences
 * @param {AdaptiveOklab} instance - The configured instance
 * @returns {Object} Serializable configuration object
 */
export function exportConfig(instance) {
  return {
    surround: instance.surround,
    toneMapping: instance._toneMapping,
    x0: instance._x0
  };
}

/**
 * Create instance from saved configuration
 * @param {Object} config - Previously exported configuration
 * @returns {AdaptiveOklab} Restored instance
 */
export function createFromConfig(config) {
  return new AdaptiveOklab(config);
}