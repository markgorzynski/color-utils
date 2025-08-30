/**
 * Integration tests to ensure all modules work together
 */

import { describe, it, expect } from 'vitest';
import * as colorUtils from '../src/index.js';

describe('Integration Tests', () => {
  
  describe('Module Exports', () => {
    it('should export all expected functions', () => {
      // Core conversions
      expect(typeof colorUtils.srgbToLinearSrgb).toBe('function');
      expect(typeof colorUtils.linearSrgbToSrgb).toBe('function');
      expect(typeof colorUtils.srgbToXyz).toBe('function');
      expect(typeof colorUtils.xyzToSrgb).toBe('function');
      expect(typeof colorUtils.srgbToLab).toBe('function');
      expect(typeof colorUtils.labToSrgb).toBe('function');
      expect(typeof colorUtils.srgbToOklab).toBe('function');
      expect(typeof colorUtils.oklabToSrgb).toBe('function');
      
      // Advanced features
      expect(typeof colorUtils.AdaptiveOklab).toBe('function');
      expect(typeof colorUtils.gamutMapOklch).toBe('function');
      expect(typeof colorUtils.chromaticAdaptation).toBe('function');
      expect(typeof colorUtils.srgbToCiecam16).toBe('function');
      
      // New features
      expect(typeof colorUtils.srgbToDisplayP3).toBe('function');
      expect(typeof colorUtils.srgbToRec2020).toBe('function');
      expect(typeof colorUtils.parseCSS).toBe('function');
      expect(typeof colorUtils.srgbToCam16Ucs).toBe('function');
    });
  });
  
  describe('Basic Color Workflows', () => {
    it('should handle hex to Lab workflow', () => {
      const hex = '#ff6b6b';
      const srgb = colorUtils.parseSrgbHex(hex);
      expect(srgb).not.toBeNull();
      
      const lab = colorUtils.srgbToLab(srgb);
      expect(lab).toBeDefined();
      expect(lab.L).toBeGreaterThan(0);
      expect(lab.L).toBeLessThanOrEqual(100);
      
      const backToSrgb = colorUtils.labToSrgb(lab);
      const backToHex = colorUtils.formatSrgbAsHex(backToSrgb);
      expect(backToHex).toBe(hex);
    });
    
    it('should handle color difference calculations', () => {
      const color1 = { r: 1, g: 0, b: 0 };
      const color2 = { r: 0, g: 1, b: 0 };
      
      // WCAG contrast
      const contrast = colorUtils.calculateWcagContrast(color1, color2);
      expect(contrast).toBeGreaterThan(0);
      
      // CIEDE2000
      const lab1 = colorUtils.srgbToLab(color1);
      const lab2 = colorUtils.srgbToLab(color2);
      const deltaE = colorUtils.calculateCiede2000(lab1, lab2);
      expect(deltaE).toBeGreaterThan(0);
    });
    
    it('should handle wide gamut conversions', () => {
      const srgb = { r: 1, g: 0, b: 0 };
      
      // Display P3
      const p3 = colorUtils.srgbToDisplayP3(srgb);
      expect(p3).toBeDefined();
      expect(p3.r).toBeGreaterThanOrEqual(0);
      expect(p3.r).toBeLessThanOrEqual(1);
      
      // Rec. 2020
      const rec2020 = colorUtils.srgbToRec2020(srgb);
      expect(rec2020).toBeDefined();
      
      // Should be reversible
      const backFromP3 = colorUtils.displayP3ToSrgb(p3);
      expect(Math.abs(backFromP3.r - srgb.r)).toBeLessThan(0.01);
    });
    
    it('should handle CSS color parsing', () => {
      const tests = [
        { css: '#ff0000', expected: 'srgb' },
        { css: 'rgb(255 0 0)', expected: 'srgb' },
        { css: 'hsl(0deg 100% 50%)', expected: 'srgb' }
      ];
      
      tests.forEach(({ css }) => {
        const parsed = colorUtils.parseCSS(css);
        expect(parsed).toBeDefined();
        expect(parsed.r).toBeDefined();
        expect(parsed.g).toBeDefined();
        expect(parsed.b).toBeDefined();
      });
    });
  });
  
  describe('Adaptive Oklab', () => {
    it('should create and use adaptive instances', () => {
      const surrounds = ['white', 'gray', 'dark'];
      
      surrounds.forEach(surround => {
        const aok = new colorUtils.AdaptiveOklab({ surround });
        expect(aok).toBeDefined();
        
        const srgb = { r: 0.5, g: 0.5, b: 0.5 };
        const adapted = aok.fromSrgb(srgb);
        expect(adapted).toBeDefined();
        expect(adapted.L).toBeGreaterThanOrEqual(0);
        expect(adapted.L).toBeLessThanOrEqual(1);
        
        const back = aok.toSrgb(adapted);
        expect(Math.abs(back.r - srgb.r)).toBeLessThan(0.1);
      });
    });
  });
  
  describe('Gamut Mapping', () => {
    it('should map colors into gamut', () => {
      // Create an out-of-gamut color
      const vibrant = { L: 0.8, C: 0.5, h: 30 };
      
      // Check if it's out of gamut
      const isOut = !colorUtils.isInGamut(vibrant, 'oklch', 'srgb');
      
      // Map it
      const mapped = colorUtils.gamutMapOklch(vibrant, 'srgb');
      expect(mapped).toBeDefined();
      
      // Should now be in gamut
      const isIn = colorUtils.isInGamut(mapped, 'oklch', 'srgb');
      expect(isIn).toBe(true);
    });
  });
  
  describe('Chromatic Adaptation', () => {
    it('should adapt between illuminants', () => {
      const xyz = { X: 50, Y: 50, Z: 50 };
      
      // D65 to D50
      const d50 = colorUtils.xyzD65ToD50(xyz);
      expect(d50).toBeDefined();
      expect(d50.X).toBeGreaterThan(0);
      
      // And back
      const d65 = colorUtils.xyzD50ToD65(d50);
      expect(Math.abs(d65.X - xyz.X)).toBeLessThan(0.1);
      expect(Math.abs(d65.Y - xyz.Y)).toBeLessThan(0.1);
      expect(Math.abs(d65.Z - xyz.Z)).toBeLessThan(0.1);
    });
  });
  
  describe('CIECAM16', () => {
    it('should calculate appearance attributes', () => {
      const srgb = { r: 0.7, g: 0.3, b: 0.1 };
      const conditions = {
        whitePoint: { X: 95.047, Y: 100, Z: 108.883 },
        adaptingLuminance: 40,
        backgroundLuminance: 20,
        surround: 'average',
        discounting: false
      };
      
      const appearance = colorUtils.srgbToCiecam16(srgb, conditions);
      expect(appearance).toBeDefined();
      expect(appearance.J).toBeGreaterThan(0);
      expect(appearance.J).toBeLessThanOrEqual(100);
      expect(appearance.C).toBeGreaterThan(0);
      expect(appearance.h).toBeGreaterThanOrEqual(0);
      expect(appearance.h).toBeLessThan(360);
    });
  });
  
  describe('CAM16-UCS', () => {
    it('should convert to uniform space', () => {
      const srgb = { r: 0.5, g: 0.7, b: 0.3 };
      const ucs = colorUtils.srgbToCam16Ucs(srgb);
      
      expect(ucs).toBeDefined();
      expect(ucs.J).toBeGreaterThan(0);
      expect(typeof ucs.a).toBe('number');
      expect(typeof ucs.b).toBe('number');
    });
  });
  
  describe('Chroma Control', () => {
    it('should find maximum chroma', () => {
      const result = colorUtils.findMaxAokChromaForLabL(50, 30);
      
      expect(result).toBeDefined();
      expect(result.maxChroma).toBeGreaterThan(0);
      expect(result.labL).toBeCloseTo(50, 1);
    });
  });
  
  describe('Utility Functions', () => {
    it('should provide utility functions', () => {
      // Math utilities
      expect(colorUtils.clamp(1.5, 0, 1)).toBe(1);
      expect(colorUtils.clamp(-0.5, 0, 1)).toBe(0);
      expect(colorUtils.clamp(0.5, 0, 1)).toBe(0.5);
      
      expect(colorUtils.lerp(0, 10, 0.5)).toBe(5);
      
      // Angle conversions
      expect(colorUtils.degreesToRadians(180)).toBeCloseTo(Math.PI, 5);
      expect(colorUtils.radiansToDegrees(Math.PI)).toBeCloseTo(180, 5);
      
      // Hue normalization
      expect(colorUtils.normalizeHue(370)).toBe(10);
      expect(colorUtils.normalizeHue(-10)).toBe(350);
    });
  });
});