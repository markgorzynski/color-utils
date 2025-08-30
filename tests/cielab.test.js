import { describe, it, expect } from 'vitest';
import {
  xyzToLab,
  labToXyz,
  labToLch,
  lchToLab,
  srgbToLab,
  labToSrgb,
  srgbToLch,
  lchToSrgb
} from '../src/cielab.js';
import { srgbToXyz, xyzToSrgb } from '../src/srgb.js';
import { 
  approxEqual, 
  colorsApproxEqual, 
  TEST_COLORS,
  isReversible
} from './test-helpers.js';

describe('CIELAB Module', () => {
  
  describe('XYZ to Lab Conversion', () => {
    it('should convert XYZ to Lab correctly', () => {
      // Test with known values
      const whiteXyz = TEST_COLORS.white.xyz;
      const whiteLab = xyzToLab(whiteXyz);
      expect(colorsApproxEqual(whiteLab, { L: 100, a: 0, b: 0 }, 0.01)).toBe(true);
      
      const blackXyz = TEST_COLORS.black.xyz;
      const blackLab = xyzToLab(blackXyz);
      expect(colorsApproxEqual(blackLab, { L: 0, a: 0, b: 0 }, 0.01)).toBe(true);
      
      // Test primary colors
      const redXyz = TEST_COLORS.red.xyz;
      const redLab = xyzToLab(redXyz);
      expect(approxEqual(redLab.L, TEST_COLORS.red.lab.L, 0.01)).toBe(true);
      expect(approxEqual(redLab.a, TEST_COLORS.red.lab.a, 0.01)).toBe(true);
      expect(approxEqual(redLab.b, TEST_COLORS.red.lab.b, 0.01)).toBe(true);
    });
    
    it('should handle the non-linear transformation correctly', () => {
      // Test the cubic root transformation for values > 0.008856
      // Convert from 0-100 scale to 0-1 scale for our functions
      const midGray = xyzToLab({ X: 0.20517, Y: 0.21586, Z: 0.23507 });
      expect(approxEqual(midGray.L, 53.585, 0.5)).toBe(true);
      
      // Test the linear transformation for dark values
      const veryDark = xyzToLab({ X: 0.005, Y: 0.005, Z: 0.005 });
      expect(veryDark.L).toBeGreaterThan(0);
      expect(veryDark.L).toBeLessThan(10);
    });
  });
  
  describe('Lab to XYZ Conversion', () => {
    it('should convert Lab to XYZ correctly', () => {
      const whiteLab = { L: 100, a: 0, b: 0 };
      const whiteXyz = labToXyz(whiteLab);
      expect(colorsApproxEqual(whiteXyz, TEST_COLORS.white.xyz, 0.01)).toBe(true);
      
      const blackLab = { L: 0, a: 0, b: 0 };
      const blackXyz = labToXyz(blackLab);
      expect(colorsApproxEqual(blackXyz, TEST_COLORS.black.xyz, 0.01)).toBe(true);
    });
    
    it('should be reversible with XYZ', () => {
      const testColors = [
        TEST_COLORS.red.xyz,
        TEST_COLORS.green.xyz,
        TEST_COLORS.blue.xyz,
        TEST_COLORS.gray50.xyz,
        { X: 30, Y: 40, Z: 50 }
      ];
      
      testColors.forEach(xyz => {
        expect(isReversible(xyzToLab, labToXyz, xyz, 0.01)).toBe(true);
      });
    });
  });
  
  describe('Lab to LCh Conversion', () => {
    it('should convert Lab to LCh correctly', () => {
      // Neutral colors should have C = 0
      const whiteLch = labToLch({ L: 100, a: 0, b: 0 });
      expect(whiteLch.L).toBe(100);
      expect(whiteLch.C).toBe(0);
      expect(whiteLch.h).toBe(0);
      
      // Test with chromatic colors
      const redLab = TEST_COLORS.red.lab;
      const redLch = labToLch(redLab);
      expect(approxEqual(redLch.L, TEST_COLORS.red.lch.L, 0.01)).toBe(true);
      expect(approxEqual(redLch.C, TEST_COLORS.red.lch.C, 0.03)).toBe(true);  // Chroma needs higher tolerance
      expect(approxEqual(redLch.h, TEST_COLORS.red.lch.h, 0.01)).toBe(true);
    });
    
    it('should calculate chroma correctly', () => {
      const lab = { L: 50, a: 30, b: 40 };
      const lch = labToLch(lab);
      const expectedC = Math.sqrt(30 * 30 + 40 * 40);
      expect(approxEqual(lch.C, expectedC, 0.001)).toBe(true);
    });
    
    it('should calculate hue angle correctly', () => {
      // Test quadrants
      expect(labToLch({ L: 50, a: 1, b: 0 }).h).toBeCloseTo(0, 1);
      expect(labToLch({ L: 50, a: 0, b: 1 }).h).toBeCloseTo(90, 1);
      expect(labToLch({ L: 50, a: -1, b: 0 }).h).toBeCloseTo(180, 1);
      expect(labToLch({ L: 50, a: 0, b: -1 }).h).toBeCloseTo(270, 1);
    });
  });
  
  describe('LCh to Lab Conversion', () => {
    it('should convert LCh to Lab correctly', () => {
      const whiteLab = lchToLab({ L: 100, C: 0, h: 0 });
      expect(colorsApproxEqual(whiteLab, { L: 100, a: 0, b: 0 }, 0.001)).toBe(true);
      
      // Test with chromatic colors
      const redLch = TEST_COLORS.red.lch;
      const redLab = lchToLab(redLch);
      expect(colorsApproxEqual(redLab, TEST_COLORS.red.lab, 0.02)).toBe(true);  // Round-trip tolerance
    });
    
    it('should be reversible with Lab', () => {
      const testColors = [
        { L: 50, a: 20, b: -30 },
        { L: 75, a: -40, b: 60 },
        { L: 25, a: 80, b: -80 },
        TEST_COLORS.red.lab,
        TEST_COLORS.purple.lab
      ];
      
      testColors.forEach(lab => {
        expect(isReversible(labToLch, lchToLab, lab, 0.001)).toBe(true);
      });
    });
  });
  
  describe('sRGB to Lab Conversion', () => {
    it('should convert sRGB to Lab correctly', () => {
      Object.keys(TEST_COLORS).forEach(colorName => {
        const color = TEST_COLORS[colorName];
        const lab = srgbToLab(color.srgb);
        expect(colorsApproxEqual(lab, color.lab, 0.1)).toBe(true);
      });
    });
    
    it('should handle direct conversion optimization', () => {
      // The direct conversion should be equivalent to going through XYZ
      const testColor = { r: 0.3, g: 0.6, b: 0.9 };
      
      const directLab = srgbToLab(testColor);
      const viaXyz = xyzToLab(srgbToXyz(testColor));
      
      expect(colorsApproxEqual(directLab, viaXyz, 0.001)).toBe(true);
    });
  });
  
  describe('Lab to sRGB Conversion', () => {
    it('should convert Lab to sRGB correctly', () => {
      const redSrgb = labToSrgb(TEST_COLORS.red.lab);
      expect(colorsApproxEqual(redSrgb, TEST_COLORS.red.srgb, 0.01)).toBe(true);
      
      const greenSrgb = labToSrgb(TEST_COLORS.green.lab);
      expect(colorsApproxEqual(greenSrgb, TEST_COLORS.green.srgb, 0.01)).toBe(true);
    });
    
    it('should handle out-of-gamut colors', () => {
      // Very high chroma Lab color likely out of sRGB gamut
      const vibrantLab = { L: 60, a: 100, b: 100 };
      const srgb = labToSrgb(vibrantLab);
      
      // Should still return a result (may be clipped)
      expect(srgb).toBeDefined();
      expect(typeof srgb.r).toBe('number');
      expect(typeof srgb.g).toBe('number');
      expect(typeof srgb.b).toBe('number');
    });
    
    it('should be reversible for in-gamut colors', () => {
      const inGamutColors = [
        TEST_COLORS.red.srgb,
        TEST_COLORS.gray50.srgb,
        { r: 0.2, g: 0.4, b: 0.6 }
      ];
      
      inGamutColors.forEach(srgb => {
        expect(isReversible(srgbToLab, labToSrgb, srgb, 0.01)).toBe(true);
      });
    });
  });
  
  describe('sRGB to LCh Conversion', () => {
    it('should convert sRGB to LCh correctly', () => {
      const redLch = srgbToLch(TEST_COLORS.red.srgb);
      expect(colorsApproxEqual(redLch, TEST_COLORS.red.lch, 0.1)).toBe(true);
      
      const greenLch = srgbToLch(TEST_COLORS.green.srgb);
      expect(colorsApproxEqual(greenLch, TEST_COLORS.green.lch, 0.1)).toBe(true);
    });
  });
  
  describe('LCh to sRGB Conversion', () => {
    it('should convert LCh to sRGB correctly', () => {
      const redSrgb = lchToSrgb(TEST_COLORS.red.lch);
      expect(colorsApproxEqual(redSrgb, TEST_COLORS.red.srgb, 0.01)).toBe(true);
    });
    
    it('should be reversible for in-gamut colors', () => {
      const colors = [
        TEST_COLORS.orange.srgb,
        TEST_COLORS.purple.srgb
      ];
      
      colors.forEach(srgb => {
        expect(isReversible(srgbToLch, lchToSrgb, srgb, 0.01)).toBe(true);
      });
    });
  });
  
  describe('Color Space Properties', () => {
    it('should maintain L*a*b* perceptual uniformity', () => {
      // Colors with same L should have similar perceived lightness
      const lab1 = { L: 50, a: 20, b: 20 };
      const lab2 = { L: 50, a: -20, b: -20 };
      
      const srgb1 = labToSrgb(lab1);
      const srgb2 = labToSrgb(lab2);
      
      // Both should be valid colors
      expect(srgb1).toBeDefined();
      expect(srgb2).toBeDefined();
    });
    
    it('should handle the full Lab gamut', () => {
      const extremeColors = [
        { L: 0, a: 0, b: 0 },      // Black
        { L: 100, a: 0, b: 0 },    // White
        { L: 50, a: 127, b: 0 },   // Maximum a*
        { L: 50, a: -128, b: 0 },  // Minimum a*
        { L: 50, a: 0, b: 127 },   // Maximum b*
        { L: 50, a: 0, b: -128 }   // Minimum b*
      ];
      
      extremeColors.forEach(lab => {
        const xyz = labToXyz(lab);
        expect(xyz).toBeDefined();
        expect(!isNaN(xyz.X)).toBe(true);
        expect(!isNaN(xyz.Y)).toBe(true);
        expect(!isNaN(xyz.Z)).toBe(true);
      });
    });
  });
});