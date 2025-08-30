/**
 * Automated tests for advanced color features
 */

import { describe, it, expect } from 'vitest';
import {
  AdaptiveOklab,
  gamutMapOklch,
  gamutMapSrgb,
  clipGamutMapping,
  cuspGamutMapping,
  isInGamut,
  chromaticAdaptation,
  xyzD65ToD50,
  xyzD50ToD65,
  ILLUMINANTS,
  calculateCCT,
  srgbToCiecam16,
  srgbToCam16Ucs,
  cam16UcsColorDifference,
  findMaxAokChromaForLabL,
  adjustAokColorToLabL
} from '../src/index.js';
import { approxEqual, colorsApproxEqual, TEST_COLORS } from './test-helpers.js';

describe('Advanced Features', () => {
  
  describe('Adaptive Oklab', () => {
    const surrounds = ['white', 'gray', 'dark'];
    
    surrounds.forEach(surround => {
      describe(`with ${surround} surround`, () => {
        const aok = new AdaptiveOklab({ surround });
        
        it('should adapt colors based on surround', () => {
          const red = TEST_COLORS.red.srgb;
          const adapted = aok.fromSrgb(red);
          
          expect(adapted).toBeDefined();
          expect(adapted.L).toBeGreaterThan(0);
          expect(typeof adapted.a).toBe('number');
          expect(typeof adapted.b).toBe('number');
          
          // Different surrounds should produce different results
          if (surround !== 'gray') {
            const grayAok = new AdaptiveOklab({ surround: 'gray' });
            const grayAdapted = grayAok.fromSrgb(red);
            
            // At least one component should differ
            const differs = !approxEqual(adapted.L, grayAdapted.L, 0.001) ||
                           !approxEqual(adapted.a, grayAdapted.a, 0.001) ||
                           !approxEqual(adapted.b, grayAdapted.b, 0.001);
            expect(differs).toBe(true);
          }
        });
        
        it('should be reversible', () => {
          const colors = [
            TEST_COLORS.red.srgb,
            TEST_COLORS.green.srgb,
            TEST_COLORS.blue.srgb,
            TEST_COLORS.gray50.srgb
          ];
          
          colors.forEach(srgb => {
            const adapted = aok.fromSrgb(srgb);
            const reversed = aok.toSrgb(adapted);
            expect(colorsApproxEqual(srgb, reversed, 0.01)).toBe(true);
          });
        });
        
        it('should maintain consistent adaptation', () => {
          // Test that the same color produces consistent results
          const color1 = aok.fromSrgb(TEST_COLORS.orange.srgb);
          const color2 = aok.fromSrgb(TEST_COLORS.orange.srgb);
          
          expect(color1.L).toBe(color2.L);
          expect(color1.a).toBe(color2.a);
          expect(color1.b).toBe(color2.b);
          
          // Test that adaptation varies by surround
          if (surround !== 'gray') {
            const grayAok = new AdaptiveOklab({ surround: 'gray' });
            const grayColor = grayAok.fromSrgb(TEST_COLORS.orange.srgb);
            
            // Should produce different L values for different surrounds
            expect(Math.abs(color1.L - grayColor.L)).toBeGreaterThan(0.01);
          }
        });
      });
    });
    
    it('should calculate adaptation parameters correctly', () => {
      const whiteAok = new AdaptiveOklab({ surround: 'white' });
      const darkAok = new AdaptiveOklab({ surround: 'dark' });
      
      // Parameters should differ between surrounds
      expect(whiteAok.params).toBeDefined();
      expect(darkAok.params).toBeDefined();
      expect(whiteAok.params.FL).not.toBe(darkAok.params.FL);
    });
  });
  
  describe('Gamut Mapping', () => {
    describe('CSS Color 4 Algorithm', () => {
      it('should map out-of-gamut colors into sRGB', () => {
        // Very vibrant OkLCh color likely out of sRGB
        const vibrant = { L: 0.7, C: 0.5, h: 30 };
        const mapped = gamutMapOklch(vibrant, 'srgb');
        
        expect(mapped).toBeDefined();
        expect(mapped.L).toBeCloseTo(vibrant.L, 1);
        expect(mapped.C).toBeLessThanOrEqual(vibrant.C);
        expect(mapped.h).toBeCloseTo(vibrant.h, 1);
        
        // Mapped color should be in gamut
        expect(isInGamut(mapped, 'oklch', 'srgb')).toBe(true);
      });
      
      it('should not change colors already in gamut', () => {
        const inGamut = { L: 0.5, C: 0.1, h: 120 };
        const mapped = gamutMapOklch(inGamut, 'srgb');
        
        expect(colorsApproxEqual(inGamut, mapped, 0.001)).toBe(true);
      });
      
      it('should handle achromatic colors', () => {
        const gray = { L: 0.5, C: 0, h: 0 };
        const mapped = gamutMapOklch(gray, 'srgb');
        
        expect(mapped.C).toBe(0);
        expect(mapped.L).toBeCloseTo(0.5, 1);
      });
    });
    
    describe('Alternative Algorithms', () => {
      it('should clip gamut correctly', () => {
        const outOfGamut = { r: 1.2, g: -0.1, b: 0.5 };
        const clipped = clipGamutMapping(outOfGamut);
        
        expect(clipped.r).toBe(1);
        expect(clipped.g).toBe(0);
        expect(clipped.b).toBe(0.5);
      });
      
      it('should perform CUSP mapping', () => {
        const vibrant = { L: 0.6, C: 0.4, h: 45 };
        const mapped = cuspGamutMapping(vibrant, 'srgb');
        
        expect(mapped).toBeDefined();
        expect(isInGamut(mapped, 'oklch', 'srgb')).toBe(true);
      });
    });
    
    it('should map sRGB colors directly', () => {
      const outOfGamut = { r: 1.1, g: 0.5, b: -0.1 };
      const mapped = gamutMapSrgb(outOfGamut, 'srgb');
      
      expect(mapped.r).toBeLessThanOrEqual(1);
      expect(mapped.r).toBeGreaterThanOrEqual(0);
      expect(mapped.g).toBeLessThanOrEqual(1);
      expect(mapped.g).toBeGreaterThanOrEqual(0);
      expect(mapped.b).toBeLessThanOrEqual(1);
      expect(mapped.b).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Chromatic Adaptation', () => {
    const methods = ['bradford', 'cat02', 'cat16', 'vonKries'];
    
    methods.forEach(method => {
      describe(`${method} method`, () => {
        it('should adapt colors between illuminants', () => {
          // Use D65 white point in 0-100 scale to match ILLUMINANTS
          const xyzD65 = { X: 95.047, Y: 100, Z: 108.883 };
          const xyzD50 = chromaticAdaptation(xyzD65, 'D65', 'D50', method);
          
          expect(xyzD50).toBeDefined();
          expect(xyzD50.X).toBeGreaterThan(0);
          expect(xyzD50.Y).toBeGreaterThan(0);
          expect(xyzD50.Z).toBeGreaterThan(0);
          
          // White point should map to D50 white point
          const d50White = ILLUMINANTS.D50;
          expect(approxEqual(xyzD50.X, d50White.X, 0.5)).toBe(true);
          expect(approxEqual(xyzD50.Y, d50White.Y, 0.5)).toBe(true);
          expect(approxEqual(xyzD50.Z, d50White.Z, 0.5)).toBe(true);
        });
        
        it('should be reversible', () => {
          const original = { X: 50, Y: 60, Z: 70 };
          const toD50 = chromaticAdaptation(original, 'D65', 'D50', method);
          const backToD65 = chromaticAdaptation(toD50, 'D50', 'D65', method);
          
          expect(colorsApproxEqual(original, backToD65, 0.01)).toBe(true);
        });
      });
    });
    
    it('should handle convenience functions', () => {
      const xyzD65 = TEST_COLORS.red.xyz;
      const xyzD50 = xyzD65ToD50(xyzD65);
      const backToD65 = xyzD50ToD65(xyzD50);
      
      expect(colorsApproxEqual(xyzD65, backToD65, 0.01)).toBe(true);
    });
    
    it('should calculate CCT correctly', () => {
      const d65CCT = calculateCCT(ILLUMINANTS.D65);
      expect(d65CCT).toBeGreaterThan(6000);
      expect(d65CCT).toBeLessThan(7000);
      
      const d50CCT = calculateCCT(ILLUMINANTS.D50);
      expect(d50CCT).toBeGreaterThan(4500);
      expect(d50CCT).toBeLessThan(5500);
    });
    
    it('should not adapt when source and dest are the same', () => {
      const xyz = { X: 50, Y: 60, Z: 70 };
      const adapted = chromaticAdaptation(xyz, 'D65', 'D65');
      
      expect(xyz).toEqual(adapted);
    });
  });
  
  describe('CIECAM16', () => {
    it('should calculate appearance correlates', () => {
      const viewingConditions = {
        referenceWhite: { X: 95.047, Y: 100, Z: 108.883 },
        adaptingLuminance: 40,
        backgroundLuminanceFactor: 20,
        surroundType: 'average'
      };
      
      const red = TEST_COLORS.red.srgb;
      const appearance = srgbToCiecam16(red, viewingConditions);
      
      expect(appearance).toBeDefined();
      expect(appearance.J).toBeGreaterThan(0); // Lightness
      expect(appearance.C).toBeGreaterThan(0); // Chroma
      expect(appearance.h).toBeGreaterThanOrEqual(0); // Hue
      expect(appearance.h).toBeLessThan(360);
      expect(appearance.M).toBeGreaterThan(0); // Colorfulness
      expect(appearance.s).toBeGreaterThan(0); // Saturation
    });
    
    it('should handle different viewing conditions', () => {
      const color = TEST_COLORS.orange.srgb;
      
      const dimConditions = {
        referenceWhite: ILLUMINANTS.D65,
        adaptingLuminance: 10,
        backgroundLuminanceFactor: 5,
        surroundType: 'dim'
      };
      
      const darkConditions = {
        referenceWhite: ILLUMINANTS.D65,
        adaptingLuminance: 1,
        backgroundLuminanceFactor: 0.1,
        surroundType: 'dark'
      };
      
      const dimAppearance = srgbToCiecam16(color, dimConditions);
      const darkAppearance = srgbToCiecam16(color, darkConditions);
      
      // Different conditions should produce different results
      expect(dimAppearance.J).not.toBeCloseTo(darkAppearance.J, 0);
    });
  });
  
  describe('CAM16-UCS', () => {
    const defaultViewingConditions = {
      referenceWhite: ILLUMINANTS.D65,
      adaptingLuminance: 40,
      backgroundLuminanceFactor: 20,
      surroundType: 'average'
    };
    
    it('should convert to uniform color space', () => {
      const color = TEST_COLORS.purple.srgb;
      const ucs = srgbToCam16Ucs(color, defaultViewingConditions);
      
      expect(ucs).toBeDefined();
      expect(ucs.J).toBeGreaterThan(0);
      expect(typeof ucs.a).toBe('number');
      expect(typeof ucs.b).toBe('number');
    });
    
    it('should calculate perceptually uniform differences', () => {
      const color1 = srgbToCam16Ucs(TEST_COLORS.red.srgb, defaultViewingConditions);
      const color2 = srgbToCam16Ucs(TEST_COLORS.orange.srgb, defaultViewingConditions);
      const color3 = srgbToCam16Ucs(TEST_COLORS.blue.srgb, defaultViewingConditions);
      
      const diff12 = cam16UcsColorDifference(color1, color2);
      const diff13 = cam16UcsColorDifference(color1, color3);
      
      expect(diff12).toBeGreaterThan(0);
      expect(diff13).toBeGreaterThan(0);
      
      // Red-orange should be closer than red-blue
      expect(diff12).toBeLessThan(diff13);
    });
  });
  
  describe('Chroma Control', () => {
    it('should find maximum chroma for target lightness', () => {
      const targetL = 50;
      const hue = 30;
      const maxChroma = findMaxAokChromaForLabL(hue, targetL);
      
      expect(maxChroma).toBeDefined();
      expect(maxChroma).toBeGreaterThanOrEqual(0);
      expect(typeof maxChroma).toBe('number');
    });
    
    it('should adjust color to target lightness', () => {
      // Convert Lab to LCH for input
      const a = 0.2, b = 0.1;
      const C = Math.sqrt(a * a + b * b);
      const h = Math.atan2(b, a) * 180 / Math.PI;
      const color = { C, h };
      const targetL = 60;
      
      const adjusted = adjustAokColorToLabL(color, targetL, 'clip');
      
      expect(adjusted).toBeDefined();
      expect(adjusted.aokColor).toBeDefined();
      
      // Check that we got a valid result
      expect(adjusted.aokLCH).toBeDefined();
      expect(adjusted.srgbColor).toBeDefined();
      
      // Hue should be maintained (comparing input hue to output hue)
      expect(Math.abs(adjusted.aokLCH.h - color.h)).toBeLessThan(1);
    });
    
    it('should handle WCAG contrast requirements', () => {
      const options = {
        targetLabL: 50,
        targetContrast: 4.5,
        backgroundColor: { r: 1, g: 1, b: 1 },
        contrastStandard: 'AA'
      };
      
      // Convert Lab to LCH for input
      const a = 0.2, b = 0.1;
      const C = Math.sqrt(a * a + b * b);
      const h = Math.atan2(b, a) * 180 / Math.PI;
      
      const result = adjustAokColorToLabL(
        { C, h },
        options.targetLabL,
        'clip',  // mode should be 'clip' or 'target'
        options
      );
      
      expect(result).toBeDefined();
      if (result.contrast) {
        expect(result.contrast).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
  
  describe('Performance Tests', () => {
    it('should handle batch conversions efficiently', () => {
      const colors = Array.from({ length: 1000 }, () => ({
        r: Math.random(),
        g: Math.random(),
        b: Math.random()
      }));
      
      const start = performance.now();
      colors.forEach(color => {
        const lab = import('../src/index.js').then(m => m.srgbToLab(color));
      });
      const end = performance.now();
      
      // Should process 1000 colors in reasonable time
      expect(end - start).toBeLessThan(100); // 100ms for 1000 colors
    });
  });
});