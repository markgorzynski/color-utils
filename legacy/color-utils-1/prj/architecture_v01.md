# Architecture Document - color-utils Library

**Version:** 1.1
**Date:** May 6, 2025

## 1. Introduction

This document outlines the architecture, coding conventions, and design decisions for the `color-utils` JavaScript library. It serves as the blueprint for the refactoring process as detailed in the "Refactoring Plan v0.2". The primary goals guiding this architecture are outlined in `refactoring_goals.md`.

## 2. Coding Conventions

Consistency in coding style is crucial for maintainability and collaboration.

### 2.1. Naming Conventions

Naming conventions in color science and related software present unique challenges due to the interplay between scientific notation, common usage, and programming language constraints. For instance, sRGB is often written with a lowercase 's' in general text, while tristimulus values X, Y, Z are uppercase, and their corresponding chromaticity coordinates x, y, z are lowercase. Color transformation functions frequently describe a sequence of operations (e.g., gamma-corrected sRGB to linear sRGB, or linear sRGB to CIE XYZ). This section details a consistent naming strategy for the `color-utils` library, drawing from established practices.

#### 2.1.1. Review of Common Naming Conventions

* **W3C/CSS:**
    * **Color Functions:** Generally lowercase (e.g., `rgb()`, `hsl()`, `lab()`, `lch()`, `oklab()`, `oklch()`).
    * **Predefined Color Space Identifiers:** Lowercase and hyphenated where necessary (e.g., `srgb`, `srgb-linear`, `display-p3`, `rec2020`, `xyz-d50`, `xyz-d65`).
    * **Component Parameters:** Often single letters matching scientific notation (e.g., `L a b` in `lab(L a b)`).
* **JavaScript Color Libraries (e.g., Chroma.js, Color.js, Culori, D3-color):**
    * **Color Space Reference:** Often use lowercase strings (`'srgb'`, `'oklab'`) or lowercase function/method names (`.lab()`, `oklab()`).
    * **Object Property/Component Names:** Typically lowercase single letters (`r`, `g`, `b`, `l`, `a`, `b`, `c`, `h`) for conciseness and mapping to scientific symbols.
    * **Conversion Functions:** Vary widely, from `sourceToTarget()` patterns to method chaining (`color.to('targetspace')`) or constructor-based conversion (`new TargetSpace(sourceColor)`).
* **Scientific Notation:**
    * Uses specific casing like sRGB, XYZ (tristimulus), L\*a\*b\* (CIELAB components), L (Oklab Lightness). This precise notation is important in publications but often simplified in code.

#### 2.1.2. Recommended Naming Strategy for `color-utils`

This strategy aims for clarity, consistency, JavaScript conventions (camelCase, PascalCase), and respects the scientific background.

**A. Color Space Identifiers & Type Names**

We'll establish a base identifier for each color space, primarily for use in constructing function and type names. These will generally be camelCased versions of the common name. Type names will be PascalCase.

| Color Space        | Base Identifier (for code) | JSDoc Type Name      | Notes                                                                                                |
| :----------------- | :------------------------- | :------------------- | :--------------------------------------------------------------------------------------------------- |
| sRGB (gamma)       | `srgb`                     | `SrgbColor`          | Standard Red Green Blue                                                                              |
| Linear sRGB        | `linearSrgb`               | `LinearSrgbColor`    | sRGB with linear transfer characteristics                                                            |
| CIE XYZ            | `xyz`                      | `XyzColor`           | Tristimulus values. Assumed D65 unless specified.                                                    |
| CIELAB             | `lab`                      | `LabColor`           | Represents L\*, a\*, b\* values.                                                                     |
| CIELCh             | `lch`                      | `LchColor`           | Represents L\*, C\*, h values (cylindrical CIELAB).                                                  |
| Oklab              | `oklab`                    | `OklabColor`         |                                                                                                      |
| OkLCh              | `oklch`                    | `OklchColor`         | Cylindrical Oklab.                                                                                   |
| CIECAM16           | `ciecam16`                 | `Ciecam16Appearance` | For the set of appearance correlates.                                                                |
| Adaptive Oklab     | `adaptiveOklab` (or `aoklab`) | `AdaptiveOklabColor`| Or a more specific name based on its parameters/return type if distinct from `OklabColor`.         |

**B. Color Object Property Names**

These should be `camelCase` or single letters (lowercase or uppercase if they are established scientific symbols and unambiguous in JavaScript). `La` and `Yb` in `ViewingConditions` are treated as such established multi-letter symbols.

* **`SrgbColor`**: `{ r: number, g: number, b: number }`
* **`LinearSrgbColor`**: `{ r: number, g: number, b: number }`
* **`XyzColor`**: `{ x: number, y: number, z: number }` (JSDoc to clarify these represent tristimulus values X, Y, Z)
* **`LabColor`**: `{ L: number, a: number, b: number }` (JSDoc to note these correspond to L\*, a\*, b\*)
* **`LchColor`**: `{ L: number, C: number, h: number }` (JSDoc for L\*, C\*, h)
* **`OklabColor`**: `{ L: number, a: number, b: number }`
* **`OklchColor`**: `{ L: number, C: number, h: number }`
* **`Ciecam16Appearance`**: Based on standard CAM16 correlates. Using uppercase single letters if they are the broadly recognized symbols is acceptable here. Example: `{ J: number, Q: number, M: number, s: number, C: number, h: number, Hc: number }`. These should align with the outputs from `cat16.js`.
* **`ViewingConditions`**: `{ La: number, Yb: number, surround: 'average' | 'dim' | 'dark', dValue: number }` (Properties `La` and `Yb` are standard symbols for adapting luminance and background luminance Y component respectively. `dValue` for the D-value parameter).

**C. Function Naming Conventions**

* **General:** All function names will be `camelCase`.
* **Conversion Functions:**
    * Use the explicit pattern: `sourceColorSpaceIdentifierToTargetColorSpaceIdentifier(sourceColor, options?)`.
    * Examples:
        * `srgbToLinearSrgb(srgbColor)`
        * `linearSrgbToXyz(linearSrgbColor)`
        * `xyzToLab(xyzColor)` (Defaulting to D65 as per architecture; if other illuminants were supported, `xyzD65ToLab` or an option would be needed).
        * `labToLch(labColor)`
        * `linearSrgbToOklab(linearSrgbColor)`
        * `oklabToOklch(oklabColor)`
    * **Pipelined Conversions:** For convenience, functions that perform multiple steps can be named by their ultimate start and end points. Their implementation will call the intermediate step functions.
        * `srgbToXyz(srgbColor)` (internally: srgb -> linearSrgb -> XYZ)
        * `srgbToLab(srgbColor)` (internally: srgb -> linearSrgb -> XYZ -> Lab)
        * `srgbToOklab(srgbColor)` (internally: srgb -> linearSrgb -> Oklab)
* **Parsing Functions:**
    * `parseSrgbHex(hexString)`
    * `parseLabString(labString)` (if string inputs beyond hex are supported for other spaces)
* **Formatting Functions:**
    * `formatSrgbAsHex(srgbColor)`
* **Utility/Metric Functions:**
    * `calculateWcagContrast(srgbColor1, srgbColor2)`
    * `calculateLabDeltaE2000(labColor1, labColor2)`
    * `isSrgbInGamut(srgbColor)`
    * `clampSrgb(srgbColor)`

**D. Variable Naming**

* Standard `camelCase` for local variables, parameters, etc.
* Examples: `sourceColor`, `targetColorModel`, `xyzCoordinates`, `oklabOutput`.

**E. Other Naming Conventions (General Project Conventions)**
* **Classes:** Use `PascalCase` (e.g., `ColorConverter`, `ViewingConditions`). This applies if the library evolves to use class-based structures for more complex models or stateful operations.
* **Constants:** Use `UPPER_SNAKE_CASE` (e.g., `D65_WHITE_POINT`, `SRGB_TO_XYZ_MATRIX`).
* **File Names:** Use `kebab-case` for JavaScript modules (e.g., `srgb.js`, `color-metrics.js`) and `PascalCase` or `UPPER_SNAKE_CASE` for documentation/configuration files where appropriate (e.g., `ARCHITECTURE.md`, `INPUT_FILE_INVENTORY.md`).

**Key advantages of this detailed naming strategy:**

* **Clarity:** Function names explicitly state the transformation.
* **Consistency:** Follows a predictable pattern.
* **Discoverability:** Users can more easily guess function names.
* **Alignment with Goals:** Supports modularity (single-step functions) and usability (pipelined convenience functions).
* **JavaScript Friendly:** Uses standard JavaScript casing conventions.

### 2.2. JSDoc Style

* Comprehensive JSDoc is required for all modules, classes, methods, functions, and type definitions.
* Use `@param`, `@returns`, `@throws`, `@deprecated` as needed.
* Clearly describe types. For complex types like color objects, centralized `@typedef` definitions in `src/types.js` will be used and referenced (e.g., `@param {SrgbColor} color`). See Section 3 for type definitions.
* Provide a brief module overview comment at the top of each file.
* Example:
    ```javascript
    /**
     * Converts a gamma-corrected sRGB color to Oklab.
     * This involves an internal conversion from sRGB to linear sRGB, then to Oklab.
     * @param {SrgbColor} srgbColor - The sRGB color object (components 0-1).
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

Consistent code formatting is essential for readability and maintainability. The chosen style emphasizes clarity, especially to support comprehensive documentation and ease of understanding.

* **Tooling:**
    * **Primary Formatter:** **Prettier**. It is highly recommended to integrate Prettier into the development workflow (e.g., via VS Code extensions, pre-commit hooks). This will ensure automated consistency across the codebase.
    * **Configuration:** Use Prettier with the following settings (many are defaults but explicitly stated for clarity):
        * `printWidth`: 100
        * `tabWidth`: 2
        * `useTabs`: `false` (Use spaces for indentation).
        * `semi`: `true` (Always use semicolons).
        * `singleQuote`: `true` (Use single quotes for strings).
        * `trailingComma`: `es5` (Trailing commas for multi-line arrays/objects, not function parameters).
        * `bracketSpacing`: `true` (e.g., `{ foo: bar }`).
        * `arrowParens`: `always` (e.g., `(x) => x`).
* **Line Length:** Aim for a maximum line length of **100 characters**. Prettier will handle this.
* **Indentation:** Use **2 spaces** per indent level.
* **Semicolons:** **Always use semicolons**.
* **Blank Lines:** Use blank lines judiciously to separate logical blocks of code. Prettier handles this well.
* **Readability and Documentation Focus:**
    * Prioritize clear, vertical alignment for complex data structures or long parameter lists if Prettier's default wrapping is not optimal for human understanding. Use `// prettier-ignore` sparingly for highly-tuned blocks where readability is paramount for documentation or complex algorithms.
    * Ensure code formatting complements JSDoc blocks.

**Rationale for Prettier with these settings:**
* Aligns with VS Code's default behavior and common practices.
* Promotes readable code and supports comprehensive documentation.
* Reduces cognitive load by automating formatting decisions.

**Action Item:**
* Add a `.prettierrc.json` to the project root with the following content:
    ```json
    {
      "printWidth": 100,
      "tabWidth": 2,
      "useTabs": false,
      "semi": true,
      "singleQuote": true,
      "trailingComma": "es5",
      "bracketSpacing": true,
      "arrowParens": "always"
    }
    ```

### 2.5. Comments

* Use JSDoc for API documentation.
* For complex logic within functions, use `//` for single-line comments or `/* ... */` for multi-line comments to explain non-obvious parts of the code.
* Avoid redundant comments that merely restate what the code does. Focus on *why* something is done a certain way if it's not immediately clear.

## 3. Standardized Color Object Structures & Types

All color spaces will have standardized object structures. These will be formally defined as JSDoc `@typedef` in `src/types.js` using the `PascalCase` type names defined in Section 2.1.2.A (e.g., `SrgbColor`, `LabColor`). This aligns with the goal of a consistent API design.

* **`SrgbColor`**:
    * `{ r: number, g: number, b: number }`
    * Range: Typically 0.0 to 1.0 for float representations. For 8-bit integer context (e.g., when parsing hex), values are 0-255 but should be normalized to 0.0-1.0 for internal library use.
* **`LinearSrgbColor`**:
    * `{ r: number, g: number, b: number }`
    * Range: 0.0 to 1.0 (values can exceed this range during intermediate calculations but represent out-of-gamut colors).
* **`XyzColor`**:
    * `{ x: number, y: number, z: number }`
    * Range: Y is typically 0.0 to 1.0. X and Z relative to reference white. (JSDoc to clarify these represent tristimulus values X, Y, Z). Decision: Y scale 0-1 confirmed for consistency.
* **`LabColor`**:
    * `{ L: number, a: number, b: number }`
    * Range: L\*: 0-100. a\*, b\*: Theoretically unbounded, practically often within -128 to +127. (JSDoc to note these correspond to L\*, a\*, b\*).
* **`LchColor`**:
    * `{ L: number, C: number, h: number }`
    * Range: L\*: 0-100. C\*: 0 to approx 150+. h: 0-360 (degrees). (JSDoc for L\*, C\*, h).
* **`OklabColor`**:
    * `{ L: number, a: number, b: number }`
    * Range: L: 0.0 to 1.0. a, b: approx -0.4 to +0.4, can extend further for very saturated colors.
* **`OklchColor`**:
    * `{ L: number, C: number, h: number }`
    * Range: L: 0.0 to 1.0. C: 0 to approx 0.5. h: 0-360 (degrees).
* **`Ciecam16Appearance`**:
    * `{ J: number, Q: number, M: number, s: number, C: number, h: number, Hc: number }` (Example properties: Lightness, Brightness, Colorfulness, Saturation, Chroma, Hue Angle, Hue Composition. To be finalized based on `cat16.js` analysis and common use cases).
    * Ranges will depend on the specific CAM16 implementation and viewing conditions.
* **`ViewingConditions`**:
    * `{ La: number, Yb: number, surround: 'average' | 'dim' | 'dark', dValue: number }` (Properties `La` and `Yb` are standard symbols for adapting luminance and background luminance Y component respectively. `dValue` for the D-value parameter, changed from `D_value` for camelCase consistency).
* **Color Encodings (Input/Output Handling):**
    * Functions accepting sRGB colors should be flexible (e.g., accept hex strings `#RRGGBB`, `#RGB`, `rgb(r,g,b)` strings, or `SrgbColor` objects) as per the "Specific Functional Goals". Internally, these should be parsed into the standard `SrgbColor` (0.0-1.0 range) object.

**Units and Ranges Notes:**

* **Angles (Hue):** Standardize on **degrees** (0-360) for all hue parameters in color objects (LCh, OkLCh, CIECAM16 hue). Internal calculations involving `Math.sin`/`Math.cos` will require conversion to/from radians, likely using helpers from `utils.js`.
* **Reference White:** Unless specified otherwise (e.g., by CAM16 viewing conditions), assume **D65** reference white for conversions involving XYZ, CIELAB. This should be clearly documented for relevant functions.

## 4. Module Breakdown

The library will be organized into discrete ES6 modules as outlined in the Refactoring Plan and Refactoring Goals. All modules will reside in the `src/` directory. Function names within these modules will adhere to the conventions in Section 2.1.2.C.

* **`src/index.js`**: Main entry point for the library. Exports the public API by re-exporting selected functionalities from other modules.
* **`src/types.js`**: Contains JSDoc `@typedef` definitions for all shared types, especially color object structures. No executable code.
* **`src/utils.js`**: Core utility functions (e.g., math helpers like `degreesToRadians`, `radiansToDegrees`, matrix operations, number clamping, string parsing for color codes, sRGB-linear conversions if very generic).
* **`src/srgb.js`**: sRGB color space operations.
    * `srgbToLinearSrgb`, `linearSrgbToSrgb`
    * `linearSrgbToXyz`, `xyzToLinearSrgb`
    * Convenience pipelines: `srgbToXyz`, `xyzToSrgb`
    * Parsing/Formatting: `parseSrgbHex`, `formatSrgbAsHex` (if not in `utils.js`).
* **`src/cielab.js`**: CIELAB color space operations.
    * `xyzToLab`, `labToXyz`
* **`src/cielch.js`**: CIELCh color space operations.
    * `labToLch`, `lchToLab`
* **`src/oklab.js`**: Oklab color space operations.
    * `linearSrgbToOklab`, `oklabToLinearSrgb`
    * Convenience pipelines: `srgbToOklab`, `oklabToSrgb`
* **`src/oklch.js`**: OkLCh color space operations.
    * `oklabToOklch`, `oklchToOklab`
* **`src/aoklab.js`**: Adaptive Oklab operations (consolidating `adaptive-oklab.js`, `aoklab-dark.js`, `aoklab-gray.js`, `aoklab-white.js` from the inventory).
    * Likely a configurable function or class that takes into account surround conditions and target lightness. Function names TBD based on final design (e.g., `calculateAdaptiveOklab`).
* **`src/ciecam16.js`**: CIECAM16 appearance model calculations (based on `cat16.js` from the inventory).
    * `xyzToCiecam16`, `ciecam16ToXyz` (if reverse is implemented).
    * Requires clear parameterization of viewing conditions.
* **`src/color-metrics.js`**: Color difference and contrast calculations.
    * `calculateWcagContrast` (likely takes two sRGB colors).
    * `calculateLabDeltaE2000` (takes two `LabColor` objects).
    * Other relevant metrics (e.g., `calculateOklabDistance`).
* **`src/chroma-control.js`**: Advanced chroma control functionalities (based on `chroma-control.js` and potentially `matchoklch.v3.js` from the inventory). The exact structure depends on Task 4.2.1 (Analyze and Plan `chroma-control.js` Refactoring).

## 5. ES6 Module Imports/Exports

* **Exports from `src/index.js`**: This file will be the single public entry point. It will use named exports to expose the library's API.
    ```javascript
    // Example: src/index.js
    export { srgbToOklab, oklabToSrgb } from './oklab.js'; // Exposing pipeline function
    export { linearSrgbToOklab, oklabToLinearSrgb } from './oklab.js'; // Exposing single-step
    export { calculateWcagContrast } from './color-metrics.js';
    export { LabColor, OklabColor } from './types.js'; // If types are exported for consumers
    // ... other public functions and classes
    ```
* **Exports from individual modules (`src/*.js` excluding `index.js` and `types.js`)**:
    * Prefer **named exports** for all functions and constants.
    * If a module defines a primary class (e.g., `Ciecam16Model` in `ciecam16.js`), that class can be a default export or a named export. Recommendation: Lean towards named exports universally for consistency. [Decision needed].
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
    * **Recommendation:** Return unclamped values by default. Provide separate utility functions to check gamut (e.g., `isSrgbInGamut(srgbColor)`) or clamp colors (e.g., `clampSrgb(color)`). This offers more flexibility to the user. [Decision needed].
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
    * [Decision needed: Will there be a CommonJS version provided?]
* `package.json` will define entry points (`"main"`, `"module"`), scripts, and dependencies.

## 9. Open Questions / Items for Decision

* **XYZ Color Y-scale (Section 3):** Confirm 0-1 scale for Y. (Decision: 0-1 confirmed).
* **Default Export Strategy (Section 5):** Named exports only, or allow default for primary class? (Recommendation: named only). [Decision needed].
* **Out-of-Gamut Handling (Section 6):** Default behavior for conversions resulting in out-of-gamut colors (Clamp / Unclamped / Object with status). (Recommendation: Unclamped by default, provide clamping utilities). [Decision needed].
* **Build Process - CommonJS version (Section 8):** Is a CJS build required? [Decision needed].

This `ARCHITECTURE.md` document should be considered a living document and may be updated as the project progresses and new insights are gained, though core architectural decisions should aim for stability.