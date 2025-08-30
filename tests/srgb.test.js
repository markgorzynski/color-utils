import { describe, it, expect } from 'vitest';
import {
  srgbToLinearSrgb,
  linearSrgbToSrgb,
  linearSrgbToXyz,
  xyzToLinearSrgb,
  srgbToXyz,
  xyzToSrgb,
  parseSrgbHex,
  formatSrgbAsHex,
  isSrgbInGamut
} from '../src/srgb.js';
import { 
  approxEqual, 
  colorsApproxEqual, 
  TEST_COLORS,
  isReversible
} from './test-helpers.js';

describe('sRGB Module', () => {
  
  describe('Gamma Correction', () => {
    it('should convert sRGB to linear sRGB correctly', () => {
      // Test with known values
      const black = srgbToLinearSrgb({ r: 0, g: 0, b: 0 });
      expect(black).toEqual({ r: 0, g: 0, b: 0 });
      
      const white = srgbToLinearSrgb({ r: 1, g: 1, b: 1 });
      expect(white).toEqual({ r: 1, g: 1, b: 1 });
      
      // Test gamma curve
      const gray50 = srgbToLinearSrgb({ r: 0.5, g: 0.5, b: 0.5 });
      expect(approxEqual(gray50.r, 0.2140411, 0.0001)).toBe(true);
      
      // Test low values (linear part of curve)
      const dark = srgbToLinearSrgb({ r: 0.04, g: 0.04, b: 0.04 });
      expect(approxEqual(dark.r, 0.00309597, 0.0001)).toBe(true);
    });
    
    it('should convert linear sRGB to sRGB correctly', () => {
      const black = linearSrgbToSrgb({ r: 0, g: 0, b: 0 });
      expect(black).toEqual({ r: 0, g: 0, b: 0 });
      
      const white = linearSrgbToSrgb({ r: 1, g: 1, b: 1 });
      expect(white).toEqual({ r: 1, g: 1, b: 1 });
      
      const gray = linearSrgbToSrgb({ r: 0.2140411, g: 0.2140411, b: 0.2140411 });
      expect(approxEqual(gray.r, 0.5, 0.001)).toBe(true);
    });
    
    it('should be reversible', () => {
      const colors = [
        { r: 0.2, g: 0.5, b: 0.8 },
        { r: 0.99, g: 0.01, b: 0.5 },
        TEST_COLORS.red.srgb,
        TEST_COLORS.purple.srgb
      ];
      
      colors.forEach(color => {
        expect(isReversible(srgbToLinearSrgb, linearSrgbToSrgb, color)).toBe(true);
      });
    });
  });
  
  describe('XYZ Conversions', () => {
    it('should convert linear sRGB to XYZ correctly', () => {
      const red = linearSrgbToXyz(srgbToLinearSrgb(TEST_COLORS.red.srgb));
      expect(colorsApproxEqual(red, TEST_COLORS.red.xyz, 0.01)).toBe(true);
      
      const green = linearSrgbToXyz(srgbToLinearSrgb(TEST_COLORS.green.srgb));
      expect(colorsApproxEqual(green, TEST_COLORS.green.xyz, 0.01)).toBe(true);
      
      const blue = linearSrgbToXyz(srgbToLinearSrgb(TEST_COLORS.blue.srgb));
      expect(colorsApproxEqual(blue, TEST_COLORS.blue.xyz, 0.01)).toBe(true);
    });
    
    it('should convert XYZ to linear sRGB correctly', () => {
      const white = xyzToLinearSrgb(TEST_COLORS.white.xyz);
      const whiteSrgb = linearSrgbToSrgb(white);
      expect(colorsApproxEqual(whiteSrgb, TEST_COLORS.white.srgb, 0.001)).toBe(true);
    });
    
    it('should handle direct sRGB to XYZ conversion', () => {
      const redXyz = srgbToXyz(TEST_COLORS.red.srgb);
      expect(colorsApproxEqual(redXyz, TEST_COLORS.red.xyz, 0.01)).toBe(true);
      
      const whiteXyz = srgbToXyz(TEST_COLORS.white.srgb);
      expect(colorsApproxEqual(whiteXyz, TEST_COLORS.white.xyz, 0.01)).toBe(true);
    });
    
    it('should handle direct XYZ to sRGB conversion', () => {
      const red = xyzToSrgb(TEST_COLORS.red.xyz);
      expect(colorsApproxEqual(red, TEST_COLORS.red.srgb, 0.001)).toBe(true);
    });
    
    it('should be reversible for in-gamut colors', () => {
      const colors = [
        TEST_COLORS.red.srgb,
        TEST_COLORS.green.srgb,
        TEST_COLORS.blue.srgb,
        TEST_COLORS.orange.srgb,
        TEST_COLORS.purple.srgb
      ];
      
      colors.forEach(color => {
        expect(isReversible(srgbToXyz, xyzToSrgb, color, 0.001)).toBe(true);
      });
    });
  });
  
  describe('Hex Color Utilities', () => {
    it('should parse valid hex colors', () => {
      // 6-digit hex
      expect(parseSrgbHex('#FF0000')).toEqual({ r: 1, g: 0, b: 0 });
      expect(parseSrgbHex('#00FF00')).toEqual({ r: 0, g: 1, b: 0 });
      expect(parseSrgbHex('#0000FF')).toEqual({ r: 0, g: 0, b: 1 });
      expect(parseSrgbHex('#FFFFFF')).toEqual({ r: 1, g: 1, b: 1 });
      expect(parseSrgbHex('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      
      // 3-digit hex
      expect(parseSrgbHex('#F00')).toEqual({ r: 1, g: 0, b: 0 });
      expect(parseSrgbHex('#0F0')).toEqual({ r: 0, g: 1, b: 0 });
      expect(parseSrgbHex('#00F')).toEqual({ r: 0, g: 0, b: 1 });
      expect(parseSrgbHex('#FFF')).toEqual({ r: 1, g: 1, b: 1 });
      expect(parseSrgbHex('#000')).toEqual({ r: 0, g: 0, b: 0 });
      
      // Case insensitive
      expect(parseSrgbHex('#ff0000')).toEqual({ r: 1, g: 0, b: 0 });
      expect(parseSrgbHex('#FF0000')).toEqual({ r: 1, g: 0, b: 0 });
      
      // With or without hash
      expect(parseSrgbHex('FF0000')).toEqual({ r: 1, g: 0, b: 0 });
      expect(parseSrgbHex('F00')).toEqual({ r: 1, g: 0, b: 0 });
    });
    
    it('should return null for invalid hex colors', () => {
      expect(parseSrgbHex('')).toBeNull();
      expect(parseSrgbHex('invalid')).toBeNull();
      expect(parseSrgbHex('#GG0000')).toBeNull();
      expect(parseSrgbHex('#FF')).toBeNull();
      expect(parseSrgbHex('#FFFFFFF')).toBeNull();
      expect(parseSrgbHex('12345')).toBeNull();
    });
    
    it('should format sRGB as hex correctly', () => {
      expect(formatSrgbAsHex({ r: 1, g: 0, b: 0 })).toBe('#ff0000');
      expect(formatSrgbAsHex({ r: 0, g: 1, b: 0 })).toBe('#00ff00');
      expect(formatSrgbAsHex({ r: 0, g: 0, b: 1 })).toBe('#0000ff');
      expect(formatSrgbAsHex({ r: 1, g: 1, b: 1 })).toBe('#ffffff');
      expect(formatSrgbAsHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
      
      // Should handle floating point
      expect(formatSrgbAsHex({ r: 0.5, g: 0.5, b: 0.5 })).toBe('#808080');
      
      // Should clamp out-of-range values
      expect(formatSrgbAsHex({ r: 1.5, g: -0.5, b: 0.5 })).toBe('#ff0080');
    });
    
    it('should round-trip hex conversions', () => {
      const hexColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080'];
      
      hexColors.forEach(hex => {
        const srgb = parseSrgbHex(hex);
        const formatted = formatSrgbAsHex(srgb);
        expect(formatted).toBe(hex.toLowerCase());
      });
    });
  });
  
  describe('Gamut Checking', () => {
    it('should identify in-gamut colors', () => {
      expect(isSrgbInGamut({ r: 0, g: 0, b: 0 })).toBe(true);
      expect(isSrgbInGamut({ r: 1, g: 1, b: 1 })).toBe(true);
      expect(isSrgbInGamut({ r: 0.5, g: 0.5, b: 0.5 })).toBe(true);
      expect(isSrgbInGamut({ r: 0.999, g: 0.001, b: 0.5 })).toBe(true);
    });
    
    it('should identify out-of-gamut colors', () => {
      expect(isSrgbInGamut({ r: -0.1, g: 0.5, b: 0.5 })).toBe(false);
      expect(isSrgbInGamut({ r: 1.1, g: 0.5, b: 0.5 })).toBe(false);
      expect(isSrgbInGamut({ r: 0.5, g: -0.001, b: 0.5 })).toBe(false);
      expect(isSrgbInGamut({ r: 0.5, g: 0.5, b: 1.001 })).toBe(false);
    });
    
    it('should handle edge cases with epsilon', () => {
      // Very small negative values should be considered in gamut
      expect(isSrgbInGamut({ r: -0.000001, g: 0, b: 0 })).toBe(true);
      expect(isSrgbInGamut({ r: 1.000001, g: 1, b: 1 })).toBe(true);
      
      // Larger out-of-bounds values
      expect(isSrgbInGamut({ r: -0.01, g: 0, b: 0 })).toBe(false);
      expect(isSrgbInGamut({ r: 1.01, g: 1, b: 1 })).toBe(false);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle extreme values gracefully', () => {
      // Very large values
      const large = srgbToXyz({ r: 1000, g: 1000, b: 1000 });
      expect(large.X).toBeGreaterThan(0);
      expect(large.Y).toBeGreaterThan(0);
      expect(large.Z).toBeGreaterThan(0);
      
      // Negative values
      const negative = srgbToXyz({ r: -1, g: -1, b: -1 });
      expect(negative.X).toBeLessThanOrEqual(0);
      expect(negative.Y).toBeLessThanOrEqual(0);
      expect(negative.Z).toBeLessThanOrEqual(0);
    });
    
    it('should maintain precision for near-zero values', () => {
      const small = { r: 0.001, g: 0.001, b: 0.001 };
      const xyz = srgbToXyz(small);
      const back = xyzToSrgb(xyz);
      
      expect(approxEqual(back.r, small.r, 0.0001)).toBe(true);
      expect(approxEqual(back.g, small.g, 0.0001)).toBe(true);
      expect(approxEqual(back.b, small.b, 0.0001)).toBe(true);
    });
  });
});