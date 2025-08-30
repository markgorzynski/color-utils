# Color Utils Library

A comprehensive JavaScript library for color space conversions, appearance modeling, and color metrics.

## Current Project State

This repository contains multiple versions of the color utilities library that are being consolidated and refactored:

### Directory Structure

- **`color-utils 1/`** - First version of the modular implementation
- **`color-utils 2/`** - Second version with enhanced features (primary source)
- **`color_utils_abridged_v21/`** - Consolidated single-file implementation v21
- **`color_utils_abridged_v22/`** - Latest consolidated single-file implementation (identical to v21)

### Key Features

#### Core Color Space Conversions
- **sRGB** - Standard RGB color space with gamma correction
- **CIELAB/LCH** - Perceptually uniform color spaces
- **Oklab/OkLCh** - Modern perceptually uniform color spaces with better hue uniformity
- **XYZ** - CIE 1931 color space (D65 illuminant)

#### Advanced Color Models
- **Adaptive Oklab (AOkLab)** - Novel surround-adapted Oklab implementation
  - Adjusts for white, gray, and dark viewing conditions
  - Maintains hue uniformity while adapting lightness and chroma
  - Sophisticated mathematical model with custom exponents
- **CIECAM16** - Complete color appearance model implementation
  - Accounts for chromatic adaptation and viewing conditions
  - Predicts appearance correlates (Lightness J, Chroma C, Hue h)

#### Color Metrics & Analysis
- **WCAG Contrast** - Web Content Accessibility Guidelines contrast ratios
- **CIEDE2000** - Advanced perceptual color difference formula
- **Relative Luminance** - CIE relative luminance calculations

#### Advanced Features
- **Chroma Control** - Sophisticated chroma adjustment with WCAG contrast targeting
  - Find maximum chroma for target luminance
  - Adjust colors to meet specific contrast requirements
  - Integration with Adaptive Oklab for surround-aware adjustments

## Refactoring Plan

### Phase 1: Git Setup & Documentation ✅
- [x] Initialize Git repository
- [x] Create comprehensive .gitignore
- [x] Document current state (this README)
- [ ] Make initial commit preserving everything

### Phase 2: Consolidation Strategy
- Use `color-utils 2/` as the primary source (most complete)
- Preserve all existing modules from color-utils 2
- Integrate optimizations from abridged version where applicable
- Maintain modular architecture for better maintainability

### Phase 3: Module Organization
The target structure will be:
```
color-utils/
├── src/
│   ├── core/           # Core color space conversions
│   │   ├── srgb.js
│   │   ├── cielab.js
│   │   ├── oklab.js
│   │   └── xyz.js
│   ├── advanced/       # Advanced color models
│   │   ├── aoklab.js
│   │   ├── ciecam16.js
│   │   └── chromaControl.js
│   ├── metrics/        # Color metrics and analysis
│   │   └── color-metrics.js
│   ├── utils/          # Utilities
│   │   └── utils.js
│   ├── types.js        # Type definitions
│   └── index.js        # Main exports
├── tests/
├── docs/
├── examples/
└── legacy/             # Archive old versions
```

### Phase 4: Integration Tasks
- Standardize naming conventions
- Review and integrate performance optimizations
- Ensure complete feature coverage
- Add comprehensive testing

### Phase 5: Documentation & Build
- Update all JSDoc comments
- Generate API documentation
- Create migration guide
- Configure build tools (ESLint, Prettier, etc.)

## Technical Details

### Unique Aspects of This Library

1. **Adaptive Oklab Implementation**: One of the few (if not only) implementations of surround-adapted Oklab color space
2. **Integrated Chroma Control**: Sophisticated algorithms for maintaining WCAG contrast while maximizing colorfulness
3. **Complete CIECAM16**: Full implementation of the latest CIE color appearance model
4. **Modular Architecture**: Clean separation of concerns with well-documented modules

### Author

Mark Gorzynski

### License

ISC

## Usage (Post-Refactoring)

```javascript
// Example will be updated after refactoring
import { AdaptiveOklab, srgbToOklab, calculateWcagContrast } from 'color-utils';

// Create adaptive Oklab converter for dark surround
const aokDark = new AdaptiveOklab({ surround: 'dark' });

// Convert colors
const oklabColor = srgbToOklab({ r: 0.5, g: 0.7, b: 0.3 });

// Check contrast
const contrast = calculateWcagContrast('#FF5733', '#FFFFFF');
```

## Development Status

🚧 **Active Refactoring in Progress** 🚧

This library is currently being refactored to consolidate multiple versions and improve the architecture. The core functionality is stable and well-tested, but the API may change during the refactoring process.

## Next Steps

1. Complete initial Git commit with current state
2. Begin module-by-module integration of abridged optimizations
3. Create comprehensive test suite
4. Update documentation and examples