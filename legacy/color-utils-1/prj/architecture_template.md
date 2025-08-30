# Architecture Document - color-utils Library

**Version:** 1.0
**Date:** May 6, 2025

## 1. Introduction

This document outlines the architecture, coding conventions, and design decisions for the `color-utils` JavaScript library. It serves as the blueprint for the refactoring process as detailed in the "Refactoring Plan v0.2". The primary goals guiding this architecture are outlined in `refactoring_goals.md`.

## 2. Coding Conventions

Consistency in coding style is crucial for maintainability and collaboration.

### 2.1. Naming Conventions

* **Variables & Parameters:** Use `camelCase` (e.g., `inputColor`, `referenceWhite`).
* **Functions & Methods:** Use `camelCase` (e.g., `convertToOklab`, `calculateDifference`).
    * For boolean-returning functions, consider prefixes like `is` or `has` (e.g., `isInGamut`).
* **Classes:** Use `PascalCase` (e.g., `ColorConverter`, `ViewingConditions`).
* **Constants:** Use `UPPER_SNAKE_CASE` (e.g., `D65_WHITE_POINT`, `SRGB_TO_XYZ_MATRIX`).
* **File Names:** Use `kebab-case` for JavaScript modules (e.g., `srgb.js`, `color-metrics.js`) and `PascalCase` or `UPPER_SNAKE_CASE` for documentation/configuration files where appropriate (e.g., `ARCHITECTURE.md`, `INPUT_FILE_INVENTORY.md`).

### 2.2. JSDoc Style

* Comprehensive JSDoc is required for all modules, classes, methods, functions, and type definitions.
* Use `@param`, `@returns`, `@throws`, `@deprecated` as needed.
* Clearly describe types. For complex types like color objects, centralized `@typedef` definitions in `src/types.js` will be used and referenced (e.g., `@param {RgbColor} color`). See Section 3 for type definitions.
* Provide a brief module overview comment at the top of each file.
* Example:
    ```javascript
    /**
     * Converts an sRGB color to Oklab.
     * @param {SrgbColor} srgbColor - The sRGB color object.
     * @returns {OklabColor} The Oklab color object.
     * @throws {TypeError} If the input is not a valid SrgbColor object.
     */
    function srgbToOklab(srgbColor) {
      // ... implementation
    }
    ```

### 2.3. ES6+ Features

* Utilize ES6 modules (`import`/`export`) for code organization.
* Use `const` by default; use `let` only when reassignment is necessary.
* Prefer arrow functions for anonymous functions and when `this` context is not an issue. Use regular functions for object methods where `this` is important or when a named function is clearer.
* Use template literals for string construction.
* Employ modern JavaScript features where they improve clarity and conciseness (e.g., spread syntax, destructuring).

### 2.4. Code Formatting

* **Tooling:** [Decision needed: e.g., Prettier with largely default settings, ESLint with a standard style guide like Airbnb or StandardJS]. This will ensure automated consistency.
* **Line Length:** Aim for a maximum line length of [Decision needed: e.g., 100 or 120 characters].
* **Indentation:** Use spaces, [Decision needed: e.g., 2 or 4 spaces per indent level].
* **Semicolons:** [Decision needed: Always use semicolons / Use semicolons where ASI might be ambiguous].

### 2.5. Comments

* Use JSDoc for API documentation.
* For complex logic within functions, use `//` for single-line comments or `/* ... */` for multi-line comments to explain non-obvious parts of the code.
* Avoid redundant comments that merely restate what the code does. Focus on *why* something is done a certain way if it's not immediately clear.

## 3. Standardized Color Object Structures & Types

All color spaces will have standardized object structures. These will be formally defined as JSDoc `@typedef` in `src/types.js`. This aligns with the goal of a consistent API design.

* **`SrgbColor`**:
    * `{ r: number, g: number, b: number }`
    * Range: Typically 0.0 to 1.0 for float representations. For 8-bit integer context (e.g., when parsing hex), values are 0-255 but should be normalized to 0.0-1.0 for internal library use.
* **`LinearSrgbColor`**:
    * `{ r: number, g: number, b: number }`
    * Range: 0.0 to 1.0 (values can exceed this range during intermediate calculations but represent out-of-gamut colors).
* **`XyzColor`**:
    * `{ x: number, y: number, z: number }`
    * Range: Y is typically 0.0 to 1.0 (or 0-100 if using that scale, decision: prefer 0-1 for consistency with luminance in other models like Oklab). X and Z relative to reference white.
* **`LabColor` (CIELAB L\*, a\*, b\*)**:
    * `{ L: number, a: number, b: number }`
    * Range: L\*: 0-100. a\*, b\*: Theoretically unbounded, practically often within -128 to +127.
* **`LchColor` (CIELCh L\*, C\*, h)**:
    * `{ L: number, C: number, h: number }`
    * Range: L\*: 0-100. C\*: 0 to approx 150+. h: 0-360 (degrees).
* **`OklabColor`**:
    * `{ L: number, a: number, b: number }`
    * Range: L: 0.0 to 1.0. a, b: approx -0.4 to +0.4, can extend further for very saturated colors.
* **`OklchColor`**:
    * `{ L: number, C: number, h: number }`
    * Range: L: 0.0 to 1.0. C: 0 to approx 0.5. h: 0-360 (degrees).
* **`Ciecam16ColorAppearance` (Properties to include TBD based on `cat16.js` analysis and common use cases. Example properties):**
    * `{ J: number, Q: number, M: number, s: number, C: number, h: number, Hc: number }` (Lightness, Brightness, Colorfulness, Saturation, Chroma, Hue Angle, Hue Composition)
    * Ranges will depend on the specific CAM16 implementation and viewing conditions.
* **`ViewingConditions` (for CIECAM16 and potentially Adaptive Oklab):**
    * An object specifying parameters like adapting luminance (`La`), background luminance (`Yb`), surround type (`surround`), D-value (`D_value`), etc.
    * `{ La: number, Yb: number, surround: 'average' | 'dim' | 'dark', D_value: number }` (Example structure, to be refined).
* **Color Encodings (Input/Output Handling):**
    * Functions accepting sRGB colors should be flexible (e.g., accept hex strings `#RRGGBB`, `#RGB`, `rgb(r,g,b)` strings, or `SrgbColor` objects) as per the "Specific Functional Goals". Internally, these should be parsed into the standard `SrgbColor` (0.0-1.0 range) object.

**Units and Ranges Notes:**

* **Angles (Hue):** Standardize on **degrees** (0-360) for all hue parameters in color objects (LCh, OkLCh, CIECAM16 hue). Internal calculations involving `Math.sin`/`Math.cos` will require conversion to/from radians, likely using helpers from `utils.js`.
* **Reference White:** Unless specified otherwise (e.g., by CAM16 viewing conditions), assume **D65** reference white for conversions involving XYZ, CIELAB. This should be clearly documented for relevant functions.

## 4. Module Breakdown

The library will be organized into discrete ES6 modules as outlined in the Refactoring Plan and Refactoring Goals. All modules will reside in the `src/` directory.

* **`src/index.js`**: Main entry point for the library. Exports the public API by re-exporting selected functionalities from other modules.
* **`src/types.js`**: Contains JSDoc `@typedef` definitions for all shared types, especially color object structures. No executable code.
* **`src/utils.js`**: Core utility functions (e.g., math helpers like `degreesToRadians`, `radiansToDegrees`, matrix operations, number clamping, string parsing for color codes, sRGB-linear conversions if very generic).
* **`src/srgb.js`**: sRGB color space operations.
    * sRGB (gamma-corrected) <-> Linear sRGB.
    * Linear sRGB <-> XYZ.
    * Hex/string parsing to `SrgbColor` (if not in `utils.js`).
    * `SrgbColor` to Hex/string formatting.
* **`src/cielab.js`**: CIELAB color space operations.
    * XYZ <-> CIELAB (L\*, a\*, b\*).
* **`src/cielch.js`**: CIELCh color space operations.
    * CIELAB <-> CIELCh (L\*, C\*, h).
* **`src/oklab.js`**: Oklab color space operations.
    * Linear sRGB <-> Oklab. (Plan Task 3.4.1) (Note: The plan also suggests sRGB non-linear input, which implies this module or `srgb.js` would handle the gamma correction step).
* **`src/oklch.js`**: OkLCh color space operations.
    * Oklab <-> OkLCh.
* **`src/aoklab.js`**: Adaptive Oklab operations (consolidating `adaptive-oklab.js`, `aoklab-dark.js`, `aoklab-gray.js`, `aoklab-white.js` from the inventory).
    * Likely a configurable function or class that takes into account surround conditions and target lightness.
* **`src/ciecam16.js`**: CIECAM16 appearance model calculations (based on `cat16.js` from the inventory).
    * Forward (XYZ to Appearance Correlates) and potentially reverse transformations.
    * Requires clear parameterization of viewing conditions.
* **`src/color-metrics.js`**: Color difference and contrast calculations.
    * WCAG contrast ratio (from `checkWCAGContrast.v4.js`).
    * CIEDE2000 (from `color-metrics.js`).
    * Other relevant metrics (e.g., simple Euclidean distance in Lab or Oklab).
* **`src/chroma-control.js`**: Advanced chroma control functionalities (based on `chroma-control.js` and potentially `matchoklch.v3.js` from the inventory). The exact structure depends on Task 4.2.1 (Analyze and Plan `chroma-control.js` Refactoring).

## 5. ES6 Module Imports/Exports

* **Exports from `src/index.js`**: This file will be the single public entry point. It will use named exports to expose the library's API.
    ```javascript
    // Example: src/index.js
    export { srgbToOklab } from './oklab.js';
    export { calculateWcagContrast } from './color-metrics.js';
    export { LabColor, OklabColor } from './types.js'; // If types are exported for consumers
    // ... other public functions and classes
    ```
* **Exports from individual modules (`src/*.js` excluding `index.js` and `types.js`)**:
    * Prefer **named exports** for all functions and constants.
    * If a module defines a primary class (e.g., `Ciecam16Model` in `ciecam16.js`), that class can be a default export or a named export, depending on a consistent project decision. [Decision needed: Prefer named exports universally for simplicity, or allow default for primary class per module? Recommendation: Lean towards named exports for consistency.]
* **Imports:**
    * Use relative paths for imports between modules within the `src/` directory (e.g., `import { matrixMultiply } from './utils.js';`).
    * Import types from `./types.js` where JSDoc type hinting is used in function signatures (e.g., `/** @param {import('./types.js').SrgbColor} color */`).

## 6. Error Handling Strategy

A consistent error handling strategy is a key refactoring goal.

* **Invalid Inputs:**
    * For functions expecting specific color object structures or types, **throw `TypeError`** if the input does not conform (e.g., missing properties, incorrect property types). Provide a descriptive message.
    * For color string inputs (e.g., hex codes) that cannot be parsed, **throw `SyntaxError`** or a custom `InvalidColorFormatError`.
* **Out-of-Gamut Values:**
    * Conversions to spaces with limited gamuts (like sRGB) may produce values outside the 0-1 range.
    * **Decision:**
        1.  **Option A: Clamp by default.** Functions performing these conversions (e.g., `oklabToSrgb`) could clamp the output sRGB values to the [0, 1] range by default and potentially offer an option to return unclamped values.
        2.  **Option B: Return unclamped values by default.** Return the raw, potentially out-of-gamut values and provide separate utility functions to check gamut or clamp colors. This offers more flexibility to the user.
        3.  **Option C: Return an object indicating out-of-gamut status.** e.g., `{ color: SrgbColor, isInGamut: boolean }`.
    * **Recommendation:** Option B offers more information to the user. Clamping can be a separate utility. A helper like `srgbIsInGamut(srgbColor)` could also be provided.
* **Computational Errors:**
    * For mathematical errors like division by zero if they can occur with valid inputs (though unlikely in most color math if inputs are validated), throw `Error` or a more specific custom error.
* **Custom Error Types (Optional but Recommended):**
    * Consider defining custom error classes that extend `Error` for better error categorization (e.g., `InvalidColorInputError`, `OutOfGamutError`, `UnsupportedConversionError`). This makes catching specific error types easier for users.
    ```javascript
    // Example custom error
    class InvalidColorInputError extends TypeError {
      constructor(message) {
        super(message);
        this.name = 'InvalidColorInputError';
      }
    }
    ```

## 7. Dependencies

* **External Dependencies:** Aim for minimal to zero runtime external dependencies to keep the library lightweight and reduce potential issues. Development dependencies (for testing, linting, bundling, docs) are acceptable (e.g., Jest, Prettier, ESLint, JSDoc generator).
* **Internal Dependencies:** Modules will depend on each other (e.g., `oklab.js` might use functions from `srgb.js` or `utils.js`). These are managed via ES6 imports.

## 8. Build Process & Packaging (Brief Overview)

* While Phase 5 covers this in detail, the architecture should anticipate it.
* The library will be packaged as an ES module.
* A build step might be needed for:
    * Bundling (e.g., creating UMD builds for wider compatibility, though ES modules are becoming standard).
    * Minification for production use.
    * [Decision: Will there be a CommonJS version provided?]
* `package.json` will define entry points (`"main"`, `"module"`), scripts, and dependencies.

## 9. Open Questions / Items for Decision

* **Coding Formatting Tooling (Section 2.4):** Specific tool (Prettier/ESLint) and configuration.
* **Indentation Level & Semicolon Usage (Section 2.4).**
* **XYZ Color Y-scale (Section 3):** Confirm 0-1 scale for Y.
* **Default Export Strategy (Section 5):** Named exports only, or allow default for primary class? (Recommended: named only).
* **Out-of-Gamut Handling (Section 6):** Default behavior for conversions resulting in out-of-gamut colors (Clamp / Unclamped / Object with status). (Recommended: Unclamped by default, provide clamping utilities).
* **Build Process - CommonJS version (Section 8):** Is a CJS build required?

This `ARCHITECTURE.md` document should be considered a living document and may be updated as the project progresses and new insights are gained, though core architectural decisions should aim for stability.