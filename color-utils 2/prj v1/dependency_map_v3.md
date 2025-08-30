# Module Dependency Map (v3)

This document outlines the dependencies between the modules in the `color-utils` library.
An arrow `A -> B` means module `A` imports functions or constants from module `B`.
This version reflects `getSrgbRelativeLuminance` being exported from `color-metrics.js`.

* **`utils.js`**
    * Dependencies: None
    * Key Exports: `D65_WHITE_POINT_XYZ`, `degreesToRadians`, `radiansToDegrees`, `multiplyMatrixVector`, `signPreservingPow`, `clamp`

* **`srgb.js`**
    * Dependencies:
        * `srgb.js` -> `utils.js`
            * Uses: `multiplyMatrixVector`, `clamp`
    * Key Exports: `srgbToLinearSrgb`, `linearSrgbToSrgb`, `linearSrgbToXyz`, `xyzToLinearSrgb`, `srgbToXyz`, `xyzToSrgb`, `parseSrgbHex`, `formatSrgbAsHex`

* **`cielab.js`** (Contains CIELAB and CIELCh)
    * Dependencies:
        * `cielab.js` -> `utils.js`
            * Uses: `D65_WHITE_POINT_XYZ`, `degreesToRadians`, `radiansToDegrees`
        * `cielab.js` -> `srgb.js`
            * Uses: `srgbToXyz` (as `srgbObjectToXyzObject`), `xyzToSrgb` (as `xyzObjectToSrgbObject`)
    * Key Exports: `xyzToLab`, `labToXyz`, `labToLch`, `lchToLab`, `srgbToLab`, `labToSrgb`, `srgbToLch`, `lchToSrgb`

* **`oklab.js`** (Contains Oklab and OkLCh)
    * Dependencies:
        * `oklab.js` -> `utils.js`
            * Uses: `multiplyMatrixVector`, `degreesToRadians`, `radiansToDegrees`
        * `oklab.js` -> `srgb.js`
            * Uses: `srgbToLinearSrgb`, `linearSrgbToSrgb`
    * Key Exports: `linearSrgbToOklab`, `oklabToLinearSrgb`, `oklabToOklch`, `oklchToOklab`, `srgbToOklab`, `oklabToSrgb`, `srgbToOklch`, `oklchToSrgb`

* **`aoklab.js`** (Adaptive Oklab)
    * Dependencies:
        * `aoklab.js` -> `utils.js`
            * Uses: `signPreservingPow`, `multiplyMatrixVector`
        * `aoklab.js` -> `srgb.js`
            * Uses: `srgbToXyz`, `xyzToSrgb`, `parseSrgbHex`, `formatSrgbAsHex`, `linearSrgbToSrgb`, `linearSrgbToXyz`
    * Key Exports: `AdaptiveOklab` class

* **`ciecam16.js`**
    * Dependencies:
        * `ciecam16.js` -> `utils.js`
            * Uses: `D65_WHITE_POINT_XYZ`, `multiplyMatrixVector`, `radiansToDegrees`, `degreesToRadians`
        * `ciecam16.js` -> `srgb.js`
            * Uses: `srgbToXyz`
    * Key Exports: `srgbToCiecam16`

* **`color-metrics.js`**
    * Dependencies:
        * `color-metrics.js` -> `utils.js`
            * Uses: `degreesToRadians`, `radiansToDegrees`
        * `color-metrics.js` -> `srgb.js`
            * Uses: `parseSrgbHex`, `srgbToLinearSrgb`
    * Key Exports: `getSrgbRelativeLuminance`, `calculateWcagContrast`, `isWcagContrastSufficient`, `calculateCiede2000`, `calculateOklchDifference`

* **`chromaControl.js`** (Planned)
    * Dependencies (Anticipated):
        * `chromaControl.js` -> `utils.js`
            * Uses: `D65_WHITE_POINT_XYZ`
        * `chromaControl.js` -> `oklab.js`
            * Uses: `oklchToSrgb`
        * `chromaControl.js` -> `color-metrics.js`
            * Uses: `getSrgbRelativeLuminance`

**Summary of Key Changes Reflected in this Map:**

* `utils.js` is generic.
* `srgb.js` encapsulates sRGB EOTF (as internal helpers) and hex string utilities.
* `color-metrics.js` now clearly exports `getSrgbRelativeLuminance` for direct use, in addition to other metrics. Its internal luminance calculation is named `_calculateCieRelativeLuminance` for clarity.
* The anticipated dependencies for `chromaControl.js` are updated.

This map should now accurately reflect the intended structure after the refactoring.
