# Refactoring Plan v0.2

**Document Version:** 0.2
**Date:** 2025-05-06
**Objective:** To refactor the existing color utility JavaScript libraries into a modular, well-documented, and maintainable codebase. This plan outlines all phases and tasks, specifying performers, inputs, outputs, and instructions.

---

**Phase 0: Input Scoping & Initial Planning**

This phase focuses on defining the project's goals, collecting and verifying all necessary source files, and then creating this comprehensive refactoring plan based on those findings.

* **Task 0.1: Define Overall Refactoring Goals**
    * **Performer:** Person (with AI assistance if desired)
    * **Description:** Establish and document the primary objectives for this refactoring effort. This sets the high-level criteria for success.
    * **Inputs:**
        * User's initial request for refactoring.
        * Existing codebase (for context on current state).
    * **Outputs:**
        * **Refactoring Goals Document (or section in this plan):** A clear statement of goals (e.g., improved modularity, consistent API design, comprehensive JSDoc, specific color object structures, enhanced testability, integration of all provided scripts into a cohesive library).
    * **Instruction for Person:** Review the initial refactoring request. Articulate the key outcomes desired from this project. For example: "All color conversion functions should be organized into discrete ES6 modules by color space," or "A consistent error handling strategy should be implemented." Document these goals.

* **Task 0.2: Input Asset Collection and Verification**
    * **Performer:** Person
    * **Description:** Gather all original source code files intended for refactoring. This includes attempting to locate `chroma-control.js` and its potential dependency `matchoklch.v3.js`. The collected files will be inventoried, and the status of any missing files will be documented.
    * **Inputs:**
        * Initial list of expected project files (e.g., `adaptive-oklab.js`, `aoklab-dark.js`, `aoklab-gray.js`, `aoklab-white.js`, `cat16.js`, `checkWCAGContrast.v4.js`, `cielab.v3.js`, `color-metrics.js`, `oklab-simple.v3.js`, and specifically `chroma-control.js`, `matchoklch.v3.js`).
        * User's file system / project archives.
    * **Outputs:**
        * **Verified Input File Inventory (Document):** A document (e.g., `INPUT_FILE_INVENTORY.md`) listing all located source code files confirmed for refactoring. This document must also state the status of `chroma-control.js` and `matchoklch.v3.js` (e.g., "found," "not found - functionality to be reimplemented," "not found - dependent features may be out of scope").
        * A local collection/directory of all verified original source code files.
    * **Instruction for Person:** Systematically locate all JavaScript files that are part of this refactoring project. Pay special attention to sourcing `chroma-control.js` and `matchoklch.v3.js`. Create the `INPUT_FILE_INVENTORY.md` document, clearly listing each file and its availability status. This inventory is a critical input for the next task.

* **Task 0.3: Create Comprehensive Refactoring Plan**
    * **Performer:** AI
    * **Description:** Based on the defined refactoring goals and the "Verified Input File Inventory" (including the status of any missing assets), develop this detailed, step-by-step refactoring plan document (i.e., Refactoring Plan v0.2).
    * **Inputs:**
        * User's initial request for refactoring.
        * Refactoring Goals Document (from Task 0.1).
        * Verified Input File Inventory (Document from Task 0.2).
        * The actual collection of verified original source code files (from Task 0.2, for AI analysis if needed).
    * **Outputs:**
        * **Refactoring Plan Document (v0.2 - This Document):** A comprehensive plan detailing all phases, tasks, performers, inputs, outputs, and instructions.
    * **Instruction for AI:** Review the goals and the verified list of available (and missing) source files. Synthesize a structured plan (this document) to refactor the codebase. Ensure each task logically follows from previous ones, with clear dependencies. If critical files like `matchoklch.v3.js` are reported missing, the plan must include strategies for affected modules (e.g., reimplementation tasks, placeholder tasks, or noting feature limitations).

---

**Phase 1: Project Setup & Architectural Blueprint**

This phase establishes the project environment and defines the core architectural principles and coding standards that will guide the refactoring.

* **Task 1.1: Set up Project Workspace**
    * **Performer:** Person
    * **Description:** Create the base directory structure for the refactored project.
    * **Inputs:**
        * Refactoring Plan Document (v0.2 - this document, specifically for project structure guidelines).
    * **Outputs:**
        * Project Root Directory (e.g., `color-utils/`)
        * Source Directory (e.g., `color-utils/src/`)
        * Documentation Directory (e.g., `color-utils/docs/`)
        * Test Directory (e.g., `color-utils/tests/`)
    * **Instruction for Person:** Based on standard project conventions and the scope outlined in the Refactoring Plan, create the main project folder and subfolders for source code, documentation, and tests.

* **Task 1.2: Define and Document Coding Conventions & Architecture**
    * **Performer:** Person
    * **Description:** Decide on the project's coding standards (e.g., naming conventions, JSDoc style, ES6 module usage, error handling), define the structure for color objects (e.g., `{r, g, b}` for sRGB, `{L, a, b}` for Lab), specify units/ranges for color values, and outline the overall modular architecture. Document these decisions.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Verified Input File Inventory (from Task 0.2 - for context on existing patterns).
        * Refactoring Goals Document (from Task 0.1).
        * Project Root Directory (from Task 1.1 - as location for the output document).
    * **Outputs:**
        * **Architecture Document (`color-utils/ARCHITECTURE.md`):** A Markdown file detailing:
            * Chosen coding conventions (variable naming, function naming, JSDoc style, etc.).
            * Standardized color object structures for each color space.
            * Expected units and numerical ranges for all color parameters.
            * Module breakdown (e.g., `srgb.js`, `cielab.js`, `oklab.js`, `utils.js`).
            * Approach to ES6 module exports/imports.
            * Error handling strategy.
    * **Instruction for Person:** Review the original code files (from the verified inventory) to understand existing patterns. Consult the Refactoring Plan and Goals. Make explicit decisions on all conventions and the target architecture. Create the `ARCHITECTURE.md` file in the project root and thoroughly document these decisions. This document will be the blueprint for all subsequent code generation and modification tasks.

---

**Phase 2: Core Utilities Module Development**

This phase focuses on identifying, consolidating, and implementing common utility functions that will be used across multiple color modules.

* **Task 2.1: Identify Common Utility Functions**
    * **Performer:** AI
    * **Description:** Analyze the verified original source files to identify helper functions that are duplicated or could be centralized (e.g., sRGB-linear conversions, angle conversions, matrix multiplications, number clamping, hex parsing).
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Architecture Document (`ARCHITECTURE.md` - for conventions on how utilities should be structured).
        * Verified Original Source Code Files (from Task 0.2).
    * **Outputs:**
        * **List of Candidate Utility Functions (Document/Text):** A list specifying functions deemed suitable for inclusion in a core `utils.js` module, along with their original locations.
    * **Instruction for AI:** Scan all verified original JavaScript files. Identify functions that perform generic tasks (e.g., `sRGBToLinear`, `linearTosRGB`, `degreesToRadians`, `radiansToDegrees`, `multiplyMatrixVector`, `signPreservingPow`, hex color parsing/formatting) that are used in multiple places or are fundamental building blocks. List these functions and their sources.

* **Task 2.2: Generate Core Utilities Code Content**
    * **Performer:** AI
    * **Description:** Generate the JavaScript code content (as a string) for the core utility functions module (`utils.js`), adhering to the defined conventions in `ARCHITECTURE.md`.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Architecture Document (`ARCHITECTURE.md`).
        * List of Candidate Utility Functions (from Task 2.1).
        * Relevant Verified Original Source Code Files (containing the implementations of utility functions).
    * **Outputs:**
        * **Core Utilities Code Content (String):** A string containing the complete JavaScript code for `utils.js`, including JSDoc comments.
    * **Instruction for AI:** Using the list from Task 2.1 and the conventions from `ARCHITECTURE.md`, consolidate the identified utility functions into a single code string. Ensure functions are consistently named, documented with JSDoc (following specified style), and use ES6 module export syntax.

* **Task 2.3: Create Core Utilities File (`utils.js`)**
    * **Performer:** Person
    * **Description:** Create the `utils.js` file in the source directory and populate it with the AI-generated code content.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Core Utilities Code Content (String from Task 2.2).
        * Source Directory (`color-utils/src/` from Task 1.1).
    * **Outputs:**
        * Core Utilities File (`color-utils/src/utils.js`).
    * **Instruction for Person:** In the `src` directory, create a new file named `utils.js`. Paste the code content provided by the AI from Task 2.2 into this file. Review for basic correctness and save.

---

**Phase 3: Color Space Conversion Modules Development**

This phase involves creating individual modules for each color space conversion, leveraging the core utilities where appropriate. Each sub-phase (3.1, 3.2, etc.) will follow a similar pattern of AI generating code content and Person creating the file.

* **Task 3.1: sRGB Module (`srgb.js`)**
    * **Task 3.1.1: Generate sRGB Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for sRGB <-> Linear sRGB and Linear sRGB <-> XYZ conversions.
        * **Inputs:** Refactoring Plan (v0.2), `ARCHITECTURE.md`, `utils.js` (for sRGB-linear if not inlined), Original Files (`cielab.v3.js`, `cat16.js`, `checkWCAGContrast.v4.js` for sRGB-linear and sRGB-XYZ matrices).
        * **Outputs:** `sRGB Module Code Content (String)`.
        * **Instruction for AI:** Extract and consolidate sRGB-linear and linear sRGB-XYZ conversion logic. Adhere to `ARCHITECTURE.md` for function signatures, color object structures, and JSDoc. Use `utils.js` for sRGB-linear conversions if they are centralized there.
    * **Task 3.1.2: Create sRGB Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/srgb.js`.
        * **Inputs:** Refactoring Plan (v0.2), `sRGB Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/srgb.js`.
        * **Instruction for Person:** Create `srgb.js` in the `src` directory. Paste the AI-generated code. Review and save.

* **Task 3.2: CIELAB Module (`cielab.js`)**
    * **Task 3.2.1: Generate CIELAB Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for XYZ <-> CIELAB (L\*, a\*, b\*) conversions.
        * **Inputs:** Refactoring Plan (v0.2), `ARCHITECTURE.md`, `utils.js`, Original File (`cielab.v3.js`).
        * **Outputs:** `CIELAB Module Code Content (String)`.
        * **Instruction for AI:** Extract XYZ <-> CIELAB logic from `cielab.v3.js`. Ensure D65 reference white is handled as per `ARCHITECTURE.md`. Adhere to conventions.
    * **Task 3.2.2: Create CIELAB Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/cielab.js`.
        * **Inputs:** Refactoring Plan (v0.2), `CIELAB Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/cielab.js`.
        * **Instruction for Person:** Create `cielab.js` in `src`. Paste AI-generated code. Review and save.

* **Task 3.3: CIELCh Module (`cielch.js`)**
    * **Task 3.3.1: Generate CIELCh Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for CIELAB <-> CIELCh (L\*, C\*, h) conversions.
        * **Inputs:** Refactoring Plan (v0.2), `ARCHITECTURE.md`, `utils.js` (for angle conversions like `degreesToRadians`, `radiansToDegrees`), `cielab.js` (as a dependency for Lab structure).
        * **Outputs:** `CIELCh Module Code Content (String)`.
        * **Instruction for AI:** Implement CIELAB <-> CIELCh formulas. Use `utils.js` for any necessary trigonometric or angle helper functions. Adhere to `ARCHITECTURE.md`.
    * **Task 3.3.2: Create CIELCh Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/cielch.js`.
        * **Inputs:** Refactoring Plan (v0.2), `CIELCh Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/cielch.js`.
        * **Instruction for Person:** Create `cielch.js` in `src`. Paste AI-generated code. Review and save.

* **Task 3.4: Oklab (Simple) Module (`oklab.js`)**
    * **Task 3.4.1: Generate Oklab Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for Linear sRGB <-> standard Oklab conversions.
        * **Inputs:** Refactoring Plan (v0.2), `ARCHITECTURE.md`, `utils.js` (for sRGB-linear if used), `srgb.js` (if direct sRGB input is supported, for sRGB-linear step), Original File (`oklab-simple.v3.js`).
        * **Outputs:** `Oklab Module Code Content (String)`.
        * **Instruction for AI:** Extract Oklab conversion logic and matrices from `oklab-simple.v3.js`. If module handles sRGB non-linear input, it must use sRGB-linear conversion from `utils.js` or `srgb.js`. Adhere to conventions.
    * **Task 3.4.2: Create Oklab Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/oklab.js`.
        * **Inputs:** Refactoring Plan (v0.2), `Oklab Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/oklab.js`.
        * **Instruction for Person:** Create `oklab.js` in `src`. Paste AI-generated code. Review and save.

* **Task 3.5: OkLCh Module (`oklch.js`)**
    * **Task 3.5.1: Generate OkLCh Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for Oklab <-> OkLCh conversions.
        * **Inputs:** Refactoring Plan (v0.2), `ARCHITECTURE.md`, `utils.js` (for angle conversions), `oklab.js` (for Oklab structure).
        * **Outputs:** `OkLCh Module Code Content (String)`.
        * **Instruction for AI:** Implement Oklab <-> OkLCh formulas. Use `utils.js` for angle helpers. Adhere to conventions.
    * **Task 3.5.2: Create OkLCh Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/oklch.js`.
        * **Inputs:** Refactoring Plan (v0.2), `OkLCh Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/oklch.js`.
        * **Instruction for Person:** Create `oklch.js` in `src`. Paste AI-generated code. Review and save.

* **Task 3.6: Adaptive Oklab Module (`aoklab.js`)**
    * **Task 3.6.1: Generate Adaptive Oklab Module Code Content**
        * **Performer:** AI
        * **Description:** Consolidate logic from `adaptive-oklab.js`, `aoklab-dark.js`, `aoklab-gray.js`, `aoklab-white.js` into a single configurable module.
        * **Inputs:** Refactoring Plan (v0.2), `ARCHITECTURE.md`, `utils.js`, `srgb.js` (for sRGB->XYZ if needed), Original Files (`adaptive-oklab.js`, `aoklab-dark.js`, `aoklab-gray.js`, `aoklab-white.js`).
        * **Outputs:** `Adaptive Oklab Module Code Content (String)`.
        * **Instruction for AI:** Analyze the four adaptive/aoklab files. Design a unified `AdaptiveOklab` class or set of functions that can handle different surround conditions ("white", "gray", "dark") and target lightness, potentially by passing parameters or using different instantiation options. Consolidate matrices and logic. Adhere to conventions.
    * **Task 3.6.2: Create Adaptive Oklab Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/aoklab.js`.
        * **Inputs:** Refactoring Plan (v0.2), `Adaptive Oklab Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/aoklab.js`.
        * **Instruction for Person:** Create `aoklab.js` in `src`. Paste AI-generated code. Review and save.

* **Task 3.7: CIECAM16 Module (`ciecam16.js`)**
    * **Task 3.7.1: Generate CIECAM16 Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for CIECAM16 appearance model calculations.
        * **Inputs:** Refactoring Plan (v0.2), `ARCHITECTURE.md`, `utils.js`, `srgb.js` (for sRGB->XYZ), Original File (`cat16.js`).
        * **Outputs:** `CIECAM16 Module Code Content (String)`.
        * **Instruction for AI:** Extract CIECAM16 logic from `cat16.js`. Ensure viewing conditions are clearly parameterizable. Adhere to conventions.
    * **Task 3.7.2: Create CIECAM16 Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/ciecam16.js`.
        * **Inputs:** Refactoring Plan (v0.2), `CIECAM16 Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/ciecam16.js`.
        * **Instruction for Person:** Create `ciecam16.js` in `src`. Paste AI-generated code. Review and save.

---

**Phase 4: Color Metrics & Advanced Control Modules Development**

This phase develops modules for calculating color differences, contrast, and implementing advanced chroma control functionalities.

* **Task 4.1: Color Metrics Module (`color-metrics.js`)**
    * **Task 4.1.1: Generate Color Metrics Module Code Content**
        * **Performer:** AI
        * **Description:** Consolidate WCAG contrast, CIEDE2000, and other color difference metrics.
        * **Inputs:** Refactoring Plan (v0.2), `ARCHITECTURE.md`, `utils.js` (for sRGB-linear if needed), `srgb.js` (for hex to linear RGB, if not in utils), `cielab.js` (for CIEDE2000 input), `oklch.js` (for OKLCh difference input), Original Files (`color-metrics.js`, `checkWCAGContrast.v4.js`).
        * **Outputs:** `Color Metrics Module Code Content (String)`.
        * **Instruction for AI:** Combine functionalities from `color-metrics.js` and `checkWCAGContrast.v4.js`. Ensure WCAG contrast can handle hex strings (using `srgb.js` or `utils.js` for parsing and sRGB-linear conversion). CIEDE2000 should accept Lab objects as defined in `ARCHITECTURE.md`. Optimized OKLCh difference should accept OkLCh objects. Maintain or improve caching for hexToRelativeLuminance.
    * **Task 4.1.2: Create Color Metrics Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/color-metrics.js`.
        * **Inputs:** Refactoring Plan (v0.2), `Color Metrics Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/color-metrics.js`.
        * **Instruction for Person:** Create `color-metrics.js` in `src`. Paste AI-generated code. Review and save.

* **Task 4.2: Chroma Control Module (`chroma-control.js`)**
    * **Task 4.2.1: Analyze and Plan `chroma-control.js` Refactoring**
        * **Performer:** AI
        * **Description:** Analyze the original `chroma-control.js` (if found in Task 0.2) and its dependency on `matchoklch.v3.js` (if found). Propose a refactoring strategy, including how to handle the `matchoklch.v3.js` functionality (reimplement using existing modules, or define a clear interface if its code is to be integrated).
        * **Inputs:**
            * Refactoring Plan Document (v0.2).
            * Architecture Document (`ARCHITECTURE.md`).
            * Verified Input File Inventory (from Task 0.2, specifically status of `chroma-control.js` and `matchoklch.v3.js`).
            * `chroma-control.js` (original, if available).
            * `matchoklch.v3.js` (original, if available).
            * Refactored modules: `oklch.js`, `cielab.js`, `srgb.js`, `utils.js`.
        * **Outputs:**
            * **Chroma Control Refactoring Strategy (Document/Text):** A detailed plan outlining:
                * Key functionalities of `chroma-control.js`.
                * How `matchoklch.v3.js` functionality will be achieved (e.g., "reimplement feature X using `oklch.js` and `color-metrics.js`", or "integrate provided `matchoklch.v3.js` code after namespacing/refactoring its core logic").
                * Stub interfaces or function signatures for the new `chroma-control.js` module.
                * Identification of any parts that cannot be refactored if `matchoklch.v3.js` is unavailable and its functionality is too complex to reimplement within scope.
        * **Instruction for AI:** Based on the availability and content of `chroma-control.js` and `matchoklch.v3.js` (from inventory), and the capabilities of already refactored modules, devise a clear strategy. If `matchoklch.v3.js` is missing, propose how its core purpose (likely finding colors that match a target OkLCh value under constraints) can be replicated or substituted.

    * **Task 4.2.2: Implement/Refactor Chroma Control Module**
        * **Performer:** Person (primary, with AI assistance for boilerplate or specific algorithms if defined in strategy)
        * **Description:** Implement or refactor the `chroma-control.js` module according to the strategy defined in Task 4.2.1.
        * **Inputs:**
            * Refactoring Plan Document (v0.2).
            * Architecture Document (`ARCHITECTURE.md`).
            * Chroma Control Refactoring Strategy (from Task 4.2.1).
            * All relevant refactored source modules (`oklch.js`, `cielab.js`, `srgb.js`, `utils.js`, `color-metrics.js`).
            * `chroma-control.js` (original, if available and part of strategy).
            * `matchoklch.v3.js` (original, if available and part of strategy).
            * Source Directory (`color-utils/src/`).
        * **Outputs:**
            * Chroma Control Module File (`color-utils/src/chroma-control.js` - finalized).
        * **Instruction for Person:** Follow the Chroma Control Refactoring Strategy. Implement the necessary logic, integrating with other refactored modules. If `matchoklch.v3.js` code is being integrated, ensure it conforms to project conventions. If its functionality is being reimplemented, develop the algorithms. AI can assist in translating parts of the strategy into code if well-defined. Thoroughly test interactions.

---

**Phase 5: Project Finalization & Packaging**

This phase focuses on creating project metadata, a main entry point for the library, and type definitions.

* **Task 5.1: Create Package File (`package.json`)**
    * **Performer:** Person
    * **Description:** Create the `package.json` file for the project, defining metadata and entry points.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Architecture Document (`ARCHITECTURE.md`).
        * Project Root Directory (`color-utils/`).
    * **Outputs:**
        * Package File (`color-utils/package.json`).
    * **Instruction for Person:** In the project root directory, create `package.json`. Fill in standard details (name, version, description, license). Set `main` to `src/index.js` and `type` to `module` (assuming ES6 modules). Add any linter/formatter dependencies if desired.

* **Task 5.2: Generate Main Entry Point (`index.js`) Code Content**
    * **Performer:** AI
    * **Description:** Generate code content for the main library entry point (`index.js`), which exports selected functions/classes from the individual modules.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Architecture Document (`ARCHITECTURE.md` - for guidance on what to export).
        * All created source files in `color-utils/src/` (e.g., `utils.js`, `srgb.js`, `cielab.js`, etc.).
    * **Outputs:**
        * **Main Entry Point Code Content (String):** JavaScript code for `index.js`.
    * **Instruction for AI:** Review all modules in the `src/` directory and the `ARCHITECTURE.md`. Select the primary public-facing functions and classes from each module that should be part of the library's public API. Generate the `index.js` content to import these from their respective modules and re-export them. Include a brief JSDoc module overview.

* **Task 5.3: Create Main Entry Point File (`index.js`)**
    * **Performer:** Person
    * **Description:** Create `index.js` in the source directory and populate it.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Main Entry Point Code Content (String from Task 5.2).
        * Source Directory (`color-utils/src/`).
    * **Outputs:**
        * Main Entry Point File (`color-utils/src/index.js`).
    * **Instruction for Person:** In `src/`, create `index.js`. Paste the AI-generated code. Review exports and save.

* **Task 5.4: Generate JSDoc Type Definitions (`types.js`) Code Content**
    * **Performer:** AI
    * **Description:** Generate JSDoc `@typedef` definitions for all standardized color object structures and other common types.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Architecture Document (`ARCHITECTURE.md` - which defines these structures).
    * **Outputs:**
        * **Type Definitions Code Content (String):** JavaScript code for `types.js` containing only JSDoc typedefs.
    * **Instruction for AI:** Based on the color object structures (e.g., `RgbColor`, `XyzColor`, `LabColor`, `OklchColor`) and any other custom types defined in `ARCHITECTURE.md`, generate a series of JSDoc `@typedef` comments. The file should not contain executable code, only comments.

* **Task 5.5: Create Type Definitions File and Update JSDoc in Modules**
    * **Performer:** Person
    * **Description:** Create `types.js`, populate it, and then update JSDoc comments in all other source modules to reference these central typedefs.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Type Definitions Code Content (String from Task 5.4).
        * Source Directory (`color-utils/src/`).
        * All other source files in `color-utils/src/`.
    * **Outputs:**
        * Type Definitions File (`color-utils/src/types.js`).
        * Modified Source Files (`color-utils/src/*.js`) with updated JSDoc using `@link` or `import('../types.js').TypeName`.
    * **Instruction for Person:** In `src/`, create `types.js`. Paste the AI-generated JSDoc typedefs. Then, go through each `.js` file in `src/` and update `@param` and `@returns` types in JSDoc comments to use the newly defined typedefs (e.g., change `@param {{r: number, g: number, b: number}} color` to `@param {RgbColor} color`). Ensure JSDoc tools can resolve these types.

---

**Phase 6: Documentation & Quality Assurance**

This final phase focuses on comprehensive project documentation, testing, and final reviews.

* **Task 6.1: Write Comprehensive README.md**
    * **Performer:** Person
    * **Description:** Write the main documentation file for the project, including an overview, installation instructions, usage examples for key features, and API highlights.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Architecture Document (`ARCHITECTURE.md`).
        * Package File (`color-utils/package.json`).
        * Main Entry Point File (`color-utils/src/index.js` - for public API).
        * All other source files (for context on features).
        * Project Root Directory (`color-utils/`).
    * **Outputs:**
        * README File (`color-utils/README.md`).
    * **Instruction for Person:** Create or update `README.md` in the project root. Include:
            * Project title and brief description.
            * Installation instructions (e.g., `npm install`).
            * Basic usage examples for the most common functions/conversions.
            * A brief overview of the library's modules and capabilities.
            * Link to the full API documentation (to be generated in Task 6.2).

* **Task 6.2: Generate API Reference Manual**
    * **Performer:** Person
    * **Description:** Set up and run a documentation generation tool (e.g., JSDoc, Documentation.js) to create an API reference manual from JSDoc comments in the source code.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * All source files in `color-utils/src/` (containing JSDoc comments and typedefs).
        * Documentation Directory (`color-utils/docs/`).
    * **Outputs:**
        * API Reference Manual (HTML/Markdown files within `color-utils/docs/`).
    * **Instruction for Person:** Choose a JSDoc-compatible documentation generator. Configure it to process all files in `src/`, including `types.js`. Run the tool to generate the API documentation into the `docs/` folder.

* **Task 6.3: Implement Unit Tests**
    * **Performer:** Person
    * **Description:** Write and run unit tests to verify the correctness of all refactored modules and functions, focusing on core logic and edge cases.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Architecture Document (`ARCHITECTURE.md` - for expected behavior and data structures).
        * All source files in `color-utils/src/`.
        * Package File (`color-utils/package.json` - to add testing framework like Jest/Mocha and test scripts).
        * Test Directory (`color-utils/tests/`).
    * **Outputs:**
        * Test files within `color-utils/tests/`.
        * (Implicit) Debugged and validated source files in `color-utils/src/`.
        * Test execution reports.
    * **Instruction for Person:** Set up a testing framework (e.g., Jest). For each module in `src/`, create corresponding test files in `tests/`. Write unit tests covering:
            * Known input/output pairs for conversions.
            * Handling of out-of-gamut or invalid inputs (as per error strategy).
            * Correctness of calculations in metrics.
            * Edge cases.
        Run tests frequently (`npm test`). Debug and fix code in `src/` until all tests pass. Aim for good test coverage.

* **Task 6.4: Final Code Consistency and Style Review**
    * **Performer:** AI
    * **Description:** Perform a final automated review of the entire refactored codebase for consistency in naming, JSDoc usage, adherence to architectural patterns, and overall style defined in `ARCHITECTURE.md`.
    * **Inputs:**
        * Refactoring Plan Document (v0.2).
        * Architecture Document (`ARCHITECTURE.md`).
        * All finalized source files in `color-utils/src/`.
        * Type Definitions File (`color-utils/src/types.js`).
    * **Outputs:**
        * **Consistency Review Feedback (Text):** A report highlighting any identified inconsistencies or deviations from the established conventions, with suggestions for minor refinements.
    * **Instruction for AI:** Analyze the complete `src/` directory. Verify:
            * Adherence to naming conventions for functions, variables, classes.
            * Correct and consistent use of JSDoc typedefs from `types.js`.
            * Uniformity in module structure and export patterns.
            * Consistency in error handling.
            Provide feedback on any areas needing minor touch-ups to achieve perfect consistency.

* **Task 6.5: User Acceptance Testing (UAT) & Final Adjustments**
    * **Performer:** Person
    * **Description:** Perform UAT by integrating the library into a sample application or by manually testing its public API according to the documentation to ensure it meets the original refactoring goals. Make final adjustments based on UAT and AI review feedback.
    * **Inputs:**
        * All refactored code and `package.json`.
        * `README.md` and API Reference Manual (from Tasks 6.1, 6.2).
        * Refactoring Goals Document (from Task 0.1).
        * Consistency Review Feedback (from Task 6.4).
    * **Outputs:**
        * **UAT Report / Sign-off Document.**
        * Final, polished version of the `color-utils` library.
    * **Instruction for Person:** Review the refactoring goals. Use the `README.md` and API documentation to test the library's functionalities as an end-user would. Address any issues found during UAT. Incorporate minor refinements suggested by the AI's consistency review (Task 6.4). Once satisfied, consider the refactoring complete for this version.

---
This revised plan should provide a clear, sequential, and dependency-aware roadmap for your refactoring project.