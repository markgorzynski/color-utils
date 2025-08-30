# Chroma Control Refactoring Strategy

**Version:** 1.0
**Date:** May 6, 2025
**Associated Task:** 4.2.1 (Refactoring Plan v0.3)

## 1. Introduction

This document outlines the strategy for refactoring the functionality found in the original `chroma-control.js` and its primary dependency `matchoklch.v3.js`. The goal is to integrate these capabilities into the new modular `color-utils` library, leveraging the already refactored modules (`utils.js`, `srgb.js`, `cielab.js`, `oklab.js`, `color-metrics.js`).

## 2. Analysis of Original Scripts

### 2.1. `matchoklch.v3.js`

* **Core Purpose:** Adjusts an OkLCh color's Lightness (L) component such that its sRGB rendering matches the luminance corresponding to a target CIELAB L\* value, while keeping OkLCh Chroma (C) and Hue (H) constant. It also handles gamut checking.
* **Key Functions & Logic:**
    * `sRGBToLinear`, `linearTosRGB`: Standard sRGB EOTF. (Now internal to our `srgb.js`)
    * `srgbLuminance`: Calculates relative luminance from sRGB. (Logic now internal to our `color-metrics.js`)
    * `oklchToSrgb(L, C, H)`: Converts OkLCh to sRGB. (Our `oklab.js` provides `oklchToSrgb`)
    * `getSrgbLuminanceAndGamut(L, C, H)`: Combines `oklchToSrgb`, gamut check (0-1 for R,G,B), and luminance calculation.
    * `targetLuminanceForCIELabL(targetL, gamma)`: Converts a target CIELAB L\* (using a `gamma` parameter for a "modified Lab" transformation via `labToXyzModified` from the original `cielab-modified.v3.js`) to a target relative luminance.
    * `matchOklchWithCIELabL(targetC, targetH, targetCIELabL, gamma, tolerance, maxIterations)`: The main iterative (binary search) function. It repeatedly calls `getSrgbLuminanceAndGamut` with varying OkLCh.L values until the resulting sRGB luminance matches the `targetLuminanceForCIELabL`.
* **Dependencies (Original):** `oklab-simple.js` (for Oklab conversions), `cielab-modified.js` (for `labToXyzModified`).

### 2.2. `chroma-control.js`

* **Core Purpose:** Adjusts OkLCh chroma based on a target CIELAB L\*, using the `matchOklchWithCIELabL` function.
* **Key Functions & Logic:**
    * `findMaxChroma(targetL, hue, gamma, chromaStep)`: Iteratively calls `matchOklchWithCIELabL` with increasing chroma values to find the maximum chroma that remains in sRGB gamut for a given CIELAB L\* and hue.
    * `adjustChroma(inputChroma, targetL, hue, gamma, mode, globalTargetChroma, chromaStep)`: Uses `findMaxChroma` to either clip the input chroma or scale it proportionally to a global target.
* **Dependencies (Original):** `matchoklch.v3.js`, `color-metrics.js` (for `srgbLuminance`), and indirectly others through `matchoklch.v3.js`.

## 3. Refactoring Strategy

The core, unique logic revolves around `matchOklchWithCIELabL` and the "modified Lab" transformation used to derive the target luminance. The chroma adjustment functions in `chroma-control.js` are direct applications of this matching logic.

We will create a new module: `src/chromaControl.js`.

### 3.1. Handling "Modified CIELAB L\*" to Luminance

The `gamma` parameter and the associated `labToXyzModified` (from the original `cielab-modified.v3.js`) are specific to this chroma control context for achieving particular lightness matches. This "modified Lab" isn't part of our standard `cielab.js`.

* **Decision:** The logic for converting a CIELAB L\* (with a given `gamma`) to a target relative luminance will be encapsulated as internal helper functions within the new `chromaControl.js` module. This includes adapting the `fCustomInv` and related calculations from the original `cielab-modified.v3.js`.
    * Internal helper: `_labLightnessToRelativeLuminance(targetLabLightness, gamma, whitePoint)`

### 3.2. Core Matching Logic: `matchOklchWithCIELabL`

This is the heart of `matchoklch.v3.js`.
* **Decision:** This logic will be refactored into an internal helper function within `chromaControl.js`: `_matchOklchLightnessToTargetLuminance(oklchChroma, oklchHue, targetRelativeLuminance, options)`.
    * It will take target *relative luminance* directly, separating it from the modified Lab calculation.
    * It will use `oklab.js::oklchToSrgb` for OklCh to sRGB conversion.
    * It will use an internal helper `_getSrgbGamutAndLuminanceFromOklch` (see below) for gamut checking and luminance calculation of the trial sRGB color.
    * The binary search and iteration logic will be preserved.

### 3.3. Internal Helper: `_getSrgbGamutAndLuminanceFromOklch`

* **Decision:** Create an internal helper in `chromaControl.js`.
    * `_getSrgbGamutAndLuminanceFromOklch(oklchL, oklchC, oklchH)`:
        1.  Calls `oklab.js::oklchToSrgb({ L: oklchL, C: oklchC, h: oklchH })`.
        2.  Checks if the resulting `SrgbColor` components (r, g, b) are within the [0, 1] gamut.
        3.  If in gamut, calculates its relative luminance using `color-metrics.js`. (See Action for `color-metrics.js` below).
        4.  Returns `{ srgbColor, luminance, outOfGamut: boolean }`.

### 3.4. Exposed API for `chromaControl.js`

The new `chromaControl.js` module will export functions similar to the original `chroma-control.js`, but adapted to our new structure:

* **`findMaxChromaForLabLightness(oklchHue, targetLabLightness, options)`**
    * `oklchHue`: number (degrees)
    * `targetLabLightness`: number (CIELAB L\*, 0-100)
    * `options`: Optional object
        * `gamma`: number (for modified Lab to target luminance conversion, e.g., 2.3, 3.0, 3.6. Default could be 3.0 - gray surround).
        * `whitePoint`: `XyzColor` (for modified Lab, defaults to D65 from `utils.js`).
        * `chromaStep`: number (e.g., 0.001, for iteration).
        * `tolerance`: number (for luminance matching).
        * `maxIterations`: number.
    * **Steps:**
        1.  Calculate `targetRelativeLuminance` using `_labLightnessToRelativeLuminance(targetLabLightness, gamma, whitePoint)`.
        2.  Iteratively call `_matchOklchLightnessToTargetLuminance` with increasing `oklchChroma` values, checking the `outOfGamut` flag from its helper `_getSrgbGamutAndLuminanceFromOklch`.
        3.  Return the highest `oklchChroma` that is in gamut and whose resulting OkLCh.L (from `_matchOklchLightnessToTargetLuminance`) allows the color to be in gamut.

* **`adjustOklchForLabLightness(inputOklchColor, targetLabLightness, mode, options)`**
    * `inputOklchColor`: `OklchColor` object {L, C, h}. The input L is a starting point but will be overridden by the matching process.
    * `targetLabLightness`: number (CIELAB L\*, 0-100).
    * `mode`: string ('clip' or 'target').
    * `options`: Optional object
        * `gamma`, `whitePoint`, `chromaStep`, `tolerance`, `maxIterations` (as above).
        * `globalTargetChroma`: number (required for 'target' mode).
    * **Steps:**
        1.  Call `findMaxChromaForLabLightness` to get `maxAchievableChroma` for the given `inputOklchColor.h` and `targetLabLightness`.
        2.  Determine the `finalChroma` based on `mode`:
            * If `mode === 'target'`, `finalChroma = Math.min(options.globalTargetChroma, maxAchievableChroma)`.
            * If `mode === 'clip'`, `finalChroma = Math.min(inputOklchColor.C, maxAchievableChroma)`.
        3.  Calculate `targetRelativeLuminance` using `_labLightnessToRelativeLuminance(targetLabLightness, gamma, whitePoint)`.
        4.  Call `_matchOklchLightnessToTargetLuminance(finalChroma, inputOklchColor.h, targetRelativeLuminance, options)` to get the final matched OkLCh.L and gamut status.
        5.  Return the resulting `OklchColor` object `{ L: matchedL, C: finalChroma, h: inputOklchColor.h }` and an `outOfGamut` flag.

### 3.5. Dependencies for `chromaControl.js`

* `./utils.js`: For `D65_WHITE_POINT_XYZ`.
* `./oklab.js`: For `oklchToSrgb`.
* `./color-metrics.js`: For getting sRGB relative luminance.

**Action for `color-metrics.js`:**
To support `chromaControl.js` cleanly, `color-metrics.js` should export a function to get relative luminance directly from an `SrgbColor` object or hex string.
* Proposed new export from `color-metrics.js`: **`getSrgbRelativeLuminance(colorInput: SrgbColor | string): number`**
    * This function would essentially be the current internal `_getRelativeLuminanceForWcag` helper made public (or a new function with similar logic). It would handle parsing hex strings (using `srgb.js::parseSrgbHex`), converting `SrgbColor` to `LinearSrgbColor` (using `srgb.js::srgbToLinearSrgb`), and then calculating luminance using its internal `_calculateRelativeLuminance`.

This strategy aims to reuse our existing modules effectively while encapsulating the specialized logic of chroma control and modified Lab transformations within the new `chromaControl.js` module.
