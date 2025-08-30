# Color Library Range Standards & Best Practices

## Executive Summary

After analyzing industry standards (ICC, CIE, W3C), leading libraries (Culori, Color.js, Chroma.js), and scientific software, this document establishes the proper standards for handling ranges in professional color libraries.

## 🎯 Core Principle: "Calculate Freely, Display Safely"

Professional color libraries should:
1. **Accept** out-of-range values without throwing errors
2. **Process** them mathematically to maintain precision
3. **Provide** gamut checking and mapping functions
4. **Clamp** only when formatting for display

## 📊 Standard Range Conventions

### Primary Color Spaces

| Color Space | Component | Standard Range | Notes |
|------------|-----------|---------------|--------|
| **sRGB** | r, g, b | [0, 1] | May exceed for wide gamut |
| **Linear sRGB** | r, g, b | [0, 1] | Often unbounded for HDR |
| **XYZ (D65/D50)** | X, Y, Z | Y∈[0, 1] normalized | Y=1 for white point |
| **CIELAB** | L* | [0, 100] | Lightness percentage |
| | a*, b* | [-128, +128] typical | Theoretically unbounded |
| **CIELCH** | L | [0, 100] | Same as Lab L* |
| | C | [0, 150] typical | Theoretically unbounded |
| | h | [0, 360) | Degrees, wraps around |
| **Oklab** | L | [0, 1] | Perceptual lightness |
| | a, b | [-0.4, +0.4] typical | Theoretically unbounded |
| **OkLCH** | L | [0, 1] | Same as Oklab L |
| | C | [0, 0.4] typical | Theoretically unbounded |
| | h | [0, 360) | Degrees, wraps around |
| **Display P3** | r, g, b | [0, 1] | Wider than sRGB |
| **Rec. 2020** | r, g, b | [0, 1] | Ultra-wide gamut |

### XYZ Scaling Standard

**Recommendation: Use Y=1 normalization**

Rationale:
- ICC Profile Connection Space uses Y=1.0
- Better numerical precision for calculations
- Easier GPU shader integration
- Culori, Color.js use this convention

Example D65 white point:
```javascript
const D65 = { X: 0.95047, Y: 1.0, Z: 1.08883 }; // Normalized
// NOT: { X: 95.047, Y: 100.0, Z: 108.883 }  // Percentage
```

## 🔧 Implementation Standards

### 1. Core Conversion Functions

**No validation, no clamping** - Process any numeric input:

```javascript
/**
 * Converts sRGB to CIELAB.
 * @param {SrgbColor} srgb - RGB values typically in [0,1]
 * @returns {LabColor} L*[0,100], a*b* unbounded
 * @note Processes out-of-range values mathematically
 */
export function srgbToLab(srgb) {
  // Accept r: 1.5, g: -0.2, b: 0.8 without complaint
  const linear = srgbToLinearSrgb(srgb);
  const xyz = linearSrgbToXyz(linear);
  return xyzToLab(xyz);
}
```

### 2. Gamut Management Functions

**Explicit validation and mapping**:

```javascript
/**
 * Checks if color is within sRGB gamut
 */
export function isSrgbInGamut(srgb, epsilon = 1e-10) {
  return srgb.r >= -epsilon && srgb.r <= 1 + epsilon &&
         srgb.g >= -epsilon && srgb.g <= 1 + epsilon &&
         srgb.b >= -epsilon && srgb.b <= 1 + epsilon;
}

/**
 * Simple clamping to [0,1]
 */
export function clampSrgb(srgb) {
  return {
    r: Math.max(0, Math.min(1, srgb.r)),
    g: Math.max(0, Math.min(1, srgb.g)),
    b: Math.max(0, Math.min(1, srgb.b))
  };
}

/**
 * Perceptual gamut mapping using chroma reduction
 */
export function gamutMapToSrgb(color, mode = 'oklch') {
  // CSS Color 4 algorithm
  // Binary search for maximum in-gamut chroma
  // Preserves hue and lightness
}
```

### 3. Display/Format Functions

**Clamp for display only**:

```javascript
/**
 * Formats sRGB as hex string
 * @note Automatically clamps to [0,1] for valid output
 */
export function formatSrgbAsHex(srgb) {
  const safe = clampSrgb(srgb);
  const r = Math.round(safe.r * 255);
  const g = Math.round(safe.g * 255);
  const b = Math.round(safe.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

### 4. Parsing Functions

**Return null for invalid input**:

```javascript
/**
 * Parses hex color string
 * @returns {SrgbColor|null} Parsed color or null if invalid
 */
export function parseSrgbHex(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;
  
  return {
    r: parseInt(match[1], 16) / 255,
    g: parseInt(match[2], 16) / 255,
    b: parseInt(match[3], 16) / 255
  };
}
```

## 📝 Documentation Standards

### Function Documentation Template

```javascript
/**
 * Converts [source] to [target] color space.
 * 
 * @param {SourceColor} color - [Description with typical ranges]
 * @returns {TargetColor} [Description with output ranges]
 * 
 * @example
 * // Standard usage
 * const result = sourceToTarget({...});
 * 
 * @example
 * // Out-of-gamut handling
 * const wide = {r: 1.2, g: 0.5, b: -0.1};
 * const result = srgbToLab(wide); // Processes mathematically
 * if (!isSrgbInGamut(wide)) {
 *   const clamped = clampSrgb(wide);
 * }
 * 
 * Range behavior:
 * - Input: Accepts any numeric values
 * - Output: May exceed typical ranges for out-of-gamut colors
 * - No automatic clamping or validation
 * 
 * @see {@link isSrgbInGamut} for validation
 * @see {@link clampSrgb} for simple clamping
 * @see {@link gamutMapToSrgb} for perceptual mapping
 */
```

### Module Header Documentation

```javascript
/**
 * @module colorspace
 * 
 * RANGE CONVENTIONS:
 * ==================
 * sRGB: r,g,b ∈ [0,1] (may exceed for wide gamut)
 * XYZ: Y normalized to 1.0 for white point
 * Lab: L*∈[0,100], a*b* unbounded (typically ±128)
 * 
 * PROCESSING BEHAVIOR:
 * ====================
 * - Core functions accept out-of-range values
 * - No automatic clamping in conversions
 * - Validation available via separate functions
 * - Display functions clamp to valid ranges
 */
```

## ⚠️ Error Handling Standards

### When to Throw Errors

| Situation | Action | Example |
|-----------|--------|---------|
| **Wrong type** | `throw TypeError` | Non-object passed to function expecting object |
| **Missing required property** | `throw TypeError` | Object missing r, g, or b |
| **Invalid enum value** | `throw TypeError` | Unknown color space name |

### When to Return Null

| Situation | Action | Example |
|-----------|--------|---------|
| **Parse failure** | `return null` | Invalid hex string |
| **User input invalid** | `return null` | CSS color parsing fails |

### When to Process Silently

| Situation | Action | Example |
|-----------|--------|---------|
| **Out-of-range numeric** | Process mathematically | r: 1.5 in sRGB |
| **Negative values** | Process mathematically | L: -10 in Lab |
| **Very large values** | Process mathematically | C: 500 in LCH |

## 🎭 Usage Patterns

### Pattern 1: Scientific/Technical Use

```javascript
// Process wide-gamut colors without restriction
const p3Color = { r: 1.1, g: 0.0, b: 0.5 }; // Outside sRGB
const lab = srgbToLab(p3Color); // Processes correctly
const xyz = srgbToXyz(p3Color); // Maintains precision
```

### Pattern 2: Web/Display Use

```javascript
// Ensure displayable colors
const color = parseUserInput(input);
if (!isSrgbInGamut(color)) {
  color = gamutMapToSrgb(color); // Perceptual mapping
}
const hex = formatSrgbAsHex(color); // Auto-clamps
```

### Pattern 3: Color Manipulation

```javascript
// Increase chroma beyond gamut
let lch = srgbToLch(color);
lch.C *= 1.5; // May go out of gamut
const vibrant = lchToSrgb(lch); // Preserves value

// Display with gamut mapping
const displayable = gamutMapToSrgb(vibrant, 'lch');
```

## 🚀 Performance Guidelines

### Optimization Strategies

1. **No validation in hot paths** - Validation costs 10-20% performance
2. **Direct conversions** - Skip intermediate formats when possible
3. **Inline small functions** - Reduce function call overhead
4. **Precompute constants** - Matrix values, conversion factors
5. **Lazy validation** - Check only when needed

### Example Optimized vs Safe Code

```javascript
// FAST: Direct conversion, no checks
export function srgbToLab(srgb) {
  // Direct path, ~100 ops
  return xyzToLab(linearSrgbToXyz(srgbToLinearSrgb(srgb)));
}

// SAFE: With validation
export function srgbToLabSafe(srgb) {
  if (!isValidSrgbObject(srgb)) {
    throw new TypeError('Invalid sRGB object');
  }
  const result = srgbToLab(srgb);
  if (!isLabInTypicalRange(result)) {
    console.warn('Result outside typical Lab range');
  }
  return result;
}
```

## ✅ Compliance Checklist

A professional color library should:

- [ ] Document expected ranges for all color spaces
- [ ] Process out-of-range values in core functions
- [ ] Provide separate validation functions
- [ ] Offer multiple gamut mapping strategies
- [ ] Clamp only in display/format functions
- [ ] Return null for parsing failures
- [ ] Throw TypeError for programming errors
- [ ] Include out-of-range examples in docs
- [ ] Optimize hot paths without validation
- [ ] Support both safe and fast API patterns

## 📚 References

- [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/)
- [ICC Profile Specification](http://www.color.org/specification/ICC1v43_2010-12.pdf)
- [CIE 15:2004 Colorimetry](https://cie.co.at/publications/colorimetry-3rd-edition)
- [Culori.js Documentation](https://culorijs.org/api/)
- [Color.js API](https://colorjs.io/docs/)
- [Oklab Color Space](https://bottosson.github.io/posts/oklab/)

---

*This document represents the consensus of industry standards and best practices from leading color science implementations.*