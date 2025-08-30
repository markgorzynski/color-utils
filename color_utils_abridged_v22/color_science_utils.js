/**
 * @file color_science_utils.js
 * @description A library of pure, low-level functions for generic color science calculations.
 */

// --- CONSTANTS ---
export const CS_D65_WHITE_POINT_XYZ = Object.freeze({ X: 95.047, Y: 100.0, Z: 108.883 });
export const CS_MATRIX_LINEAR_SRGB_TO_XYZ_D65 = Object.freeze([
  Object.freeze([0.4124564, 0.3575761, 0.1804375]),
  Object.freeze([0.2126729, 0.7151522, 0.0721750]),
  Object.freeze([0.0193339, 0.1191920, 0.9503041]),
]);
export const CS_MATRIX_XYZ_TO_LINEAR_SRGB_D65 = Object.freeze([
  Object.freeze([3.2404542, -1.5371385, -0.4985314]),
  Object.freeze([-0.9692660, 1.8760108, 0.0415560]),
  Object.freeze([0.0556434, -0.2040259, 1.0572252]),
]);
export const CS_DELTA_CIELAB = 6 / 29;
export const CS_DELTA_CUBED_CIELAB = Math.pow(CS_DELTA_CIELAB, 3);

// --- INTERNAL HELPERS ---
function _cs_degreesToRadians(degrees) { return degrees * (Math.PI / 180); }
function _cs_radiansToDegrees(radians) { return radians * (180 / Math.PI); }
function _cs_clamp(value, min, max) { return Math.max(min, Math.min(value, max)); }
function _cs_multiplyMatrixVector(m, v) { return [ m[0][0]*v[0]+m[0][1]*v[1]+m[0][2]*v[2], m[1][0]*v[0]+m[1][1]*v[1]+m[1][2]*v[2], m[2][0]*v[0]+m[2][1]*v[1]+m[2][2]*v[2] ]; }
function _cs_srgbChannelToLinear(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function _cs_linearChannelToSrgb(c) { return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
function _cs_cielabForwardTransform(t) { return t > CS_DELTA_CUBED_CIELAB ? Math.cbrt(t) : (t / (3 * CS_DELTA_CIELAB * CS_DELTA_CIELAB)) + (4 / 29); }
function _cs_cielabInverseTransform(t) { return t > CS_DELTA_CIELAB ? Math.pow(t, 3) : (3 * CS_DELTA_CIELAB * CS_DELTA_CIELAB) * (t - (4 / 29)); }

// --- PUBLIC API ---

/**
 * Parses a hex color string to normalized sRGB object
 * @param {string} hexStr - Hex color string with or without '#' prefix
 * @returns {{r: number, g: number, b: number}} sRGB color with values 0-1
 */
export function csParseSrgbHex(hexStr) {
  if (typeof hexStr !== 'string') throw new TypeError('Input hexString must be a string.');
  const hex = hexStr.startsWith('#') ? hexStr.slice(1) : hexStr;
  if (!/^(?:[0-9a-fA-F]{3}){1,2}$/.test(hex)) {
    throw new SyntaxError(`Invalid hex color string format: "${hexStr}"`);
  }
  let r, g, b;
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  return { r: r / 255, g: g / 255, b: b / 255 };
}

/**
 * Formats an sRGB object as uppercase hex string
 * @param {{r: number, g: number, b: number}} srgb - sRGB color with values 0-1
 * @returns {string} Hex color string like "#FF00FF"
 */
export function csFormatSrgbAsHex(srgb) {
  if (typeof srgb !== 'object' || srgb === null ||
      typeof srgb.r !== 'number' || typeof srgb.g !== 'number' || typeof srgb.b !== 'number') {
    throw new TypeError('Input srgbColor must be an object with r, g, b number properties.');
  }
  const toHexPart = (channelValue) => {
    const clampedValue = _cs_clamp(channelValue, 0, 1);
    const intValue = Math.round(clampedValue * 255);
    const hexPart = intValue.toString(16);
    return hexPart.length === 1 ? '0' + hexPart : hexPart;
  };
  return `#${toHexPart(srgb.r)}${toHexPart(srgb.g)}${toHexPart(srgb.b)}`.toUpperCase();
}

export function csIsSRGBInGamut(srgb) { 
  const e = 0.005; 
  return srgb.r >= -e && srgb.r <= 1+e && srgb.g >= -e && srgb.g <= 1+e && srgb.b >= -e && srgb.b <= 1+e; 
}

export function csSrgbToLab(srgb) {
  const lin = { r: _cs_srgbChannelToLinear(srgb.r), g: _cs_srgbChannelToLinear(srgb.g), b: _cs_srgbChannelToLinear(srgb.b) };
  const [x,y,z] = _cs_multiplyMatrixVector(CS_MATRIX_LINEAR_SRGB_TO_XYZ_D65, [lin.r * 100, lin.g * 100, lin.b * 100]);
  const fy = _cs_cielabForwardTransform(y / CS_D65_WHITE_POINT_XYZ.Y);
  return { L: 116*fy-16, a: 500*(_cs_cielabForwardTransform(x / CS_D65_WHITE_POINT_XYZ.X) - fy), b: 200*(fy - _cs_cielabForwardTransform(z / CS_D65_WHITE_POINT_XYZ.Z)) };
}

export function csLabToSrgb(lab) {
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;
  const x = _cs_cielabInverseTransform(fx) * CS_D65_WHITE_POINT_XYZ.X;
  const y = _cs_cielabInverseTransform(fy) * CS_D65_WHITE_POINT_XYZ.Y;
  const z = _cs_cielabInverseTransform(fz) * CS_D65_WHITE_POINT_XYZ.Z;
  const [r,g,b] = _cs_multiplyMatrixVector(CS_MATRIX_XYZ_TO_LINEAR_SRGB_D65, [x, y, z]);
  return { r: _cs_linearChannelToSrgb(r / 100), g: _cs_linearChannelToSrgb(g / 100), b: _cs_linearChannelToSrgb(b / 100) };
}

export function csSrgbToLch(srgb) {
  const lab = csSrgbToLab(srgb);
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = _cs_radiansToDegrees(Math.atan2(lab.b, lab.a));
  if (h < 0) h += 360;
  return { L: lab.L, C, h };
}

export function csLchToSrgb(lch) {
  const h_rad = _cs_degreesToRadians(lch.h);
  return csLabToSrgb({ L: lch.L, a: lch.C * Math.cos(h_rad), b: lch.C * Math.sin(h_rad) });
}

export function csGetSrgbRelativeLuminance(colorInput) {
    const srgb = typeof colorInput === 'string' ? csParseSrgbHex(colorInput) : colorInput;
    const lin = {r: _cs_srgbChannelToLinear(srgb.r), g: _cs_srgbChannelToLinear(srgb.g), b: _cs_srgbChannelToLinear(srgb.b)};
    return 0.2126 * lin.r + 0.7152 * lin.g + 0.0722 * lin.b;
}

export function csCalculateWcagContrast(color1, color2) {
    const l1 = csGetSrgbRelativeLuminance(color1);
    const l2 = csGetSrgbRelativeLuminance(color2);
    const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (light + 0.05) / (dark + 0.05);
}

/**
 * Calculates the perceptual color difference between two CIELAB colors using the CIEDE2000 formula.
 * @param {{L: number, a: number, b: number}} lab1 The first CIELAB color.
 * @param {{L: number, a: number, b: number}} lab2 The second CIELAB color.
 * @returns {number} The Delta E (ΔE₀₀) value.
 */
export function csCalculateCiede2000(lab1, lab2) {
    const { L: L1, a: a1, b: b1 } = lab1;
    const { L: L2, a: a2, b: b2 } = lab2;
    const kL = 1, kC = 1, kH = 1;

    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const C_bar = (C1 + C2) / 2;

    const G = 0.5 * (1 - Math.sqrt(Math.pow(C_bar, 7) / (Math.pow(C_bar, 7) + Math.pow(25, 7))));
    const a1_prime = (1 + G) * a1;
    const a2_prime = (1 + G) * a2;

    const C1_prime = Math.sqrt(a1_prime * a1_prime + b1 * b1);
    const C2_prime = Math.sqrt(a2_prime * a2_prime + b2 * b2);

    let h1_prime = _cs_radiansToDegrees(Math.atan2(b1, a1_prime));
    if (h1_prime < 0) h1_prime += 360;
    let h2_prime = _cs_radiansToDegrees(Math.atan2(b2, a2_prime));
    if (h2_prime < 0) h2_prime += 360;

    const delta_L_prime = L2 - L1;
    const delta_C_prime = C2_prime - C1_prime;
    
    let delta_h_prime;
    if (C1_prime * C2_prime === 0) {
        delta_h_prime = 0;
    } else if (Math.abs(h1_prime - h2_prime) <= 180) {
        delta_h_prime = h2_prime - h1_prime;
    } else {
        delta_h_prime = (h2_prime - h1_prime > 180) ? (h2_prime - h1_prime - 360) : (h2_prime - h1_prime + 360);
    }
    
    const delta_H_prime = 2 * Math.sqrt(C1_prime * C2_prime) * Math.sin(_cs_degreesToRadians(delta_h_prime) / 2);

    const L_bar_prime = (L1 + L2) / 2;
    const C_bar_prime = (C1_prime + C2_prime) / 2;

    let h_bar_prime;
    if (C1_prime * C2_prime === 0) {
        h_bar_prime = h1_prime + h2_prime;
    } else if (Math.abs(h1_prime - h2_prime) <= 180) {
        h_bar_prime = (h1_prime + h2_prime) / 2;
    } else {
        h_bar_prime = (h1_prime + h2_prime < 360) ? (h1_prime + h2_prime + 360) / 2 : (h1_prime + h2_prime - 360) / 2;
    }

    const T = 1 - 0.17 * Math.cos(_cs_degreesToRadians(h_bar_prime - 30)) +
              0.24 * Math.cos(_cs_degreesToRadians(2 * h_bar_prime)) +
              0.32 * Math.cos(_cs_degreesToRadians(3 * h_bar_prime + 6)) -
              0.20 * Math.cos(_cs_degreesToRadians(4 * h_bar_prime - 63));

    const delta_theta = 30 * Math.exp(-Math.pow((h_bar_prime - 275) / 25, 2));
    const R_C = 2 * Math.sqrt(Math.pow(C_bar_prime, 7) / (Math.pow(C_bar_prime, 7) + Math.pow(25, 7)));
    const S_L = 1 + (0.015 * Math.pow(L_bar_prime - 50, 2)) / Math.sqrt(20 + Math.pow(L_bar_prime - 50, 2));
    const S_C = 1 + 0.045 * C_bar_prime;
    const S_H = 1 + 0.015 * C_bar_prime * T;
    const R_T = -R_C * Math.sin(_cs_degreesToRadians(2 * delta_theta));

    const L_term = delta_L_prime / (kL * S_L);
    const C_term = delta_C_prime / (kC * S_C);
    const H_term = delta_H_prime / (kH * S_H);

    return Math.sqrt(Math.pow(L_term, 2) + Math.pow(C_term, 2) + Math.pow(H_term, 2) + R_T * C_term * H_term);
}