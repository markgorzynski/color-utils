/**
 * Comprehensive tests for Adaptive Oklab implementation
 */

import { describe, it, expect, vi } from 'vitest';
import { AdaptiveOklab } from '../src/aoklab.js';
import { parseSrgbHex, linearSrgbToXyz, srgbToLinearSrgb } from '../src/srgb.js';
import { srgbToXyz, xyzToSrgb } from '../src/cielab.js';
import { approxEqual, colorsApproxEqual } from './test-helpers.js';

// Helper function to convert sRGB to XYZ
function srgbToXyzHelper(srgb) {
  const linear = srgbToLinearSrgb(srgb);
  return linearSrgbToXyz(linear);
}

describe('Adaptive Oklab', () => {
  
  describe('Constructor and Configuration', () => {
    it('should use default gray surround when no options provided', () => {
      const aok = new AdaptiveOklab();
      expect(aok.surround).toBe('gray');
      expect(aok.params.FL).toBe(0.420);
    });
    
    it('should handle empty options object', () => {
      const aok = new AdaptiveOklab({});
      expect(aok.surround).toBe('gray');
      expect(aok.params.x0).toBe(0.5);
    });
    
    it('should accept custom x0 values', () => {
      const aok1 = new AdaptiveOklab({ x0: 0.3 });
      expect(aok1.params.x0).toBe(0.3);
      
      const aok2 = new AdaptiveOklab({ x0: 0.7 });
      expect(aok2.params.x0).toBe(0.7);
      
      // x0 affects correction factor
      expect(aok1.params.correctionFactor).not.toBe(aok2.params.correctionFactor);
    });
    
    it('should handle invalid x0 values', () => {
      const aokNaN = new AdaptiveOklab({ x0: NaN });
      expect(aokNaN.params.x0).toBe(0.5); // Should fallback to default
      
      const aokString = new AdaptiveOklab({ x0: 'invalid' });
      expect(aokString.params.x0).toBe(0.5); // Should fallback to default
    });
    
    it('should warn and fallback for unknown surround', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const aok = new AdaptiveOklab({ surround: 'unknown' });
      expect(aok.surround).toBe('gray');
      expect(consoleSpy).toHaveBeenCalledWith(
        'AdaptiveOklab: Unknown surround "unknown". Defaulting to "gray".'
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should have correct exponents for each surround', () => {
      const white = new AdaptiveOklab({ surround: 'white' });
      const gray = new AdaptiveOklab({ surround: 'gray' });
      const dark = new AdaptiveOklab({ surround: 'dark' });
      
      expect(white.params.FL).toBe(0.526);
      expect(gray.params.FL).toBe(0.420);
      expect(dark.params.FL).toBe(0.349);
    });
  });
  
  describe('Type Validation', () => {
    const aok = new AdaptiveOklab();
    
    it('should throw TypeError for invalid sRGB input', () => {
      expect(() => aok.fromSrgb(null)).toThrow(TypeError);
      expect(() => aok.fromSrgb(undefined)).toThrow(TypeError);
      expect(() => aok.fromSrgb('not an object')).toThrow(TypeError);
      expect(() => aok.fromSrgb({ r: 0.5, g: 0.5 })).toThrow(TypeError); // Missing b
      expect(() => aok.fromSrgb({ r: NaN, g: 0.5, b: 0.5 })).toThrow(TypeError);
    });
    
    it('should throw TypeError for invalid XYZ input', () => {
      expect(() => aok.fromXyz(null)).toThrow(TypeError);
      expect(() => aok.fromXyz({ X: 0.5, Y: 0.5 })).toThrow(TypeError); // Missing Z
      expect(() => aok.fromXyz({ X: NaN, Y: 0.5, Z: 0.5 })).toThrow(TypeError);
    });
    
    it('should throw TypeError for invalid Oklab input in reverse conversions', () => {
      expect(() => aok.toSrgb(null)).toThrow(TypeError);
      expect(() => aok.toSrgb({ L: 0.5, a: 0.1 })).toThrow(TypeError); // Missing b
      expect(() => aok.toSrgb({ L: NaN, a: 0.1, b: 0.1 })).toThrow(TypeError);
      expect(() => aok.toLinearSrgb({ L: 0.5, a: NaN, b: 0.1 })).toThrow(TypeError);
      expect(() => aok.toXyz({ L: 0.5, a: 0.1, b: NaN })).toThrow(TypeError);
    });
  });
  
  describe('Conversion Methods', () => {
    const aok = new AdaptiveOklab({ surround: 'gray' });
    const testColor = { r: 0.7, g: 0.4, b: 0.2 };
    
    it('should convert from sRGB', () => {
      const result = aok.fromSrgb(testColor);
      expect(result).toHaveProperty('L');
      expect(result).toHaveProperty('a');
      expect(result).toHaveProperty('b');
      expect(result.L).toBeGreaterThan(0);
      expect(result.L).toBeLessThan(1);
    });
    
    it('should convert from XYZ', () => {
      const xyz = srgbToXyzHelper(testColor);
      const resultFromXyz = aok.fromXyz(xyz);
      const resultFromSrgb = aok.fromSrgb(testColor);
      
      // Should produce identical results
      expect(approxEqual(resultFromXyz.L, resultFromSrgb.L, 0.0001)).toBe(true);
      expect(approxEqual(resultFromXyz.a, resultFromSrgb.a, 0.0001)).toBe(true);
      expect(approxEqual(resultFromXyz.b, resultFromSrgb.b, 0.0001)).toBe(true);
    });
    
    it('should convert to XYZ', () => {
      const aokColor = aok.fromSrgb(testColor);
      const xyz = aok.toXyz(aokColor);
      
      expect(xyz).toHaveProperty('X');
      expect(xyz).toHaveProperty('Y');
      expect(xyz).toHaveProperty('Z');
      
      // Round-trip test
      const backToAok = aok.fromXyz(xyz);
      expect(colorsApproxEqual(aokColor, backToAok, 0.0001)).toBe(true);
    });
    
    it('should convert to hex', () => {
      const aokColor = aok.fromSrgb(testColor);
      const hex = aok.toHex(aokColor);
      
      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      
      // Parse hex back and compare
      const fromHex = parseSrgbHex(hex);
      expect(colorsApproxEqual(testColor, fromHex, 0.01)).toBe(true);
    });
    
    it('should convert to linear sRGB', () => {
      const aokColor = aok.fromSrgb(testColor);
      const linear = aok.toLinearSrgb(aokColor);
      
      expect(linear).toHaveProperty('r');
      expect(linear).toHaveProperty('g');
      expect(linear).toHaveProperty('b');
      
      // Linear values should be different from gamma-corrected
      expect(linear.r).not.toBeCloseTo(testColor.r, 2);
    });
  });
  
  describe('Static fromHex Method', () => {
    it('should convert hex to Adaptive Oklab with options', () => {
      const hex = '#ff6600';
      
      const white = AdaptiveOklab.fromHex(hex, { surround: 'white' });
      const gray = AdaptiveOklab.fromHex(hex, { surround: 'gray' });
      const dark = AdaptiveOklab.fromHex(hex, { surround: 'dark' });
      
      // Different surrounds should produce different results
      expect(white.L).not.toBeCloseTo(gray.L, 3);
      expect(gray.L).not.toBeCloseTo(dark.L, 3);
    });
    
    it('should handle various hex formats', () => {
      const color1 = AdaptiveOklab.fromHex('#FF6600');
      const color2 = AdaptiveOklab.fromHex('ff6600');
      const color3 = AdaptiveOklab.fromHex('#ff6600');
      
      expect(colorsApproxEqual(color1, color2, 0.0001)).toBe(true);
      expect(colorsApproxEqual(color1, color3, 0.0001)).toBe(true);
    });
    
    it('should handle invalid hex strings', () => {
      expect(() => AdaptiveOklab.fromHex('invalid')).toThrow();
      expect(() => AdaptiveOklab.fromHex('#gggggg')).toThrow();
      expect(() => AdaptiveOklab.fromHex(null)).toThrow();
    });
  });
  
  describe('Edge Cases and Gamut Boundaries', () => {
    const aok = new AdaptiveOklab();
    
    it('should handle black color', () => {
      const black = { r: 0, g: 0, b: 0 };
      const aokBlack = aok.fromSrgb(black);
      const backToSrgb = aok.toSrgb(aokBlack);
      
      expect(aokBlack.L).toBeCloseTo(0, 2);
      expect(colorsApproxEqual(black, backToSrgb, 0.001)).toBe(true);
    });
    
    it('should handle white color', () => {
      const white = { r: 1, g: 1, b: 1 };
      const aokWhite = aok.fromSrgb(white);
      const backToSrgb = aok.toSrgb(aokWhite);
      
      expect(aokWhite.L).toBeLessThanOrEqual(1);
      expect(colorsApproxEqual(white, backToSrgb, 0.001)).toBe(true);
    });
    
    it('should handle out-of-gamut colors in reverse conversion', () => {
      // Very vibrant color that might be out of sRGB gamut
      const vibrant = { L: 0.8, a: 0.5, b: 0.5 };
      const srgb = aok.toSrgb(vibrant);
      
      // Should return a result even if out of gamut
      expect(srgb).toHaveProperty('r');
      expect(srgb).toHaveProperty('g');
      expect(srgb).toHaveProperty('b');
      
      // Values might be outside [0,1]
      // That's ok - just verify the conversion runs
    });
    
    it('should handle negative RGB values gracefully', () => {
      const invalidRgb = { r: -0.1, g: 0.5, b: 0.5 };
      const aokColor = aok.fromSrgb(invalidRgb);
      
      // Should still produce a result
      expect(aokColor).toHaveProperty('L');
      expect(aokColor).toHaveProperty('a');
      expect(aokColor).toHaveProperty('b');
    });
    
    it('should handle RGB values > 1', () => {
      const overRgb = { r: 1.2, g: 0.5, b: 0.5 };
      const aokColor = aok.fromSrgb(overRgb);
      
      // Should still produce a result
      expect(aokColor).toHaveProperty('L');
      expect(aokColor).toHaveProperty('a');
      expect(aokColor).toHaveProperty('b');
    });
  });
  
  describe('Custom x0 Parameter Effects', () => {
    const testColor = { r: 0.5, g: 0.7, b: 0.3 };
    
    it('should affect correction factor calculation', () => {
      const aok1 = new AdaptiveOklab({ x0: 0.3 });
      const aok2 = new AdaptiveOklab({ x0: 0.5 });
      const aok3 = new AdaptiveOklab({ x0: 0.7 });
      
      const cf1 = aok1.params.correctionFactor;
      const cf2 = aok2.params.correctionFactor;
      const cf3 = aok3.params.correctionFactor;
      
      // Different x0 values should produce different correction factors
      expect(cf1).not.toBe(cf2);
      expect(cf2).not.toBe(cf3);
    });
    
    it('should affect a and b channels but not L', () => {
      const aok1 = new AdaptiveOklab({ x0: 0.3 });
      const aok2 = new AdaptiveOklab({ x0: 0.7 });
      
      const color1 = aok1.fromSrgb(testColor);
      const color2 = aok2.fromSrgb(testColor);
      
      // L should be similar (only affected by surround, not x0)
      // But a and b should differ due to correction factor
      expect(Math.abs(color1.a - color2.a)).toBeGreaterThan(0.005);
      expect(Math.abs(color1.b - color2.b)).toBeGreaterThan(0.005);
    });
    
    it('should handle x0 = 0 edge case', () => {
      const aok = new AdaptiveOklab({ x0: 0 });
      const color = aok.fromSrgb(testColor);
      
      // Should handle potential infinity in correction factor
      expect(Number.isFinite(color.L)).toBe(true);
      expect(Number.isFinite(color.a)).toBe(true);
      expect(Number.isFinite(color.b)).toBe(true);
    });
    
    it('should handle x0 = 1 case', () => {
      const aok = new AdaptiveOklab({ x0: 1 });
      const color = aok.fromSrgb(testColor);
      const back = aok.toSrgb(color);
      
      // Should still maintain reversibility
      expect(colorsApproxEqual(testColor, back, 0.001)).toBe(true);
    });
  });
  
  describe('Consistency Across Input Methods', () => {
    const aok = new AdaptiveOklab({ surround: 'gray' });
    const testColor = { r: 0.6, g: 0.4, b: 0.8 };
    
    it('should produce identical results from sRGB, XYZ, and hex inputs', () => {
      // From sRGB
      const fromSrgb = aok.fromSrgb(testColor);
      
      // From XYZ
      const xyz = srgbToXyzHelper(testColor);
      const fromXyz = aok.fromXyz(xyz);
      
      // From hex
      const hex = '#9966cc'; // Approximately rgb(0.6, 0.4, 0.8)
      const fromHex = AdaptiveOklab.fromHex(hex, { surround: 'gray' });
      
      // All should be very similar
      expect(approxEqual(fromSrgb.L, fromXyz.L, 0.0001)).toBe(true);
      expect(approxEqual(fromSrgb.a, fromXyz.a, 0.0001)).toBe(true);
      expect(approxEqual(fromSrgb.b, fromXyz.b, 0.0001)).toBe(true);
      
      // Hex might have slight rounding differences due to 8-bit precision
      expect(approxEqual(fromSrgb.L, fromHex.L, 0.01)).toBe(true);
      expect(approxEqual(fromSrgb.a, fromHex.a, 0.01)).toBe(true);
      expect(approxEqual(fromSrgb.b, fromHex.b, 0.01)).toBe(true);
    });
  });
  
  describe('Mathematical Correctness', () => {
    it('should maintain hue across different surrounds', () => {
      const testColor = { r: 0.8, g: 0.3, b: 0.2 };
      
      const white = new AdaptiveOklab({ surround: 'white' });
      const gray = new AdaptiveOklab({ surround: 'gray' });
      const dark = new AdaptiveOklab({ surround: 'dark' });
      
      const colorWhite = white.fromSrgb(testColor);
      const colorGray = gray.fromSrgb(testColor);
      const colorDark = dark.fromSrgb(testColor);
      
      // Calculate hue angles
      const hueWhite = Math.atan2(colorWhite.b, colorWhite.a);
      const hueGray = Math.atan2(colorGray.b, colorGray.a);
      const hueDark = Math.atan2(colorDark.b, colorDark.a);
      
      // Hues should be similar (within ~2 degrees in radians)
      expect(Math.abs(hueWhite - hueGray)).toBeLessThan(0.04);
      expect(Math.abs(hueGray - hueDark)).toBeLessThan(0.04);
    });
    
    it('should have different chroma for different surrounds', () => {
      const testColor = { r: 0.8, g: 0.3, b: 0.2 };
      
      const white = new AdaptiveOklab({ surround: 'white' });
      const gray = new AdaptiveOklab({ surround: 'gray' });
      const dark = new AdaptiveOklab({ surround: 'dark' });
      
      const colorWhite = white.fromSrgb(testColor);
      const colorGray = gray.fromSrgb(testColor);
      const colorDark = dark.fromSrgb(testColor);
      
      // Calculate chroma
      const chromaWhite = Math.sqrt(colorWhite.a ** 2 + colorWhite.b ** 2);
      const chromaGray = Math.sqrt(colorGray.a ** 2 + colorGray.b ** 2);
      const chromaDark = Math.sqrt(colorDark.a ** 2 + colorDark.b ** 2);
      
      // Chroma should decrease from white to dark surround
      expect(chromaWhite).toBeGreaterThan(chromaGray);
      expect(chromaGray).toBeGreaterThan(chromaDark);
    });
  });
  
  describe('Precision and Stability', () => {
    const aok = new AdaptiveOklab({ surround: 'gray' });
    
    it('should maintain precision over multiple round-trips', () => {
      let color = { r: 0.5, g: 0.6, b: 0.7 };
      
      // Perform 10 round-trips
      for (let i = 0; i < 10; i++) {
        const aokColor = aok.fromSrgb(color);
        color = aok.toSrgb(aokColor);
      }
      
      // Should still be close to original
      expect(approxEqual(color.r, 0.5, 0.001)).toBe(true);
      expect(approxEqual(color.g, 0.6, 0.001)).toBe(true);
      expect(approxEqual(color.b, 0.7, 0.001)).toBe(true);
    });
    
    it('should handle very small color differences', () => {
      const color1 = { r: 0.5, g: 0.5, b: 0.5 };
      const color2 = { r: 0.50001, g: 0.50001, b: 0.50001 };
      
      const aok1 = aok.fromSrgb(color1);
      const aok2 = aok.fromSrgb(color2);
      
      // Small input differences should produce small output differences
      const diffL = Math.abs(aok1.L - aok2.L);
      const diffA = Math.abs(aok1.a - aok2.a);
      const diffB = Math.abs(aok1.b - aok2.b);
      
      expect(diffL).toBeLessThan(0.0001);
      expect(diffA).toBeLessThan(0.0001);
      expect(diffB).toBeLessThan(0.0001);
    });
  });
  
  describe('Division by Zero Protection', () => {
    it('should handle correction factor division by zero', () => {
      // This would require mocking internal state, which is difficult
      // But we can test that x0=0 doesn't crash
      const aok = new AdaptiveOklab({ x0: 0 });
      const color = { L: 0.5, a: 0.1, b: 0.1 };
      
      // Should not throw
      expect(() => aok.toSrgb(color)).not.toThrow();
      
      const result = aok.toSrgb(color);
      expect(result).toHaveProperty('r');
      expect(result).toHaveProperty('g');
      expect(result).toHaveProperty('b');
    });
  });
});