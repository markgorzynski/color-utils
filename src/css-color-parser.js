/**
 * @module css-color-parser
 * @description CSS Color Module Level 4 parsing and formatting utilities.
 * Supports modern CSS color syntax including color(), lab(), lch(), oklab(), oklch(),
 * and traditional formats (hex, rgb, hsl).
 * 
 * @see {@link https://www.w3.org/TR/css-color-4/}
 */

import { parseSrgbHex, formatSrgbAsHex } from './srgb.js';
import { labToSrgb, srgbToLab, lchToSrgb, srgbToLch } from './cielab.js';
import { oklabToSrgb, srgbToOklab, oklchToSrgb, srgbToOklch } from './oklab.js';
import { displayP3ToSrgb, srgbToDisplayP3 } from './display-p3.js';
import { clamp } from './utils.js';

/** @typedef {import('./types.js').SrgbColor} SrgbColor */

// --- CSS Color Parsing ---

/**
 * Parse any CSS color string to sRGB
 * Supports CSS Color Module Level 4 syntax
 * @param {string} cssString - CSS color string
 * @returns {SrgbColor|null} Parsed sRGB color or null if invalid
 * @example
 * parseCSS('rgb(255 0 0)') // { r: 1, g: 0, b: 0 }
 * parseCSS('#ff0000') // { r: 1, g: 0, b: 0 }
 * parseCSS('color(srgb 1 0 0)') // { r: 1, g: 0, b: 0 }
 * parseCSS('lab(50% 50 0)') // Converts Lab to sRGB
 * parseCSS('oklch(0.5 0.2 30deg)') // Converts OkLCh to sRGB
 */
export function parseCSS(cssString) {
  if (!cssString || typeof cssString !== 'string') return null;
  
  const trimmed = cssString.trim().toLowerCase();
  
  // Try hex first (most common)
  if (trimmed.startsWith('#')) {
    return parseSrgbHex(trimmed);
  }
  
  // Try named colors
  const namedColor = parseNamedColor(trimmed);
  if (namedColor) return namedColor;
  
  // Try functional notations
  if (trimmed.startsWith('rgb')) return parseRgb(trimmed);
  if (trimmed.startsWith('hsl')) return parseHsl(trimmed);
  if (trimmed.startsWith('lab')) return parseLab(trimmed);
  if (trimmed.startsWith('lch')) return parseLch(trimmed);
  if (trimmed.startsWith('oklab')) return parseOklab(trimmed);
  if (trimmed.startsWith('oklch')) return parseOklch(trimmed);
  if (trimmed.startsWith('color(')) return parseColorFunction(trimmed);
  
  return null;
}

/**
 * Parse rgb() or rgba() notation
 * @private
 */
function parseRgb(str) {
  // Match both legacy comma syntax and modern space syntax
  const match = str.match(/rgba?\s*\(\s*([^,)\s]+)\s*[\s,]\s*([^,)\s]+)\s*[\s,]\s*([^,)\s]+)\s*(?:[\s,/]\s*([^)]+))?\s*\)/);
  if (!match) return null;
  
  const r = parseColorValue(match[1], 255);
  const g = parseColorValue(match[2], 255);
  const b = parseColorValue(match[3], 255);
  // Alpha is ignored for now, returns opaque color
  
  if (r === null || g === null || b === null) return null;
  
  return { r, g, b };
}

/**
 * Parse hsl() or hsla() notation
 * @private
 */
function parseHsl(str) {
  const match = str.match(/hsla?\s*\(\s*([^,)\s]+)\s*[\s,]\s*([^,)\s]+)\s*[\s,]\s*([^,)\s]+)\s*(?:[\s,/]\s*([^)]+))?\s*\)/);
  if (!match) return null;
  
  const h = parseAngle(match[1]);
  const s = parsePercentage(match[2]);
  const l = parsePercentage(match[3]);
  
  if (h === null || s === null || l === null) return null;
  
  return hslToSrgb(h, s, l);
}

/**
 * Parse lab() notation
 * @private
 */
function parseLab(str) {
  const match = str.match(/lab\s*\(\s*([^)\s]+)\s+([^)\s]+)\s+([^)\s/]+)\s*(?:\/\s*([^)]+))?\s*\)/);
  if (!match) return null;
  
  const L = parsePercentage(match[1]) * 100; // L in [0, 100]
  const a = parseLabAxis(match[2], 125); // a in [-125, 125]
  const b = parseLabAxis(match[3], 125); // b in [-125, 125]
  
  if (L === null || a === null || b === null) return null;
  
  return labToSrgb({ L, a, b });
}

/**
 * Parse lch() notation
 * @private
 */
function parseLch(str) {
  const match = str.match(/lch\s*\(\s*([^)\s]+)\s+([^)\s]+)\s+([^)\s/]+)\s*(?:\/\s*([^)]+))?\s*\)/);
  if (!match) return null;
  
  const L = parsePercentage(match[1]) * 100; // L in [0, 100]
  const C = parseColorValue(match[2], 150); // C in [0, 150]
  const h = parseAngle(match[3]);
  
  if (L === null || C === null || h === null) return null;
  
  return lchToSrgb({ L, C, h });
}

/**
 * Parse oklab() notation
 * @private
 */
function parseOklab(str) {
  const match = str.match(/oklab\s*\(\s*([^)\s]+)\s+([^)\s]+)\s+([^)\s/]+)\s*(?:\/\s*([^)]+))?\s*\)/);
  if (!match) return null;
  
  const L = parsePercentage(match[1]); // L in [0, 1]
  const a = parseLabAxis(match[2], 0.4); // a in [-0.4, 0.4]
  const b = parseLabAxis(match[3], 0.4); // b in [-0.4, 0.4]
  
  if (L === null || a === null || b === null) return null;
  
  return oklabToSrgb({ L, a, b });
}

/**
 * Parse oklch() notation
 * @private
 */
function parseOklch(str) {
  const match = str.match(/oklch\s*\(\s*([^)\s]+)\s+([^)\s]+)\s+([^)\s/]+)\s*(?:\/\s*([^)]+))?\s*\)/);
  if (!match) return null;
  
  const L = parsePercentage(match[1]); // L in [0, 1]
  const C = parseColorValue(match[2], 0.4); // C in [0, 0.4]
  const h = parseAngle(match[3]);
  
  if (L === null || C === null || h === null) return null;
  
  return oklchToSrgb({ L, C, h });
}

/**
 * Parse color() function
 * @private
 */
function parseColorFunction(str) {
  const match = str.match(/color\(\s*([^)\s]+)\s+([^)\s]+)\s+([^)\s]+)\s+([^)\s/]+)\s*(?:\/\s*([^)]+))?\s*\)/);
  if (!match) return null;
  
  const space = match[1];
  const c1 = parseColorValue(match[2], 1);
  const c2 = parseColorValue(match[3], 1);
  const c3 = parseColorValue(match[4], 1);
  
  if (c1 === null || c2 === null || c3 === null) return null;
  
  switch (space) {
    case 'srgb':
      return { r: c1, g: c2, b: c3 };
    case 'display-p3':
      return displayP3ToSrgb({ r: c1, g: c2, b: c3 });
    case 'rec2020':
      // TODO: Implement Rec2020 support
      return null;
    case 'prophoto-rgb':
      // TODO: Implement ProPhoto support
      return null;
    default:
      return null;
  }
}

// --- CSS Color Formatting ---

/**
 * Format an sRGB color as CSS string
 * @param {SrgbColor} color - sRGB color
 * @param {string} [format='hex'] - Output format
 * @returns {string} CSS color string
 * @example
 * formatCSS({ r: 1, g: 0, b: 0 }, 'hex') // '#ff0000'
 * formatCSS({ r: 1, g: 0, b: 0 }, 'rgb') // 'rgb(255 0 0)'
 * formatCSS({ r: 1, g: 0, b: 0 }, 'hsl') // 'hsl(0deg 100% 50%)'
 */
export function formatCSS(color, format = 'hex') {
  switch (format) {
    case 'hex':
      return formatSrgbAsHex(color);
    case 'rgb':
      return formatRgb(color);
    case 'hsl':
      return formatHsl(color);
    case 'lab':
      return formatLab(color);
    case 'lch':
      return formatLch(color);
    case 'oklab':
      return formatOklab(color);
    case 'oklch':
      return formatOklch(color);
    case 'display-p3':
      return formatDisplayP3(color);
    default:
      return formatSrgbAsHex(color);
  }
}

/**
 * Format as rgb() notation
 * @private
 */
function formatRgb(color) {
  const r = Math.round(clamp(color.r, 0, 1) * 255);
  const g = Math.round(clamp(color.g, 0, 1) * 255);
  const b = Math.round(clamp(color.b, 0, 1) * 255);
  return `rgb(${r} ${g} ${b})`;
}

/**
 * Format as hsl() notation
 * @private
 */
function formatHsl(color) {
  const { h, s, l } = srgbToHsl(color);
  return `hsl(${h.toFixed(0)}deg ${(s * 100).toFixed(0)}% ${(l * 100).toFixed(0)}%)`;
}

/**
 * Format as lab() notation
 * @private
 */
function formatLab(color) {
  const lab = srgbToLab(color);
  return `lab(${(lab.L).toFixed(1)}% ${lab.a.toFixed(1)} ${lab.b.toFixed(1)})`;
}

/**
 * Format as lch() notation
 * @private
 */
function formatLch(color) {
  const lch = srgbToLch(color);
  return `lch(${(lch.L).toFixed(1)}% ${lch.C.toFixed(1)} ${lch.h.toFixed(0)}deg)`;
}

/**
 * Format as oklab() notation
 * @private
 */
function formatOklab(color) {
  const oklab = srgbToOklab(color);
  return `oklab(${(oklab.L * 100).toFixed(1)}% ${oklab.a.toFixed(3)} ${oklab.b.toFixed(3)})`;
}

/**
 * Format as oklch() notation
 * @private
 */
function formatOklch(color) {
  const oklch = srgbToOklch(color);
  return `oklch(${(oklch.L * 100).toFixed(1)}% ${oklch.C.toFixed(3)} ${oklch.h.toFixed(0)}deg)`;
}

/**
 * Format as color(display-p3) notation
 * @private
 */
function formatDisplayP3(color) {
  const p3 = srgbToDisplayP3(color);
  return `color(display-p3 ${p3.r.toFixed(4)} ${p3.g.toFixed(4)} ${p3.b.toFixed(4)})`;
}

// --- Utility Parsers ---

/**
 * Parse a color value (number or percentage)
 * @private
 */
function parseColorValue(str, max) {
  if (!str) return null;
  str = str.trim();
  
  if (str.endsWith('%')) {
    const val = parseFloat(str);
    if (isNaN(val)) return null;
    return val / 100;
  }
  
  const val = parseFloat(str);
  if (isNaN(val)) return null;
  return val / max;
}

/**
 * Parse a percentage value
 * @private
 */
function parsePercentage(str) {
  if (!str) return null;
  str = str.trim();
  
  if (str.endsWith('%')) {
    const val = parseFloat(str);
    if (isNaN(val)) return null;
    return val / 100;
  }
  
  // If no %, assume it's already normalized
  const val = parseFloat(str);
  if (isNaN(val)) return null;
  return val;
}

/**
 * Parse an angle value (degrees, radians, gradians, turns)
 * @private
 */
function parseAngle(str) {
  if (!str) return null;
  str = str.trim();
  
  if (str === 'none') return 0;
  
  if (str.endsWith('deg')) {
    const val = parseFloat(str);
    return isNaN(val) ? null : val;
  }
  
  if (str.endsWith('rad')) {
    const val = parseFloat(str);
    return isNaN(val) ? null : val * 180 / Math.PI;
  }
  
  if (str.endsWith('grad')) {
    const val = parseFloat(str);
    return isNaN(val) ? null : val * 0.9;
  }
  
  if (str.endsWith('turn')) {
    const val = parseFloat(str);
    return isNaN(val) ? null : val * 360;
  }
  
  // Default to degrees
  const val = parseFloat(str);
  return isNaN(val) ? null : val;
}

/**
 * Parse a Lab axis value (can be percentage or number)
 * @private
 */
function parseLabAxis(str, max) {
  if (!str) return null;
  str = str.trim();
  
  if (str.endsWith('%')) {
    const val = parseFloat(str);
    if (isNaN(val)) return null;
    // Percentage maps to [-max, max]
    return (val / 100) * max;
  }
  
  const val = parseFloat(str);
  return isNaN(val) ? null : val;
}

/**
 * Convert HSL to sRGB
 * @private
 */
function hslToSrgb(h, s, l) {
  h = h % 360;
  if (h < 0) h += 360;
  h = h / 360;
  
  if (s === 0) {
    return { r: l, g: l, b: l };
  }
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  const hueToRgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  return {
    r: hueToRgb(p, q, h + 1/3),
    g: hueToRgb(p, q, h),
    b: hueToRgb(p, q, h - 1/3)
  };
}

/**
 * Convert sRGB to HSL
 * @private
 */
function srgbToHsl(color) {
  const r = color.r;
  const g = color.g;
  const b = color.b;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return { h: 0, s: 0, l };
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }
  
  return { h: h * 360, s, l };
}

/**
 * Parse CSS named colors
 * @private
 */
function parseNamedColor(name) {
  // CSS Level 1 colors
  const colors = {
    'black': { r: 0, g: 0, b: 0 },
    'silver': { r: 0.75, g: 0.75, b: 0.75 },
    'gray': { r: 0.5, g: 0.5, b: 0.5 },
    'white': { r: 1, g: 1, b: 1 },
    'maroon': { r: 0.5, g: 0, b: 0 },
    'red': { r: 1, g: 0, b: 0 },
    'purple': { r: 0.5, g: 0, b: 0.5 },
    'fuchsia': { r: 1, g: 0, b: 1 },
    'green': { r: 0, g: 0.5, b: 0 },
    'lime': { r: 0, g: 1, b: 0 },
    'olive': { r: 0.5, g: 0.5, b: 0 },
    'yellow': { r: 1, g: 1, b: 0 },
    'navy': { r: 0, g: 0, b: 0.5 },
    'blue': { r: 0, g: 0, b: 1 },
    'teal': { r: 0, g: 0.5, b: 0.5 },
    'aqua': { r: 0, g: 1, b: 1 },
    'transparent': { r: 0, g: 0, b: 0 },
    // Add more as needed
  };
  
  return colors[name] || null;
}