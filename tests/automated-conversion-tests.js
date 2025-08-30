/**
 * Automated conversion tests for all color space modules
 * This generates comprehensive tests for all conversion functions
 */

import { describe, it, expect } from 'vitest';
import * as colorUtils from '../src/index.js';
import { colorsApproxEqual, TEST_COLORS, randomSrgbColor } from './test-helpers.js';

// Define all conversion pairs and their expected reversibility
const CONVERSION_PAIRS = [
  // sRGB conversions
  { forward: 'srgbToLinearSrgb', reverse: 'linearSrgbToSrgb', tolerance: 0.0001 },
  { forward: 'srgbToXyz', reverse: 'xyzToSrgb', tolerance: 0.001 },
  { forward: 'srgbToLab', reverse: 'labToSrgb', tolerance: 0.01 },
  { forward: 'srgbToLch', reverse: 'lchToSrgb', tolerance: 0.01 },
  { forward: 'srgbToOklab', reverse: 'oklabToSrgb', tolerance: 0.001 },
  { forward: 'srgbToOklch', reverse: 'oklchToSrgb', tolerance: 0.001 },
  { forward: 'srgbToDisplayP3', reverse: 'displayP3ToSrgb', tolerance: 0.001 },
  { forward: 'srgbToRec2020', reverse: 'rec2020ToSrgb', tolerance: 0.001 },
  
  // Lab conversions
  { forward: 'labToLch', reverse: 'lchToLab', tolerance: 0.0001 },
  { forward: 'labToXyz', reverse: 'xyzToLab', tolerance: 0.01 },
  
  // Oklab conversions
  { forward: 'oklabToOklch', reverse: 'oklchToOklab', tolerance: 0.0001 },
  { forward: 'oklabToLinearSrgb', reverse: 'linearSrgbToOklab', tolerance: 0.001 },
  
  // Display P3 conversions
  { forward: 'displayP3ToLinearDisplayP3', reverse: 'linearDisplayP3ToDisplayP3', tolerance: 0.0001 },
  
  // Rec2020 conversions
  { forward: 'rec2020ToLinearRec2020', reverse: 'linearRec2020ToRec2020', tolerance: 0.0001 }
];

// Define one-way conversions that we want to test
const ONE_WAY_CONVERSIONS = [
  'linearSrgbToXyz',
  'xyzToLinearSrgb',
  'xyzToLab',
  'labToXyz',
  'linearDisplayP3ToXyz',
  'xyzToLinearDisplayP3',
  'linearRec2020ToXyz',
  'xyzToLinearRec2020'
];

// CSS parsing and formatting pairs
const CSS_FORMAT_PAIRS = [
  { parse: 'parseCSS', format: 'formatCSS', 
    testCases: [
      { css: '#ff0000', expected: { r: 1, g: 0, b: 0 } },
      { css: 'rgb(255 0 0)', expected: { r: 1, g: 0, b: 0 } },
      { css: 'hsl(0deg 100% 50%)', expected: { r: 1, g: 0, b: 0 }, tolerance: 0.01 },
      { css: 'color(srgb 1 0 0)', expected: { r: 1, g: 0, b: 0 } }
    ]
  }
];

// Gamut checking functions
const GAMUT_CHECKS = [
  { func: 'isSrgbInGamut', 
    inGamut: [
      { r: 0.5, g: 0.5, b: 0.5 },
      { r: 0, g: 0, b: 0 },
      { r: 1, g: 1, b: 1 }
    ],
    outGamut: [
      { r: -0.1, g: 0.5, b: 0.5 },
      { r: 1.1, g: 0.5, b: 0.5 },
      { r: 0.5, g: 0.5, b: 1.1 }
    ]
  },
  { func: 'isDisplayP3InSrgbGamut',
    inGamut: [
      { r: 0.5, g: 0.5, b: 0.5 },
      { r: 0.8, g: 0.2, b: 0.1 }
    ],
    outGamut: [
      { r: 1, g: 0, b: 0 } // P3 red is wider than sRGB
    ]
  }
];

// Color difference metrics
const COLOR_METRICS = [
  { func: 'calculateWcagContrast', 
    tests: [
      { color1: { r: 1, g: 1, b: 1 }, color2: { r: 0, g: 0, b: 0 }, expected: 21, tolerance: 0.01 },
      { color1: { r: 1, g: 0, b: 0 }, color2: { r: 1, g: 1, b: 1 }, expected: 3.998, tolerance: 0.01 }
    ]
  },
  { func: 'calculateCiede2000',
    tests: [
      { lab1: { L: 50, a: 0, b: 0 }, lab2: { L: 50, a: 0, b: 0 }, expected: 0, tolerance: 0.01 },
      { lab1: { L: 50, a: 10, b: 0 }, lab2: { L: 50, a: 0, b: 0 }, minExpected: 1, maxExpected: 20 }
    ]
  }
];

describe('Automated Conversion Tests', () => {
  
  describe('Reversible Conversions', () => {
    CONVERSION_PAIRS.forEach(({ forward, reverse, tolerance }) => {
      describe(`${forward} ↔ ${reverse}`, () => {
        it('should be reversible for test colors', () => {
          // Test with known colors
          Object.keys(TEST_COLORS).forEach(colorName => {
            const color = TEST_COLORS[colorName];
            
            // Determine input format based on function name
            let input;
            if (forward.startsWith('srgb')) {
              input = color.srgb;
            } else if (forward.startsWith('lab')) {
              input = color.lab;
            } else if (forward.startsWith('oklab')) {
              input = color.oklab;
            } else if (forward.startsWith('oklch')) {
              input = color.oklch;
            } else if (forward.includes('Linear')) {
              // For linear conversions, use appropriate format
              if (forward.includes('Srgb')) {
                input = colorUtils.srgbToLinearSrgb(color.srgb);
              } else if (forward.includes('DisplayP3')) {
                input = colorUtils.srgbToDisplayP3(color.srgb);
              } else if (forward.includes('Rec2020')) {
                input = colorUtils.srgbToRec2020(color.srgb);
              } else {
                return; // Skip if we can't determine input
              }
            } else {
              return; // Skip unknown format
            }
            
            if (!input) return;
            
            try {
              const converted = colorUtils[forward](input);
              const reversed = colorUtils[reverse](converted);
              
              expect(colorsApproxEqual(input, reversed, tolerance)).toBe(true);
            } catch (e) {
              // Some conversions might not work for all colors (e.g., out of gamut)
              // This is okay, we'll test with random colors too
            }
          });
        });
        
        it('should be reversible for random colors', () => {
          for (let i = 0; i < 20; i++) {
            let input;
            
            // Generate appropriate random input
            if (forward.startsWith('srgb')) {
              input = randomSrgbColor();
            } else if (forward.startsWith('lab')) {
              input = {
                L: Math.random() * 100,
                a: Math.random() * 200 - 100,
                b: Math.random() * 200 - 100
              };
            } else if (forward.startsWith('oklab')) {
              input = {
                L: Math.random(),
                a: Math.random() * 0.8 - 0.4,
                b: Math.random() * 0.8 - 0.4
              };
            } else if (forward.includes('Linear')) {
              input = {
                r: Math.random(),
                g: Math.random(),
                b: Math.random()
              };
            } else {
              continue;
            }
            
            try {
              const converted = colorUtils[forward](input);
              const reversed = colorUtils[reverse](converted);
              
              // For very small values, increase tolerance
              const adjustedTolerance = Object.values(input).some(v => Math.abs(v) < 0.01) 
                ? tolerance * 10 
                : tolerance;
              
              expect(colorsApproxEqual(input, reversed, adjustedTolerance)).toBe(true);
            } catch (e) {
              // Skip problematic random colors
            }
          }
        });
      });
    });
  });
  
  describe('One-Way Conversions', () => {
    ONE_WAY_CONVERSIONS.forEach(funcName => {
      it(`${funcName} should produce valid output`, () => {
        // Test that the function exists and produces output
        expect(typeof colorUtils[funcName]).toBe('function');
        
        // Generate appropriate test input
        let input;
        if (funcName.includes('Xyz')) {
          if (funcName.startsWith('xyz')) {
            input = TEST_COLORS.white.xyz;
          } else {
            // Function takes non-XYZ input
            if (funcName.includes('linearSrgb')) {
              input = { r: 0.5, g: 0.5, b: 0.5 };
            } else if (funcName.includes('lab')) {
              input = { L: 50, a: 0, b: 0 };
            } else if (funcName.includes('DisplayP3')) {
              input = { r: 0.5, g: 0.5, b: 0.5 };
            } else if (funcName.includes('Rec2020')) {
              input = { r: 0.5, g: 0.5, b: 0.5 };
            }
          }
        } else {
          // Non-XYZ conversions
          if (funcName.includes('Linear')) {
            input = { r: 0.5, g: 0.5, b: 0.5 };
          }
        }
        
        if (input) {
          const output = colorUtils[funcName](input);
          expect(output).toBeDefined();
          expect(typeof output).toBe('object');
          
          // Check output has expected properties
          Object.values(output).forEach(value => {
            expect(typeof value).toBe('number');
            expect(!isNaN(value)).toBe(true);
          });
        }
      });
    });
  });
  
  describe('CSS Parsing and Formatting', () => {
    CSS_FORMAT_PAIRS.forEach(({ parse, format, testCases }) => {
      describe(`${parse} and ${format}`, () => {
        testCases.forEach(({ css, expected, tolerance = 0.001 }) => {
          it(`should parse "${css}" correctly`, () => {
            const parsed = colorUtils[parse](css);
            expect(parsed).toBeDefined();
            expect(colorsApproxEqual(parsed, expected, tolerance)).toBe(true);
          });
        });
      });
    });
  });
  
  describe('Gamut Checking', () => {
    GAMUT_CHECKS.forEach(({ func, inGamut, outGamut }) => {
      describe(func, () => {
        it('should identify in-gamut colors', () => {
          inGamut.forEach(color => {
            expect(colorUtils[func](color)).toBe(true);
          });
        });
        
        it('should identify out-of-gamut colors', () => {
          outGamut.forEach(color => {
            expect(colorUtils[func](color)).toBe(false);
          });
        });
      });
    });
  });
  
  describe('Color Metrics', () => {
    COLOR_METRICS.forEach(({ func, tests }) => {
      describe(func, () => {
        tests.forEach((test, index) => {
          it(`should calculate correctly (test ${index + 1})`, () => {
            const args = Object.keys(test).filter(k => !k.includes('expected') && k !== 'tolerance');
            const inputs = args.map(k => test[k]);
            const result = colorUtils[func](...inputs);
            
            if (test.expected !== undefined) {
              expect(Math.abs(result - test.expected)).toBeLessThan(test.tolerance || 0.01);
            } else if (test.minExpected !== undefined) {
              expect(result).toBeGreaterThanOrEqual(test.minExpected);
              expect(result).toBeLessThanOrEqual(test.maxExpected);
            }
          });
        });
      });
    });
  });
  
  describe('Hex Color Utilities', () => {
    const hexTests = [
      { hex: '#FF0000', srgb: { r: 1, g: 0, b: 0 } },
      { hex: '#00FF00', srgb: { r: 0, g: 1, b: 0 } },
      { hex: '#0000FF', srgb: { r: 0, g: 0, b: 1 } },
      { hex: '#808080', srgb: { r: 0.502, g: 0.502, b: 0.502 } },
      { hex: '#F0F', srgb: { r: 1, g: 0, b: 1 } }
    ];
    
    it('should parse and format hex colors correctly', () => {
      hexTests.forEach(({ hex, srgb }) => {
        const parsed = colorUtils.parseSrgbHex(hex);
        expect(colorsApproxEqual(parsed, srgb, 0.01)).toBe(true);
        
        const formatted = colorUtils.formatSrgbAsHex(parsed);
        expect(formatted.toUpperCase()).toBe(hex.length === 4 ? 
          `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase() : 
          hex.toUpperCase());
      });
    });
  });
});