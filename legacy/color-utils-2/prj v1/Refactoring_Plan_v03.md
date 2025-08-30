# Refactoring Plan v0.3

**Document Version:** 0.3
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
    * **Description:** Based on the defined refactoring goals and the "Verified Input File Inventory" (including the status of any missing assets), develop this detailed, step-by-step refactoring plan document.
    * **Inputs:**
        * User's initial request for refactoring.
        * Refactoring Goals Document (from Task 0.1).
        * Verified Input File Inventory (Document from Task 0.2).
        * The actual collection of verified original source code files (from Task 0.2, for AI analysis if needed).
    * **Outputs:**
        * **Refactoring Plan Document (v0.3 - This Document):** A comprehensive plan detailing all phases, tasks, performers, inputs, outputs, and instructions.
    * **Instruction for AI:** Review the goals and the verified list of available (and missing) source files. Synthesize a structured plan (this document) to refactor the codebase. Ensure each task logically follows from previous ones, with clear dependencies. If critical files like `matchoklch.v3.js` are reported missing, the plan must include strategies for affected modules (e.g., reimplementation tasks, placeholder tasks, or noting feature limitations).

---

**Phase 1: Project Setup & Architectural Blueprint**

This phase establishes the project environment and defines the core architectural principles and coding standards that will guide the refactoring.

* **Task 1.1: Set up Project Workspace**
    * **Performer:** Person
    * **Description:** Create the base directory structure for the refactored project.
    * **Inputs:**
        * Refactoring Plan Document (v0.3 - this document, specifically for project structure guidelines).
    * **Outputs:**
        * Project Root Directory (e.g., `color-utils/`)
        * Source Directory (e.g., `color-utils/src/`)
        * Documentation Directory (e.g., `color-utils/docs/`)
        * Test Directory (e.g., `color-utils/tests/`)
    * **Instruction for Person:** Based on standard project conventions and the scope outlined in the Refactoring Plan, create the main project folder and subfolders for source code, documentation, and tests.

* **Task 1.2: Define and Document Coding Conventions & Architecture**
    * **Performer:** Person
    * **Description:** Decide on the project's coding standards (e.g., naming conventions, JSDoc style, ES6 module usage, error handling), define the structure for color objects (e.g., `{r, g, b}` for sRGB, `{L, a, b}` for Lab), specify units/ranges for color values, and outline the overall modular architecture. Document these decisions in `ARCHITECTURE.md`.
    * **Inputs:**
        * Refactoring Plan Document (v0.3).
        * Verified Input File Inventory (from Task 0.2 - for context on existing patterns).
        * Refactoring Goals Document (from Task 0.1).
        * Project Root Directory (from Task 1.1 - as location for the output document).
    * **Outputs:**
        * **Architecture Document (`color-utils/ARCHITECTURE.md`):** A Markdown file detailing the items described.
    * **Instruction for Person:** Review the original code files (from the verified inventory) to understand existing patterns. Consult the Refactoring Plan and Goals. Make explicit decisions on all conventions and the target architecture. Create/Update the `ARCHITECTURE.md` file in the project root and thoroughly document these decisions. This document will be the blueprint for all subsequent code generation and modification tasks.

---

**Phase 2: Core Utilities Module Development**

This phase focuses on identifying, consolidating, and implementing common utility functions that will be used across multiple color modules.

* **Task 2.1: Identify Common Utility Functions**
    * **Performer:** AI
    * **Description:** Analyze the verified original source files to identify helper functions that are duplicated or could be centralized (e.g., sRGB-linear conversions, angle conversions, matrix multiplications, number clamping, hex parsing).
    * **Inputs:**
        * Refactoring Plan Document (v0.3).
        * Architecture Document (`ARCHITECTURE.md` - for conventions on how utilities should be structured).
        * Verified Original Source Code Files (from Task 0.2).
    * **Outputs:**
        * **List of Candidate Utility Functions (Document/Text):** A list specifying functions deemed suitable for inclusion in a core `utils.js` module, along with their original locations.
    * **Instruction for AI:** Scan all verified original JavaScript files. Identify functions that perform generic tasks (e.g., `sRGBToLinear`, `linearTosRGB`, `degreesToRadians`, `radiansToDegrees`, `multiplyMatrixVector`, `signPreservingPow`, hex color parsing/formatting) that are used in multiple places or are fundamental building blocks. List these functions and their sources.

* **Task 2.2: Generate Core Utilities Code Content**
    * **Performer:** AI
    * **Description:** Generate the JavaScript code content (as a string) for the core utility functions module (`utils.js`), adhering to the defined conventions in `ARCHITECTURE.md`.
    * **Inputs:**
        * Refactoring Plan Document (v0.3).
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
        * Refactoring Plan Document (v0.3).
        * Core Utilities Code Content (String from Task 2.2).
        * Source Directory (`color-utils/src/` from Task 1.1).
    * **Outputs:**
        * Core Utilities File (`color-utils/src/utils.js`).
    * **Instruction for Person:** In the `src` directory, create a new file named `utils.js`. Paste the code content provided by the AI from Task 2.2 into this file. Review for basic correctness and save.

---

**Phase 3: Color Space Conversion Modules Development**

This phase involves creating individual modules for each color space conversion, leveraging the core utilities where appropriate.

* **Task 3.1: sRGB Module (`srgb.js`)**
    * **Task 3.1.1: Generate sRGB Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for sRGB <-> Linear sRGB and Linear sRGB <-> XYZ conversions.
        * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, `utils.js`, Original Files (`cielab.v3.js`, `cat16.js`, `checkWCAGContrast.v4.js` for sRGB-linear and sRGB-XYZ matrices).
        * **Outputs:** `sRGB Module Code Content (String)`.
        * **Instruction for AI:** Extract and consolidate sRGB-linear and linear sRGB-XYZ conversion logic. Adhere to `ARCHITECTURE.md` for function signatures, color object structures, and JSDoc. Use `utils.js` for sRGB-linear conversions.
    * **Task 3.1.2: Create sRGB Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/srgb.js`.
        * **Inputs:** Refactoring Plan (v0.3), `sRGB Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/srgb.js`.
        * **Instruction for Person:** Create `srgb.js` in `src`. Paste AI-generated code. Review and save.

* **Task 3.2: CIELAB & CIELCh Module (`cielab.js`)** (Modified Task)
    * **Task 3.2.1: Generate CIELAB & CIELCh Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for XYZ <-> CIELAB (L\*, a\*, b\*) conversions and CIELAB <-> CIELCh (L\*, C\*, h) conversions.
        * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, `utils.js` (for angle conversions like `degreesToRadians`, `radiansToDegrees`), `srgb.js` (for XYZ derivation if needed), Original File (`cielab.v3.js`).
        * **Outputs:** `CIELAB_CIELCh Module Code Content (String)`.
        * **Instruction for AI:** Extract XYZ <-> CIELAB logic from `cielab.v3.js`. Implement CIELAB <-> CIELCh formulas. Ensure D65 reference white is handled as per `ARCHITECTURE.md`. Use `utils.js` for any necessary trigonometric or angle helper functions. Adhere to conventions for function signatures, color object structures (`LabColor`, `LchColor`), and JSDoc. All functions should be co-located in the `cielab.js` module string.
    * **Task 3.2.2: Create CIELAB & CIELCh Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/cielab.js`.
        * **Inputs:** Refactoring Plan (v0.3), `CIELAB_CIELCh Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/cielab.js`.
        * **Instruction for Person:** Create `cielab.js` in the `src` directory. Paste the AI-generated code. Review and save.

* **Task 3.3: Oklab & OkLCh Module (`oklab.js`)** (Modified Task)
    * **Task 3.3.1: Generate Oklab & OkLCh Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for Linear sRGB <-> standard Oklab conversions and Oklab <-> OkLCh conversions.
        * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, `utils.js` (for angle conversions), `srgb.js` (for sRGB-linear step), Original File (`oklab-simple.v3.js`).
        * **Outputs:** `Oklab_OkLCh Module Code Content (String)`.
        * **Instruction for AI:** Extract Oklab conversion logic and matrices from `oklab-simple.v3.js`. Implement Oklab <-> OkLCh formulas. If module handles sRGB non-linear input, it must use sRGB-linear conversion from `srgb.js` or `utils.js`. Use `utils.js` for angle helpers. Adhere to conventions for function signatures, color object structures (`OklabColor`, `OklchColor`), and JSDoc. All functions should be co-located in the `oklab.js` module string.
    * **Task 3.3.2: Create Oklab & OkLCh Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/oklab.js`.
        * **Inputs:** Refactoring Plan (v0.3), `Oklab_OkLCh Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/oklab.js`.
        * **Instruction for Person:** Create `oklab.js` in `src`. Paste AI-generated code. Review and save.

* **Task 3.4: Adaptive Oklab Module (`aoklab.js`)** (Renumbered from original Task 3.6)
    * **Task 3.4.1: Generate Adaptive Oklab Module Code Content**
        * **Performer:** AI
        * **Description:** Consolidate logic from `adaptive-oklab.js`, `aoklab-dark.js`, `aoklab-gray.js`, `aoklab-white.js` into a single configurable module.
        * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, `utils.js`, `srgb.js` (for sRGB->XYZ if needed), Original Files (`adaptive-oklab.js`, `aoklab-dark.js`, `aoklab-gray.js`, `aoklab-white.js`).
        * **Outputs:** `Adaptive Oklab Module Code Content (String)`.
        * **Instruction for AI:** Analyze the four adaptive/aoklab files. Design a unified `AdaptiveOklab` class or set of functions that can handle different surround conditions ("white", "gray", "dark") and target lightness, potentially by passing parameters or using different instantiation options. Consolidate matrices and logic. Adhere to conventions.
    * **Task 3.4.2: Create Adaptive Oklab Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/aoklab.js`.
        * **Inputs:** Refactoring Plan (v0.3), `Adaptive Oklab Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/aoklab.js`.
        * **Instruction for Person:** Create `aoklab.js` in `src`. Paste AI-generated code. Review and save.

* **Task 3.5: CIECAM16 Module (`ciecam16.js`)** (Renumbered from original Task 3.7)
    * **Task 3.5.1: Generate CIECAM16 Module Code Content**
        * **Performer:** AI
        * **Description:** Generate code for CIECAM16 appearance model calculations.
        * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, `utils.js`, `srgb.js` (for sRGB->XYZ), Original File (`cat16.js`).
        * **Outputs:** `CIECAM16 Module Code Content (String)`.
        * **Instruction for AI:** Extract CIECAM16 logic from `cat16.js`. Ensure viewing conditions are clearly parameterizable. Adhere to conventions.
    * **Task 3.5.2: Create CIECAM16 Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/ciecam16.js`.
        * **Inputs:** Refactoring Plan (v0.3), `CIECAM16 Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/ciecam16.js`.
        * **Instruction for Person:** Create `ciecam16.js` in `src`. Paste AI-generated code. Review and save.

---

**Phase 4: Color Metrics & Advanced Control Modules Development**

This phase develops modules for calculating color differences, contrast, and implementing advanced chroma control functionalities.

* **Task 4.1: Color Metrics Module (`color-metrics.js`)**
    * **Task 4.1.1: Generate Color Metrics Module Code Content**
        * **Performer:** AI
        * **Description:** Consolidate WCAG contrast, CIEDE2000, and other color difference metrics.
        * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, `utils.js` (for sRGB-linear if needed), `srgb.js` (for hex to linear RGB, if not in utils), `cielab.js` (for CIEDE2000 input), `oklab.js` (for OKLCh difference input), Original Files (`color-metrics.js`, `checkWCAGContrast.v4.js`).
        * **Outputs:** `Color Metrics Module Code Content (String)`.
        * **Instruction for AI:** Combine functionalities from `color-metrics.js` and `checkWCAGContrast.v4.js`. Ensure WCAG contrast can handle hex strings (using `srgb.js` or `utils.js` for parsing and sRGB-linear conversion). CIEDE2000 should accept Lab objects as defined in `ARCHITECTURE.md`. Optimized OKLCh difference should accept OkLCh objects. Maintain or improve caching for hexToRelativeLuminance.
    * **Task 4.1.2: Create Color Metrics Module File**
        * **Performer:** Person
        * **Description:** Create and populate `color-utils/src/color-metrics.js`.
        * **Inputs:** Refactoring Plan (v0.3), `Color Metrics Module Code Content`, `src/` directory.
        * **Outputs:** `color-utils/src/color-metrics.js`.
        * **Instruction for Person:** Create `color-metrics.js` in `src`. Paste AI-generated code. Review and save.

* **Task 4.2: Chroma Control Module (`chroma-control.js`)**
    * **Task 4.2.1: Analyze and Plan `chroma-control.js` Refactoring**
        * **Performer:** AI
        * **Description:** Analyze the original `chroma-control.js` (if found in Task 0.2) and its dependency on `matchoklch.v3.js` (if found). Propose a refactoring strategy, including how to handle the `matchoklch.v3.js` functionality (reimplement using existing modules, or define a clear interface if its code is to be integrated).
        * **Inputs:**
            * Refactoring Plan Document (v0.3).
            * Architecture Document (`ARCHITECTURE.md`).
            * Verified Input File Inventory (from Task 0.2, specifically status of `chroma-control.js` and `matchoklch.v3.js`).
            * `chroma-control.js` (original, if available).
            * `matchoklch.v3.js` (original, if available).
            * Refactored modules: `oklab.js`, `cielab.js`, `srgb.js`, `utils.js`.
        * **Outputs:**
            * **Chroma Control Refactoring Strategy (Document/Text):** A detailed plan.
        * **Instruction for AI:** Based on the availability and content of `chroma-control.js` and `matchoklch.v3.js` (from inventory), and the capabilities of already refactored modules, devise a clear strategy. If `matchoklch.v3.js` is missing, propose how its core purpose can be replicated or substituted.

    * **Task 4.2.2: Implement/Refactor Chroma Control Module**
        * **Performer:** Person (primary, with AI assistance for boilerplate or specific algorithms if defined in strategy)
        * **Description:** Implement or refactor the `chroma-control.js` module according to the strategy defined in Task 4.2.1.
        * **Inputs:**
            * Refactoring Plan Document (v0.3).
            * Architecture Document (`ARCHITECTURE.md`).
            * Chroma Control Refactoring Strategy (from Task 4.2.1).
            * All relevant refactored source modules (`oklab.js`, `cielab.js`, `srgb.js`, `utils.js`, `color-metrics.js`).
            * `chroma-control.js` (original, if available and part of strategy).
            * `matchoklch.v3.js` (original, if available and part of strategy).
            * Source Directory (`color-utils/src/`).
        * **Outputs:**
            * Chroma Control Module File (`color-utils/src/chroma-control.js` - finalized).
        * **Instruction for Person:** Follow the Chroma Control Refactoring Strategy. Implement the necessary logic, integrating with other refactored modules.

---

**Phase 5: Project Finalization & Packaging**

This phase focuses on creating project metadata, a main entry point for the library, and type definitions.

* **Task 5.1: Create Package File (`package.json`)**
    * **Performer:** Person
    * **Description:** Create the `package.json` file for the project.
    * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, Project Root Directory.
    * **Outputs:** `color-utils/package.json`.
    * **Instruction for Person:** Create `package.json`. Fill in details. Set `main` to `src/index.js` and `type` to `module`.

* **Task 5.2: Generate Main Entry Point (`index.js`) Code Content**
    * **Performer:** AI
    * **Description:** Generate code content for `index.js`.
    * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, All created source files in `color-utils/src/`.
    * **Outputs:** `Main Entry Point Code Content (String)`.
    * **Instruction for AI:** Select public-facing functions/classes. Generate `index.js` to import and re-export them.

* **Task 5.3: Create Main Entry Point File (`index.js`)**
    * **Performer:** Person
    * **Description:** Create `index.js` in `src/` and populate it.
    * **Inputs:** Refactoring Plan (v0.3), Main Entry Point Code Content, `src/` directory.
    * **Outputs:** `color-utils/src/index.js`.
    * **Instruction for Person:** Create `index.js`. Paste code. Review and save.

* **Task 5.4: Generate JSDoc Type Definitions (`types.js`) Code Content**
    * **Performer:** AI
    * **Description:** Generate JSDoc `@typedef` definitions.
    * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`.
    * **Outputs:** `Type Definitions Code Content (String)`.
    * **Instruction for AI:** Based on `ARCHITECTURE.md`, generate JSDoc `@typedef` comments.

* **Task 5.5: Create Type Definitions File and Update JSDoc in Modules**
    * **Performer:** Person
    * **Description:** Create `types.js`, populate it, and update JSDoc in modules.
    * **Inputs:** Refactoring Plan (v0.3), Type Definitions Code Content, All source files in `color-utils/src/`.
    * **Outputs:** `color-utils/src/types.js`, Modified Source Files.
    * **Instruction for Person:** Create `types.js`. Paste typedefs. Update JSDoc in other modules to use these types.

---

**Phase 6: Documentation & Quality Assurance**

This final phase focuses on comprehensive project documentation, testing, and final reviews.

* **Task 6.1: Write Comprehensive README.md**
    * **Performer:** Person
    * **Description:** Write the main `README.md` file.
    * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, `package.json`, `src/index.js`, All source files.
    * **Outputs:** `color-utils/README.md`.
    * **Instruction for Person:** Create/Update `README.md` with project overview, installation, usage examples, API highlights.

* **Task 6.2: Generate API Reference Manual**
    * **Performer:** Person
    * **Description:** Use a documentation tool (e.g., JSDoc) to create an API reference.
    * **Inputs:** Refactoring Plan (v0.3), All source files in `color-utils/src/`, `docs/` directory.
    * **Outputs:** API Reference Manual in `color-utils/docs/`.
    * **Instruction for Person:** Configure and run a documentation generator.

* **Task 6.3: Implement Unit Tests**
    * **Performer:** Person
    * **Description:** Write and run unit tests.
    * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, All source files, `package.json`, `tests/` directory.
    * **Outputs:** Test files, Debugged source files, Test reports.
    * **Instruction for Person:** Set up a testing framework. Write tests for all modules covering conversions, metrics, edge cases.

* **Task 6.4: Final Code Consistency and Style Review**
    * **Performer:** AI
    * **Description:** Automated review for consistency and style.
    * **Inputs:** Refactoring Plan (v0.3), `ARCHITECTURE.md`, All finalized source files, `types.js`.
    * **Outputs:** `Consistency Review Feedback (Text)`.
    * **Instruction for AI:** Analyze code for adherence to naming conventions, JSDoc usage, architectural patterns, error handling.

* **Task 6.5: User Acceptance Testing (UAT) & Final Adjustments**
    * **Performer:** Person
    * **Description:** Perform UAT and make final adjustments.
    * **Inputs:** All refactored code, `package.json`, `README.md`, API Reference Manual, Refactoring Goals Document, Consistency Review Feedback.
    * **Outputs:** `UAT Report / Sign-off Document`, Final library version.
    * **Instruction for Person:** Test library against goals. Address UAT issues and AI feedback.

