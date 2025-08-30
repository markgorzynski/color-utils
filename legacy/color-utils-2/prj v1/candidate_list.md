# Candidate Utility Functions for `utils.js`

**Document Version:** 1.0
**Date:** May 6, 2025
**Source Analysis for Task 2.1 of Refactoring Plan v0.2**

This document lists functions and logic identified from the original codebase that are candidates for centralization into a core `utils.js` module. This supports the refactoring goal of improved modularity and code reuse.

## 1. sRGB <-> Linear sRGB Conversions

These functions handle the non-linear electro-optical transfer function of sRGB.

* **Function Signature (Proposed):** `srgbToLinear(channelValue: number): number`
    * **Description:** Converts a single sRGB channel value (0-1 range) to its linear equivalent.
    * **Logic Found In:**
        * `adaptive-oklab.js` (as inline `linearize` in `fromSRGB` method)
        * `aoklab-dark.js` (as `sRGBToLinear(x)`)
        * `aoklab-gray.js` (as `sRGBToLinear(x)`)
        * `aoklab-white.js` (as `sRGBToLinear(x)`)
        * `cat16.js` (as helper `sRGBToLinear(x)`)
        * `checkWCAGContrast.v4.js` (inline logic within `hexToRelativeLuminance`)
        * `color-metrics.js` (as `sRGBToLinear(x)`)
        * `matchoklch.v3.js` (as `sRGBToLinear(c)`)
        * `oklab-simple.v3.js` (as `sRGBToLinear(x)`)
        * `cielab.v3.js` (as `srgbToLinear(value)`)

* **Function Signature (Proposed):** `linearToSrgb(channelValue: number): number`
    * **Description:** Converts a single linear sRGB channel value (0-1 range) to its gamma-corrected sRGB equivalent.
    * **Logic Found In:**
        * `aoklab-dark.js` (as `linearTosRGB(x)`)
        * `aoklab-gray.js` (as `linearTosRGB(x)`)
        * `aoklab-white.js` (as `linearTosRGB(x)`)
        * `oklab-simple.v3.js` (as `linearTosRGB(x)`)
        * `cielab.v3.js` (as helper `linearToSrgb(value)` inside `linearColorToSrgb`)

## 2. Angle Conversions

Essential for handling hue in various color models.

* **Function Signature (Proposed):** `degreesToRadians(degrees: number): number`
    * **Description:** Converts an angle from degrees to radians.
    * **Logic Found In:**
        * `color-metrics.js` (as `degreesToRadians(deg)`)
        * `matchoklch.v3.js` (inline calculation: `(H * Math.PI) / 180`)

* **Function Signature (Proposed):** `radiansToDegrees(radians: number): number`
    * **Description:** Converts an angle from radians to degrees.
    * **Logic Found In:**
        * `color-metrics.js` (as `radiansToDegrees(rad)`)
        * `cat16.js` (inline calculation: `h_rad * (180 / Math.PI)`)

## 3. Matrix/Vector Operations

Fundamental for color space transformations.

* **Function Signature (Proposed):** `multiplyMatrixVector(matrix: number[][], vector: number[]): number[]`
    * **Description:** Multiplies a 3x3 matrix by a 3x1 vector. (Can be generalized if needed, but 3D is prevalent in color science).
    * **Logic Found In:**
        * `adaptive-oklab.js` (as `multiplyMatrixVector(matrix, vector)`)

## 4. General Math Helpers

* **Function Signature (Proposed):** `signPreservingPow(value: number, exponent: number): number`
    * **Description:** Applies an exponent to the absolute value of a number, then reapplies the original sign. (i.e., `sign(value) * abs(value)^exponent`).
    * **Logic Found In:**
        * `adaptive-oklab.js` (as `signPreservingPow(value, exponent)`)
        * `aoklab-dark.js` (as `Math.sign(channel) * Math.pow(Math.abs(channel), p)`)
        * `aoklab-gray.js` (as `Math.sign(channel) * Math.pow(Math.abs(channel), p)`)
        * `aoklab-white.js` (as `Math.sign(channel) * Math.pow(Math.abs(channel), p)`)

* **Function Signature (Proposed):** `clamp(value: number, min: number, max: number): number`
    * **Description:** Constrains a number `value` to be within the range `[min, max]`.
    * **Logic Found In:**
        * Implicitly in `toHex` helpers in `aoklab-dark.js`, `aoklab-gray.js`, `aoklab-white.js`, `oklab-simple.v3.js` (as `Math.max(0, Math.min(1, x))`).
        * Also used for clamping XYZ values in `cielab-modified.v3.js`.

* **Function Signature (Proposed):** `cielabForwardTransform(t: number): number`
    * **Description:** The non-linear function `f(t)` used in standard XYZ to CIELAB conversions. (Usually `t > (6/29)^3 ? t^(1/3) : (1/3)*(29/6)^2*t + 4/29`). Corresponds to `f_xyz(t)` or `f_custom(t)`.
    * **Logic Found In:**
        * `cielab.v3.js` (as `f_xyz(t)`)
        * `cielab-modified.v3.js` (as `f_custom(t)`, which is the standard CIELAB one)

* **Function Signature (Proposed):** `cielabInverseTransform(val: number): number`
    * **Description:** The inverse of `cielabForwardTransform(t)`.
    * **Logic Found In:**
        * `cielab.v3.js` (as `fInv_xyz(t)` inline logic within `labToXyz`)
        * `cielab-modified.v3.js` (as `fInv_custom(fVal)`)

## 5. Hex Color String Utilities

* **Function Signature (Proposed):** `parseHexToRgb01(hexString: string): { r: number, g: number, b: number } | null`
    * **Description:** Parses a 3 or 6-digit hex color string (e.g., "#RGB", "#RRGGBB", "RRGGBB") into an object with `r`, `g`, `b` components in the 0-1 range. Returns `null` or throws an error on invalid input, per error handling strategy in `ARCHITECTURE.md`.
    * **Logic Found In:**
        * `aoklab-dark.js` (within `hexToDarkOKLab`, parses to r,g,b 0-255 then normalizes)
        * `aoklab-gray.js` (within `hexToGrayOKLab`)
        * `aoklab-white.js` (within `hexToWhiteOKLab`)
        * `checkWCAGContrast.v4.js` (within `hexToRelativeLuminance`, parses to r,g,b 0-255)
        * `oklab-simple.v3.js` (within `hexToOKLab`)

* **Function Signature (Proposed):** `formatRgb01ToHex(rgb: { r: number, g: number, b: number }): string`
    * **Description:** Converts an RGB object with components in the 0-1 range to a 6-digit hex color string (e.g., "#RRGGBB"). Includes clamping values to the 0-1 range before conversion.
    * **Logic Found In:** (as internal `toHex(channelValue)` helpers that scale, round, clamp, and pad)
        * `aoklab-dark.js` (within `darkOKLabToHex`)
        * `aoklab-gray.js` (within `grayOKLabToHex`)
        * `aoklab-white.js` (within `whiteOKLabToHex`)
        * `oklab-simple.v3.js` (within `OKLabToHex`)

## 6. Relative Luminance (from linear sRGB)

* **Function Signature (Proposed):** `calculateRelativeLuminance(linearR: number, linearG: number, linearB: number): number`
    * **Description:** Calculates WCAG relative luminance from linear sRGB components (each 0-1). Uses standard coefficients (0.2126R + 0.7152G + 0.0722B).
    * **Logic Found In:**
        * `checkWCAGContrast.v4.js` (inline logic within `hexToRelativeLuminance` after linearization step)
        * `color-metrics.js` (core logic of `srgbLuminance` function, which also does sRGB->linear)
        * `matchoklch.v3.js` (core logic of `srgbLuminance` function, which also does sRGB->linear)
    * **Note:** The `ARCHITECTURE.md` indicates sRGB operations might live in `srgb.js`. If `srgbToLinear` is a utility, this function taking linear components is a good candidate for `utils.js`. Otherwise, a combined `srgbToRelativeLuminance` might live in `srgb.js`. For `utils.js`, the version taking linear components is more generic.

## 7. Constants

* **Constant (Proposed Name):** `D65_WHITE_POINT_XYZ`
    * **Description:** Standard CIE Illuminant D65 reference white point in XYZ, scaled to Y=100.
    * **Value:** `{ X: 95.047, Y: 100.0, Z: 108.883 }`
    * **Defined In:**
        * `cielab.v3.js` (as `D65`)
        * `cielab-modified.v3.js` (as `D65`)
        * `cat16.js` (as `whiteXYZ`, values are consistent)

---

This list forms the basis for creating the `utils.js` module. The final decision on inclusion and naming will align with the `ARCHITECTURE.md` during Task 2.2.