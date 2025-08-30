/**
 * Tests for gamut validation and management functions
 */

import { describe, it, expect } from 'vitest';
import {
  isSrgbInGamut,
  clampSrgb,
  isLabInTypicalRange,
  isOklabInTypicalRange,
  isValidSrgbObject,
  isValidLabObject,
  scaleToSrgbGamut,
  getSrgbGamutInfo,
  clamp
} from '../src/gamut.js';

describe('Gamut Management', () => {
  
  describe('isSrgbInGamut', () => {
    it('should identify in-gamut colors', () => {
      expect(isSrgbInGamut({ r: 0.5, g: 0.3, b: 0.8 })).toBe(true);
      expect(isSrgbInGamut({ r: 0, g: 0, b: 0 })).toBe(true);
      expect(isSrgbInGamut({ r: 1, g: 1, b: 1 })).toBe(true);
    });
    
    it('should identify out-of-gamut colors', () => {
      expect(isSrgbInGamut({ r: 1.1, g: 0.5, b: 0.5 })).toBe(false);
      expect(isSrgbInGamut({ r: 0.5, g: -0.1, b: 0.5 })).toBe(false);
      expect(isSrgbInGamut({ r: 1.5, g: -0.5, b: 2 })).toBe(false);
    });
    
    it('should handle epsilon tolerance', () => {
      expect(isSrgbInGamut({ r: 1.0000000001, g: 0.5, b: 0.5 })).toBe(true);
      expect(isSrgbInGamut({ r: -0.0000000001, g: 0.5, b: 0.5 })).toBe(true);
      expect(isSrgbInGamut({ r: 1.001, g: 0.5, b: 0.5 }, 0.0001)).toBe(false);
    });
  });
  
  describe('clampSrgb', () => {
    it('should clamp out-of-range values', () => {
      const clamped = clampSrgb({ r: 1.2, g: 0.5, b: -0.1 });
      expect(clamped.r).toBe(1);
      expect(clamped.g).toBe(0.5);
      expect(clamped.b).toBe(0);
    });
    
    it('should not change in-range values', () => {
      const color = { r: 0.5, g: 0.3, b: 0.8 };
      const clamped = clampSrgb(color);
      expect(clamped).toEqual(color);
    });
    
    it('should handle extreme values', () => {
      const clamped = clampSrgb({ r: 1000, g: -1000, b: 0.5 });
      expect(clamped.r).toBe(1);
      expect(clamped.g).toBe(0);
      expect(clamped.b).toBe(0.5);
    });
  });
  
  describe('isLabInTypicalRange', () => {
    it('should identify typical Lab colors', () => {
      expect(isLabInTypicalRange({ L: 50, a: 20, b: -30 })).toBe(true);
      expect(isLabInTypicalRange({ L: 0, a: 0, b: 0 })).toBe(true);
      expect(isLabInTypicalRange({ L: 100, a: 127, b: -128 })).toBe(true);
    });
    
    it('should identify atypical Lab colors', () => {
      expect(isLabInTypicalRange({ L: 101, a: 0, b: 0 })).toBe(false);
      expect(isLabInTypicalRange({ L: -1, a: 0, b: 0 })).toBe(false);
      expect(isLabInTypicalRange({ L: 50, a: 200, b: 0 })).toBe(false);
    });
  });
  
  describe('isOklabInTypicalRange', () => {
    it('should identify typical Oklab colors', () => {
      expect(isOklabInTypicalRange({ L: 0.5, a: 0.1, b: -0.2 })).toBe(true);
      expect(isOklabInTypicalRange({ L: 0, a: 0, b: 0 })).toBe(true);
      expect(isOklabInTypicalRange({ L: 1, a: 0.4, b: -0.4 })).toBe(true);
    });
    
    it('should identify atypical Oklab colors', () => {
      expect(isOklabInTypicalRange({ L: 1.1, a: 0, b: 0 })).toBe(false);
      expect(isOklabInTypicalRange({ L: -0.1, a: 0, b: 0 })).toBe(false);
      expect(isOklabInTypicalRange({ L: 0.5, a: 0.5, b: 0 })).toBe(false);
    });
  });
  
  describe('isValidSrgbObject', () => {
    it('should validate proper sRGB objects', () => {
      expect(isValidSrgbObject({ r: 0.5, g: 0.3, b: 0.8 })).toBe(true);
      expect(isValidSrgbObject({ r: 0, g: 0, b: 0 })).toBe(true);
      expect(isValidSrgbObject({ r: -1, g: 2, b: 0.5 })).toBe(true); // Out of range but valid structure
    });
    
    it('should reject invalid sRGB objects', () => {
      expect(isValidSrgbObject(null)).toBe(false);
      expect(isValidSrgbObject(undefined)).toBe(false);
      expect(isValidSrgbObject('not an object')).toBe(false);
      expect(isValidSrgbObject({ r: 0.5, g: 0.5 })).toBe(false); // Missing b
      expect(isValidSrgbObject({ r: NaN, g: 0.5, b: 0.5 })).toBe(false);
      expect(isValidSrgbObject({ r: '0.5', g: 0.5, b: 0.5 })).toBe(false); // String
    });
  });
  
  describe('isValidLabObject', () => {
    it('should validate proper Lab objects', () => {
      expect(isValidLabObject({ L: 50, a: 20, b: -30 })).toBe(true);
      expect(isValidLabObject({ L: 0, a: 0, b: 0 })).toBe(true);
      expect(isValidLabObject({ L: 200, a: -200, b: 200 })).toBe(true); // Out of range but valid
    });
    
    it('should reject invalid Lab objects', () => {
      expect(isValidLabObject(null)).toBe(false);
      expect(isValidLabObject({ L: 50, a: 20 })).toBe(false); // Missing b
      expect(isValidLabObject({ L: NaN, a: 20, b: 30 })).toBe(false);
    });
  });
  
  describe('scaleToSrgbGamut', () => {
    it('should not change in-gamut colors', () => {
      const color = { r: 0.5, g: 0.3, b: 0.8 };
      const scaled = scaleToSrgbGamut(color);
      expect(scaled).toEqual(color);
    });
    
    it('should scale down colors that exceed 1', () => {
      const scaled = scaleToSrgbGamut({ r: 1.2, g: 0.6, b: 0.3 });
      expect(scaled.r).toBeCloseTo(1);
      expect(scaled.g).toBeCloseTo(0.5);
      expect(scaled.b).toBeCloseTo(0.25);
    });
    
    it('should handle negative values', () => {
      const scaled = scaleToSrgbGamut({ r: 1, g: 0.5, b: -0.1 });
      expect(scaled.r).toBeLessThanOrEqual(1);
      expect(scaled.g).toBeLessThanOrEqual(1);
      expect(scaled.b).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('getSrgbGamutInfo', () => {
    it('should provide info for in-gamut colors', () => {
      const info = getSrgbGamutInfo({ r: 0.5, g: 0.3, b: 0.8 });
      expect(info.inGamut).toBe(true);
      expect(info.maxExcess).toBe(0);
      expect(info.minDeficit).toBe(0);
      expect(info.channels).toEqual([0.5, 0.3, 0.8]);
    });
    
    it('should provide info for out-of-gamut colors', () => {
      const info = getSrgbGamutInfo({ r: 1.2, g: 0.5, b: -0.1 });
      expect(info.inGamut).toBe(false);
      expect(info.maxExcess).toBeCloseTo(0.2);
      expect(info.minDeficit).toBeCloseTo(0.1);
    });
  });
  
  describe('clamp helper', () => {
    it('should clamp values to range', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(1.5, 0, 1)).toBe(1);
      expect(clamp(-0.5, 0, 1)).toBe(0);
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(150, 0, 100)).toBe(100);
    });
  });
});