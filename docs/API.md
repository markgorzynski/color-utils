# API Documentation

## Table of Contents

- [Color Space Conversions](#color-space-conversions)
  - [sRGB](#srgb)
  - [CIELAB](#cielab)
  - [Oklab](#oklab)
  - [Display P3](#display-p3)
  - [Rec. 2020](#rec-2020)
- [Advanced Features](#advanced-features)
  - [Adaptive Oklab](#adaptive-oklab)
  - [CIECAM16](#ciecam16)
  - [CAM16-UCS](#cam16-ucs)
- [Color Metrics](#color-metrics)
- [Gamut Management](#gamut-management)
- [CSS Parsing](#css-parsing)
- [Utility Functions](#utility-functions)

## Color Space Conversions

### sRGB

#### `parseSrgbHex(hex: string): SrgbColor | null`
Parses a hex color string into an sRGB color object.

```javascript
const color = parseSrgbHex('#FF5733');
// Returns: { r: 1, g: 0.341, b: 0.2 }
```

#### `formatSrgbAsHex(srgb: SrgbColor): string`
Formats an sRGB color object as a hex string.

```javascript
const hex = formatSrgbAsHex({ r: 1, g: 0.341, b: 0.2 });
// Returns: '#FF5733'
```

#### `srgbToLinearSrgb(srgb: SrgbColor): LinearSrgbColor`
Converts gamma-corrected sRGB to linear sRGB.

#### `linearSrgbToSrgb(linear: LinearSrgbColor): SrgbColor`
Converts linear sRGB to gamma-corrected sRGB.

#### `srgbToXyz(srgb: SrgbColor): XyzColor`
Converts sRGB to CIE XYZ color space.

#### `xyzToSrgb(xyz: XyzColor): SrgbColor`
Converts CIE XYZ to sRGB color space.

### CIELAB

#### `srgbToLab(srgb: SrgbColor): LabColor`
Converts sRGB to CIELAB color space.

```javascript
const lab = srgbToLab({ r: 0.5, g: 0.5, b: 0.5 });
// Returns: { L: 53.39, a: 0, b: 0 }
```

#### `labToSrgb(lab: LabColor): SrgbColor`
Converts CIELAB to sRGB color space.

#### `labToLch(lab: LabColor): LchColor`
Converts CIELAB to CIELCH (cylindrical representation).

```javascript
const lch = labToLch({ L: 50, a: 20, b: 30 });
// Returns: { L: 50, C: 36.06, h: 56.31 }
```

#### `lchToLab(lch: LchColor): LabColor`
Converts CIELCH to CIELAB.

#### `srgbToLch(srgb: SrgbColor): LchColor`
Direct conversion from sRGB to CIELCH.

#### `lchToSrgb(lch: LchColor): SrgbColor`
Direct conversion from CIELCH to sRGB.

### Oklab

#### `srgbToOklab(srgb: SrgbColor): OklabColor`
Converts sRGB to Oklab perceptual color space.

```javascript
const oklab = srgbToOklab({ r: 0.5, g: 0.7, b: 0.3 });
// Returns: { L: 0.698, a: -0.072, b: 0.106 }
```

#### `oklabToSrgb(oklab: OklabColor): SrgbColor`
Converts Oklab to sRGB.

#### `oklabToOklch(oklab: OklabColor): OklchColor`
Converts Oklab to OkLCH (cylindrical representation).

#### `oklchToOklab(oklch: OklchColor): OklabColor`
Converts OkLCH to Oklab.

#### `srgbToOklch(srgb: SrgbColor): OklchColor`
Direct conversion from sRGB to OkLCH.

#### `oklchToSrgb(oklch: OklchColor): SrgbColor`
Direct conversion from OkLCH to sRGB.

### Display P3

#### `srgbToDisplayP3(srgb: SrgbColor): DisplayP3Color`
Converts sRGB to Display P3 color space.

```javascript
const p3 = srgbToDisplayP3({ r: 1, g: 0, b: 0 });
// Returns: { r: 0.9175, g: 0.2003, b: 0.1386 }
```

#### `displayP3ToSrgb(p3: DisplayP3Color): SrgbColor`
Converts Display P3 to sRGB.

#### `parseDisplayP3FromCSS(css: string): DisplayP3Color | null`
Parses CSS color(display-p3) syntax.

### Rec. 2020

#### `srgbToRec2020(srgb: SrgbColor): Rec2020Color`
Converts sRGB to Rec. 2020 color space.

#### `rec2020ToSrgb(rec2020: Rec2020Color): SrgbColor`
Converts Rec. 2020 to sRGB.

#### `parseRec2020FromCSS(css: string): Rec2020Color | null`
Parses CSS color(rec2020) syntax.

## Advanced Features

### Adaptive Oklab

The `AdaptiveOklab` class provides surround-aware color adaptation.

#### Constructor

```javascript
new AdaptiveOklab(options?: AdaptiveOklabOptions)
```

Options:
- `surround`: 'white' | 'gray' | 'dark' (default: 'gray')
- `x0`: number (default: 0.5) - Hue correction factor

#### Methods

##### `fromSrgb(srgb: SrgbColor): OklabColor`
Converts sRGB to Adaptive Oklab.

```javascript
const adapter = new AdaptiveOklab({ surround: 'dark' });
const adapted = adapter.fromSrgb({ r: 0.5, g: 0.5, b: 0.5 });
```

##### `toSrgb(oklab: OklabColor): SrgbColor`
Converts Adaptive Oklab back to sRGB.

##### `fromXyz(xyz: XyzColor): OklabColor`
Converts XYZ to Adaptive Oklab.

##### `toXyz(oklab: OklabColor): XyzColor`
Converts Adaptive Oklab to XYZ.

#### Properties

##### `surround`
Returns the current surround setting.

##### `params`
Returns the adaptation parameters.

### CIECAM16

#### `srgbToCiecam16(srgb: SrgbColor, conditions: Ciecam16ViewingConditions): Ciecam16Appearance`

Calculates CIECAM16 appearance correlates.

```javascript
const appearance = srgbToCiecam16(
  { r: 0.5, g: 0.5, b: 0.5 },
  {
    adaptingLuminance: 100,
    backgroundLuminanceFactor: 0.2,
    surroundType: 'average',
    degreeOfAdaptation: 1
  }
);
// Returns: { J, C, h, M, s, Q }
```

Viewing conditions:
- `adaptingLuminance`: cd/m² of adapting field
- `backgroundLuminanceFactor`: Relative luminance of background
- `surroundType`: 'average' | 'dim' | 'dark'
- `degreeOfAdaptation`: 0-1 (optional, default: 1)

### CAM16-UCS

#### `srgbToCam16Ucs(srgb: SrgbColor, conditions: Ciecam16ViewingConditions): Cam16UcsColor`
Converts sRGB to CAM16-UCS perceptually uniform space.

#### `cam16UcsToSrgb(ucs: Cam16UcsColor, conditions: Ciecam16ViewingConditions): SrgbColor | null`
Converts CAM16-UCS back to sRGB.

#### `cam16UcsColorDifference(ucs1: Cam16UcsColor, ucs2: Cam16UcsColor): number`
Calculates perceptually uniform color difference.

## Color Metrics

### WCAG Contrast

#### `calculateWcagContrast(fg: SrgbColor, bg: SrgbColor): number`
Calculates WCAG contrast ratio between two colors.

```javascript
const contrast = calculateWcagContrast(
  { r: 0, g: 0, b: 0 },     // black text
  { r: 1, g: 1, b: 1 }      // white background
);
// Returns: 21 (maximum contrast)
```

#### `isWcagContrastSufficient(fg: SrgbColor, bg: SrgbColor, level: 'AA' | 'AAA', size?: 'normal' | 'large'): boolean`
Checks if contrast meets WCAG requirements.

```javascript
const meetsAA = isWcagContrastSufficient(fg, bg, 'AA', 'normal');
// Returns: true if contrast >= 4.5
```

#### `getSrgbRelativeLuminance(srgb: SrgbColor): number`
Calculates relative luminance for WCAG calculations.

### Color Difference

#### `calculateCiede2000(lab1: LabColor, lab2: LabColor): number`
Calculates CIEDE2000 perceptual color difference.

```javascript
const deltaE = calculateCiede2000(
  { L: 50, a: 0, b: 0 },
  { L: 51, a: 0, b: 0 }
);
// Returns: ~0.77 (barely perceptible)
```

#### `calculateOklchDifference(oklch1: OklchColor, oklch2: OklchColor): number`
Calculates color difference in OkLCH space.

## Gamut Management

### Validation

#### `isSrgbInGamut(srgb: SrgbColor, epsilon?: number): boolean`
Checks if an sRGB color is within the displayable gamut.

```javascript
const inGamut = isSrgbInGamut({ r: 0.5, g: 0.5, b: 0.5 });
// Returns: true

const outOfGamut = isSrgbInGamut({ r: 1.5, g: 0.5, b: -0.1 });
// Returns: false
```

#### `isLabInTypicalRange(lab: LabColor): boolean`
Checks if Lab values are in typical ranges.

#### `isOklabInTypicalRange(oklab: OklabColor): boolean`
Checks if Oklab values are in typical ranges.

#### `isValidSrgbObject(obj: any): boolean`
Type guard for sRGB color objects.

### Clamping and Scaling

#### `clampSrgb(srgb: SrgbColor): SrgbColor`
Clamps sRGB values to [0,1] range.

```javascript
const clamped = clampSrgb({ r: 1.5, g: -0.1, b: 0.5 });
// Returns: { r: 1, g: 0, b: 0.5 }
```

#### `scaleToSrgbGamut(srgb: SrgbColor): SrgbColor`
Scales out-of-gamut colors proportionally.

#### `getSrgbGamutInfo(srgb: SrgbColor): GamutInfo`
Returns detailed gamut information.

### Gamut Mapping

#### `gamutMapOklch(oklch: OklchColor, targetGamut: 'srgb' | 'display-p3' | 'rec2020'): OklchColor`
Maps colors to target gamut using CSS Color 4 algorithm.

```javascript
const vibrant = { L: 0.7, C: 0.5, h: 30 };  // Out of sRGB
const mapped = gamutMapOklch(vibrant, 'srgb');
// Returns: Color with reduced chroma that fits in sRGB
```

#### `gamutMapSrgb(srgb: SrgbColor, targetGamut: string): SrgbColor`
Maps sRGB colors to target gamut.

#### `getMaxChroma(L: number, h: number, space?: 'lch' | 'oklch', precision?: number): number`
Finds maximum chroma for given lightness and hue.

## CSS Parsing

#### `parseCSS(css: string): SrgbColor | null`
Parses CSS color strings to sRGB.

Supported formats:
- Hex: `#RGB`, `#RRGGBB`, `#RRGGBBAA`
- RGB: `rgb(255, 0, 0)`, `rgb(100% 0% 0%)`
- Modern: `rgb(255 0 0)`, `rgb(255 0 0 / 0.5)`
- Lab: `lab(50% 40 30)`
- LCH: `lch(50% 40 30deg)`
- Oklab: `oklab(0.7 0.1 0.1)`
- OkLCH: `oklch(0.7 0.2 150deg)`
- Display P3: `color(display-p3 1 0 0.5)`
- Rec2020: `color(rec2020 1 0 0.5)`
- Named colors: `red`, `blue`, etc.

```javascript
const color1 = parseCSS('#FF5733');
const color2 = parseCSS('rgb(255, 87, 51)');
const color3 = parseCSS('oklch(70% 0.2 150deg)');
const color4 = parseCSS('color(display-p3 1 0 0.5)');
```

### CSS Formatting

#### `formatCssRgb(srgb: SrgbColor): string`
Formats as CSS rgb() function.

#### `formatCssLab(lab: LabColor): string`
Formats as CSS lab() function.

#### `formatCssLch(lch: LchColor): string`
Formats as CSS lch() function.

#### `formatCssOklab(oklab: OklabColor): string`
Formats as CSS oklab() function.

#### `formatCssOklch(oklch: OklchColor): string`
Formats as CSS oklch() function.

#### `formatCssColor(color: DisplayP3Color | Rec2020Color, space: string): string`
Formats as CSS color() function.

## Utility Functions

#### `clamp(value: number, min: number, max: number): number`
Clamps a value to a range.

#### `degreesToRadians(degrees: number): number`
Converts degrees to radians.

#### `radiansToDegrees(radians: number): number`
Converts radians to degrees.

#### `normalizeHue(hue: number): number`
Normalizes hue to [0, 360) range.

#### `signPreservingPow(base: number, exponent: number): number`
Power function that preserves sign.

#### `multiplyMatrixVector(matrix: number[][], vector: number[]): number[]`
Matrix-vector multiplication for color transforms.

## Type Definitions

### Color Types

```typescript
interface SrgbColor {
  r: number;  // [0, 1]
  g: number;  // [0, 1]
  b: number;  // [0, 1]
}

interface LabColor {
  L: number;  // [0, 100]
  a: number;  // typically [-128, 127]
  b: number;  // typically [-128, 127]
}

interface LchColor {
  L: number;  // [0, 100]
  C: number;  // [0, ∞)
  h: number;  // [0, 360)
}

interface OklabColor {
  L: number;  // [0, 1]
  a: number;  // typically [-0.4, 0.4]
  b: number;  // typically [-0.4, 0.4]
}

interface OklchColor {
  L: number;  // [0, 1]
  C: number;  // [0, ∞)
  h: number;  // [0, 360)
}

interface XyzColor {
  X: number;  // [0, 1] (Y-normalized)
  Y: number;  // [0, 1]
  Z: number;  // [0, 1]
}
```

For complete type definitions, see [index.d.ts](../index.d.ts).