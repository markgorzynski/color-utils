# Migration Guide

## Migrating from Legacy Versions

This guide helps you migrate from older versions of the color-utils library to the current unified API.

## Version History

- **Legacy versions** (pre-1.0): Multiple separate files with inconsistent APIs
- **v1.0** (current): Unified module structure with consistent naming and ranges

## Breaking Changes

### 1. Module Structure

**Before (legacy):**
```javascript
// Separate files with different naming conventions
import { rgbToLab } from './color_utils_abridged_v22.js';
import { AOkLab } from './cielab-oklab-hybrid.js';
import { rgbToXyz } from './rgb-xyz-conversions.js';
```

**After (v1.0):**
```javascript
// Unified imports from single entry point
import { 
  srgbToLab,
  AdaptiveOklab,
  srgbToXyz 
} from 'color-utils';
```

### 2. Naming Conventions

| Old Name | New Name | Notes |
|----------|----------|-------|
| `rgbToLab` | `srgbToLab` | Clarifies sRGB color space |
| `labToRgb` | `labToSrgb` | Consistent naming |
| `AOkLab` | `AdaptiveOklab` | Clearer class name |
| `hexToRgb` | `parseSrgbHex` | Better describes parsing |
| `rgbToHex` | `formatSrgbAsHex` | Better describes formatting |
| `deltaE2000` | `calculateCiede2000` | More descriptive |

### 3. Range Conventions

**Critical Change: XYZ Scaling**

**Before (legacy):**
```javascript
// Some versions used Y=100 scale
const xyz = { X: 41.24, Y: 21.26, Z: 1.93 };
```

**After (v1.0):**
```javascript
// Normalized Y=1 scale (ICC standard)
const xyz = { X: 0.4124, Y: 0.2126, Z: 0.0193 };
```

### 4. Function Signatures

**Before (legacy):**
```javascript
// Inconsistent parameter ordering
rgbToLab(r, g, b)  // Individual channels
deltaE2000(lab1, lab2, weights)  // Optional weights
```

**After (v1.0):**
```javascript
// Consistent object parameters
srgbToLab({ r, g, b })  // Color object
calculateCiede2000(lab1, lab2)  // Simplified
```

### 5. Error Handling

**Before (legacy):**
```javascript
// Inconsistent error handling
hexToRgb('#invalid')  // Threw error
rgbToLab(null)  // Returned NaN values
```

**After (v1.0):**
```javascript
// Consistent patterns
parseSrgbHex('#invalid')  // Returns null
srgbToLab(null)  // Throws TypeError
```

## Migration Steps

### Step 1: Update Imports

Replace all legacy imports with the new unified import:

```javascript
// Replace all legacy imports
import { 
  srgbToLab,
  labToSrgb,
  srgbToOklab,
  oklabToSrgb,
  AdaptiveOklab,
  calculateWcagContrast,
  calculateCiede2000
} from 'color-utils';
```

### Step 2: Update Function Names

Use find-and-replace with these patterns:

```bash
# Examples for common replacements
rgbToLab → srgbToLab
labToRgb → labToSrgb
hexToRgb → parseSrgbHex
rgbToHex → formatSrgbAsHex
deltaE2000 → calculateCiede2000
wcagContrast → calculateWcagContrast
```

### Step 3: Update Function Calls

Convert individual parameters to object notation:

```javascript
// Before
const lab = rgbToLab(0.5, 0.3, 0.8);

// After
const lab = srgbToLab({ r: 0.5, g: 0.3, b: 0.8 });
```

### Step 4: Update XYZ Values

If you have stored XYZ values in the 0-100 scale:

```javascript
// Convert Y=100 scale to Y=1 scale
function convertXyzScale(xyzOld) {
  return {
    X: xyzOld.X / 100,
    Y: xyzOld.Y / 100,
    Z: xyzOld.Z / 100
  };
}
```

### Step 5: Update Error Handling

Add null checks for parsing functions:

```javascript
// Before
const rgb = hexToRgb(userInput);  // Could throw

// After
const rgb = parseSrgbHex(userInput);
if (rgb === null) {
  // Handle invalid input
  console.error('Invalid hex color');
  return;
}
```

## Feature Mapping

### Adaptive Oklab

**Before:**
```javascript
const aok = new AOkLab('dark');
const adapted = aok.convertFromRGB(r, g, b);
```

**After:**
```javascript
const aok = new AdaptiveOklab({ surround: 'dark' });
const adapted = aok.fromSrgb({ r, g, b });
```

### Gamut Checking

**New in v1.0:**
```javascript
import { isSrgbInGamut, clampSrgb, gamutMapToSrgb } from 'color-utils';

// Check if color is displayable
if (!isSrgbInGamut(color)) {
  // Option 1: Simple clamping
  color = clampSrgb(color);
  
  // Option 2: Perceptual mapping
  color = gamutMapToSrgb(color);
}
```

### WCAG Contrast

**Before:**
```javascript
const ratio = getContrastRatio(fg, bg);
const passes = ratio >= 4.5;
```

**After:**
```javascript
const ratio = calculateWcagContrast(fg, bg);
const passes = isWcagContrastSufficient(fg, bg, 'AA');
```

## New Features in v1.0

### 1. Wide Gamut Support
```javascript
import { srgbToDisplayP3, displayP3ToSrgb, srgbToRec2020 } from 'color-utils';
```

### 2. CSS Color Parsing
```javascript
import { parseCSS } from 'color-utils';

const color = parseCSS('lab(50% 25 -50)');
const color2 = parseCSS('oklch(70% 0.2 150deg)');
const color3 = parseCSS('color(display-p3 1 0 0.5)');
```

### 3. Chromatic Adaptation
```javascript
import { chromaticAdaptation } from 'color-utils';

const d50Color = chromaticAdaptation(xyzColor, 'D65', 'D50', 'bradford');
```

### 4. Professional Gamut Management
```javascript
import { 
  isSrgbInGamut,
  isLabInTypicalRange,
  getSrgbGamutInfo,
  getMaxChroma
} from 'color-utils';
```

## Common Issues

### Issue 1: Colors Look Different

**Cause:** XYZ scale change from 0-100 to 0-1
**Solution:** Update stored XYZ values or use conversion function

### Issue 2: Functions Not Found

**Cause:** Function renamed for consistency
**Solution:** Check the naming conventions table above

### Issue 3: Type Errors

**Cause:** Functions now expect objects instead of individual parameters
**Solution:** Wrap parameters in objects: `{ r, g, b }`

### Issue 4: Parsing Errors

**Cause:** Parse functions now return null instead of throwing
**Solution:** Add null checks after parsing

## Testing Your Migration

1. **Run existing tests** with the new library
2. **Check color accuracy** - values should be within 0.001 tolerance
3. **Verify range handling** - out-of-gamut colors should process correctly
4. **Test error cases** - ensure proper error handling

## Getting Help

- Check [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) for known limitations
- See [examples/](./examples/) for usage patterns
- Review [API documentation](./docs/api/) for detailed function signatures
- File issues at [GitHub Issues](https://github.com/TEMP/color-utils/issues)

## Version Support

- **v1.0+**: Full support, active development
- **Legacy**: No longer maintained, migration recommended

---

*Migration typically takes 1-2 hours for a medium-sized project. The main effort is updating function names and signatures.*