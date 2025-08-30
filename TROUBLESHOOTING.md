# Troubleshooting Guide

## Common Issues and Solutions

### 1. Colors Look Wrong After Conversion

#### Symptom
Colors appear significantly different after converting between color spaces.

#### Common Causes & Solutions

**A. Wrong XYZ Scale**
```javascript
// ❌ Wrong: Using 0-100 scale
const xyz = { X: 41.24, Y: 21.26, Z: 1.93 };

// ✅ Correct: Using 0-1 scale
const xyz = { X: 0.4124, Y: 0.2126, Z: 0.0193 };
```

**B. Out-of-Gamut Colors**
```javascript
// Check if color is in gamut
import { isSrgbInGamut, gamutMapToSrgb } from 'color-utils';

if (!isSrgbInGamut(color)) {
  console.warn('Color out of gamut!');
  color = gamutMapToSrgb(color); // Map to gamut
}
```

**C. Wrong Color Space Assumption**
```javascript
// ❌ Wrong: Assuming linear RGB
const color = { r: 128/255, g: 64/255, b: 192/255 };

// ✅ Correct: These are sRGB values (gamma-encoded)
const srgb = { r: 128/255, g: 64/255, b: 192/255 };
const linear = srgbToLinearSrgb(srgb); // Now linear
```

### 2. Round-Trip Conversions Don't Match

#### Symptom
Converting from A→B→A doesn't return the original color.

#### Solutions

**A. Expected Precision Loss**
```javascript
// Small differences are normal due to floating-point math
const original = { r: 0.5, g: 0.3, b: 0.8 };
const lab = srgbToLab(original);
const backToSrgb = labToSrgb(lab);

// Use approximate equality
function colorsEqual(c1, c2, tolerance = 0.001) {
  return Math.abs(c1.r - c2.r) < tolerance &&
         Math.abs(c1.g - c2.g) < tolerance &&
         Math.abs(c1.b - c2.b) < tolerance;
}

console.assert(colorsEqual(original, backToSrgb)); // ✅ Passes
```

**B. Out-of-Gamut Intermediate Values**
```javascript
// Some conversions may go out of gamut temporarily
const vibrantLch = { L: 50, C: 150, h: 30 }; // Very high chroma
const srgb = lchToSrgb(vibrantLch); // May be out of gamut
const backToLch = srgbToLch(clampSrgb(srgb)); // Clamp first

// Chroma will be reduced due to gamut limitations
console.log(backToLch.C); // Less than 150
```

### 3. TypeError: Cannot read property 'r' of undefined

#### Symptom
Functions throw errors about missing properties.

#### Solutions

**A. Check for Null Returns**
```javascript
// ❌ Wrong: Not checking for null
const color = parseSrgbHex(userInput);
const lab = srgbToLab(color); // Error if parseSrgbHex returned null

// ✅ Correct: Check for null
const color = parseSrgbHex(userInput);
if (color === null) {
  console.error('Invalid hex color');
  return;
}
const lab = srgbToLab(color);
```

**B. Validate Object Structure**
```javascript
import { isValidSrgbObject } from 'color-utils';

function processColor(color) {
  if (!isValidSrgbObject(color)) {
    throw new Error('Invalid color object');
  }
  return srgbToLab(color);
}
```

### 4. Adaptive Oklab Not Working as Expected

#### Symptom
Adaptive Oklab doesn't produce expected adaptations.

#### Solutions

**A. Check Surround Setting**
```javascript
// Make sure you're using the right surround
const adapters = {
  lightMode: new AdaptiveOklab({ surround: 'white' }),
  darkMode: new AdaptiveOklab({ surround: 'dark' }),
  balanced: new AdaptiveOklab({ surround: 'gray' })
};
```

**B. Understanding x0 Parameter**
```javascript
// x0 affects hue correction, not adaptation strength
const defaultAdapter = new AdaptiveOklab({ x0: 0.5 }); // Default
const customAdapter = new AdaptiveOklab({ x0: 0.3 });  // Different hue behavior

// Both adapt equally, but handle hues differently
```

### 5. WCAG Contrast Calculations Seem Wrong

#### Symptom
Contrast ratios don't match other tools.

#### Solutions

**A. Colors Must Be in sRGB [0,1]**
```javascript
// ❌ Wrong: Using 0-255 values
const contrast = calculateWcagContrast(
  { r: 255, g: 128, b: 0 },
  { r: 0, g: 0, b: 0 }
);

// ✅ Correct: Use 0-1 range
const contrast = calculateWcagContrast(
  { r: 1, g: 0.5, b: 0 },
  { r: 0, g: 0, b: 0 }
);
```

**B. Check Color Order**
```javascript
// Contrast ratio is symmetric, but be consistent
const ratio1 = calculateWcagContrast(foreground, background);
const ratio2 = calculateWcagContrast(background, foreground);
console.assert(ratio1 === ratio2); // Always true
```

### 6. CSS Color Parsing Fails

#### Symptom
`parseCSS()` returns null for seemingly valid CSS.

#### Solutions

**A. Check Supported Formats**
```javascript
// ✅ Supported formats
parseCSS('#FF6B35');
parseCSS('rgb(255, 107, 53)');
parseCSS('lab(50% 40 30)');
parseCSS('oklch(0.7 0.2 150deg)');
parseCSS('color(display-p3 1 0 0.5)');

// ❌ Not supported (yet)
parseCSS('var(--brand-color)');  // CSS variables
parseCSS('currentColor');        // Keywords
parseCSS('rgb(from #f00 r g b)'); // Relative colors
```

**B. Check Syntax Details**
```javascript
// Spaces matter in modern syntax
parseCSS('lab(50% 40 30)');    // ✅ Correct
parseCSS('lab(50%, 40, 30)');  // ❌ Wrong (no commas in modern syntax)

// Angles need units in CSS
parseCSS('oklch(0.7 0.2 150deg)'); // ✅ Correct
parseCSS('oklch(0.7 0.2 150)');    // ❌ Wrong (missing deg)
```

### 7. Performance Issues

#### Symptom
Color conversions are slow in hot paths.

#### Solutions

**A. Avoid Validation in Loops**
```javascript
// ❌ Slow: Validation in hot loop
for (let i = 0; i < 1000000; i++) {
  if (!isSrgbInGamut(colors[i])) {
    colors[i] = clampSrgb(colors[i]);
  }
  results[i] = srgbToLab(colors[i]);
}

// ✅ Fast: Direct conversion
for (let i = 0; i < 1000000; i++) {
  results[i] = srgbToLab(colors[i]);
}
// Validate once at the end if needed
```

**B. Use Direct Conversions**
```javascript
// ❌ Slow: Multiple intermediate conversions
const lab = srgbToLab(color);
const lch = labToLch(lab);
const labBack = lchToLab(lch);
const final = labToSrgb(labBack);

// ✅ Fast: Direct conversion
const lch = srgbToLch(color);
const final = lchToSrgb(lch);
```

### 8. Import Errors

#### Symptom
Cannot import functions or getting module errors.

#### Solutions

**A. ESM vs CommonJS**
```javascript
// ESM (modern)
import { srgbToLab } from 'color-utils';

// CommonJS (legacy) - may need transpilation
const { srgbToLab } = require('color-utils');
```

**B. Check Package.json Type**
```json
{
  "type": "module"  // This package uses ESM
}
```

**C. TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "types": ["color-utils"]
  }
}
```

### 9. Gamut Mapping Not Working

#### Symptom
`gamutMapToSrgb()` doesn't bring colors into gamut.

#### Solutions

**A. Check Color Space**
```javascript
// Function expects OkLCH by default
import { srgbToOklch, oklchToSrgb, gamutMapOklch } from 'color-utils';

const oklch = srgbToOklch(outOfGamutColor);
const mapped = gamutMapOklch(oklch, 'srgb');
const result = oklchToSrgb(mapped);
```

**B. Algorithm Limitations**
```javascript
// Some extreme colors can't be mapped perfectly
const extreme = { L: 0.9, C: 0.5, h: 30 }; // Very bright and vibrant
const mapped = gamutMapOklch(extreme, 'srgb');

// May still be slightly out of gamut due to algorithm precision
if (!isSrgbInGamut(oklchToSrgb(mapped), 0.001)) {
  // Final clamp for safety
  return clampSrgb(oklchToSrgb(mapped));
}
```

## Debug Utilities

### Color Inspector
```javascript
function inspectColor(color, name = 'Color') {
  console.log(`\n=== ${name} ===`);
  
  if ('r' in color && 'g' in color && 'b' in color) {
    console.log('Type: sRGB');
    console.log(`Values: r=${color.r.toFixed(3)}, g=${color.g.toFixed(3)}, b=${color.b.toFixed(3)}`);
    console.log(`In gamut: ${isSrgbInGamut(color)}`);
    console.log(`Hex: ${formatSrgbAsHex(color)}`);
  }
  
  if ('L' in color && 'a' in color && 'b' in color) {
    const isLab = color.L > 1;
    console.log(`Type: ${isLab ? 'CIELAB' : 'Oklab'}`);
    console.log(`Values: L=${color.L.toFixed(3)}, a=${color.a.toFixed(3)}, b=${color.b.toFixed(3)}`);
  }
  
  if ('L' in color && 'C' in color && 'h' in color) {
    const isLch = color.L > 1;
    console.log(`Type: ${isLch ? 'CIELCH' : 'OkLCH'}`);
    console.log(`Values: L=${color.L.toFixed(3)}, C=${color.C.toFixed(3)}, h=${color.h.toFixed(1)}°`);
  }
}
```

### Conversion Chain Validator
```javascript
function validateConversionChain(color, conversions) {
  let current = color;
  const results = [{ step: 'Input', color: { ...current } }];
  
  for (const [name, fn] of conversions) {
    current = fn(current);
    results.push({ step: name, color: { ...current } });
  }
  
  // Check round-trip
  const reverseConversions = conversions.slice().reverse().map(([name, fn]) => {
    // Get reverse function (simplified)
    const reverseName = name.replace('To', 'From').replace('From', 'To');
    return [reverseName, /* reverse function */];
  });
  
  console.table(results);
  return results;
}

// Usage
validateConversionChain(
  { r: 0.5, g: 0.3, b: 0.8 },
  [
    ['sRGB to Lab', srgbToLab],
    ['Lab to LCH', labToLch],
    ['LCH to Lab', lchToLab],
    ['Lab to sRGB', labToSrgb]
  ]
);
```

## Getting Help

1. **Check the documentation**
   - [API Reference](./docs/api/)
   - [Examples](./examples/)
   - [Known Issues](./KNOWN_ISSUES.md)

2. **Search existing issues**
   - [GitHub Issues](https://github.com/TEMP/color-utils/issues)

3. **Create a minimal reproduction**
   ```javascript
   // Include:
   // 1. Library version
   // 2. Input values
   // 3. Expected output
   // 4. Actual output
   // 5. Minimal code to reproduce
   ```

4. **File a bug report**
   - Use the issue template
   - Include reproduction steps
   - Specify environment (Node.js version, browser, etc.)

## Performance Tips

1. **Batch operations** - Process arrays efficiently
2. **Avoid repeated conversions** - Cache results when possible
3. **Use direct paths** - Skip intermediate color spaces
4. **Defer validation** - Check gamut once, not per pixel
5. **Consider WebAssembly** - For massive datasets

---

*Most issues are related to range mismatches or unchecked null returns. When in doubt, check the [Range Standards](./RANGE_STANDARDS.md) document.*