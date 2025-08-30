# Color Utils Library

A comprehensive JavaScript library for color space conversions, appearance modeling, and color metrics.

## 🎨 Features

### Core Color Space Conversions
- **sRGB** - Standard RGB with gamma correction and hex utilities
- **CIELAB/LCH** - Perceptually uniform color spaces
- **Oklab/OkLCh** - Modern perceptually uniform spaces with improved hue uniformity
- **XYZ** - CIE 1931 color space (D65 illuminant)

### Advanced Color Models
- **Adaptive Oklab (AOkLab)** - Novel surround-adapted Oklab implementation
  - Adjusts for white, gray, and dark viewing conditions
  - Maintains hue uniformity while adapting lightness and chroma
- **CIECAM16** - Complete color appearance model
  - Accounts for chromatic adaptation and viewing conditions
  - Predicts appearance correlates (Lightness J, Chroma C, Hue h)

### Color Metrics & Analysis
- **WCAG Contrast** - Web Content Accessibility Guidelines contrast ratios
- **CIEDE2000** - Advanced perceptual color difference formula
- **Relative Luminance** - CIE relative luminance calculations
- **Oklch Difference** - Perceptual difference in Oklch space

### Advanced Features
- **Chroma Control** - Sophisticated chroma adjustment with WCAG contrast targeting
  - Find maximum chroma for target luminance
  - Adjust colors to meet specific contrast requirements
  - Integration with Adaptive Oklab for surround-aware adjustments

## 📦 Installation

```bash
npm install color-utils
```

## 🚀 Quick Start

```javascript
import { 
  parseSrgbHex, 
  srgbToLab, 
  calculateWcagContrast,
  AdaptiveOklab 
} from 'color-utils';

// Parse hex colors
const red = parseSrgbHex('#FF0000');
const white = parseSrgbHex('#FFFFFF');

// Convert to CIELAB
const labRed = srgbToLab(red);
console.log(labRed); // { L: 53.24, a: 80.09, b: 67.20 }

// Check WCAG contrast
const contrast = calculateWcagContrast(red, white);
console.log(contrast); // 3.99

// Use Adaptive Oklab for dark viewing conditions
const aokDark = new AdaptiveOklab({ surround: 'dark' });
const aokColor = aokDark.fromSrgb(red);
```

## 📚 API Documentation

### sRGB Module
```javascript
import { parseSrgbHex, formatSrgbAsHex, srgbToLab, labToSrgb } from 'color-utils';

// Parse and format hex colors
const color = parseSrgbHex('#FF5733');  // { r: 1, g: 0.341, b: 0.2 }
const hex = formatSrgbAsHex(color);     // '#FF5733'

// Direct conversions
const lab = srgbToLab(color);
const srgb = labToSrgb(lab);
```

### CIELAB Module
```javascript
import { srgbToLab, labToLch, lchToSrgb } from 'color-utils';

// Convert between color spaces
const lab = srgbToLab({ r: 0.5, g: 0.5, b: 0.5 });
const lch = labToLch(lab);
const srgb = lchToSrgb(lch);
```

### Oklab Module
```javascript
import { srgbToOklab, oklabToOklch, oklchToSrgb } from 'color-utils';

// Modern perceptually uniform conversions
const oklab = srgbToOklab({ r: 0.5, g: 0.7, b: 0.3 });
const oklch = oklabToOklch(oklab);
const srgb = oklchToSrgb(oklch);
```

### Adaptive Oklab
```javascript
import { AdaptiveOklab } from 'color-utils';

// Create instances for different viewing conditions
const aokWhite = new AdaptiveOklab({ surround: 'white' });
const aokGray = new AdaptiveOklab({ surround: 'gray' });
const aokDark = new AdaptiveOklab({ surround: 'dark' });

// Convert colors with surround adaptation
const adapted = aokDark.fromSrgb({ r: 0.5, g: 0.5, b: 0.5 });
const srgb = aokDark.toSrgb(adapted);
```

### Color Metrics
```javascript
import { 
  calculateWcagContrast, 
  isWcagContrastSufficient,
  calculateCiede2000 
} from 'color-utils';

// WCAG contrast checking
const contrast = calculateWcagContrast('#FFFFFF', '#767676');
const meetsAA = isWcagContrastSufficient('#FFFFFF', '#767676', 'AA'); // true

// Perceptual color difference
const lab1 = srgbToLab(parseSrgbHex('#FF0000'));
const lab2 = srgbToLab(parseSrgbHex('#FF0505'));
const deltaE = calculateCiede2000(lab1, lab2); // Small difference
```

## 🔄 Refactoring Status

### ✅ Phase 1: Git Setup & Documentation (Complete)
- [x] Initialize Git repository
- [x] Create comprehensive .gitignore
- [x] Document current state
- [x] Make initial commit preserving everything

### ✅ Phase 2: Code Consolidation (Complete)
- [x] Archive legacy versions to `legacy/`
- [x] Create new module structure in `src/`
- [x] Integrate optimizations from abridged v22
- [x] Preserve all advanced features
- [x] Standardize naming conventions
- [x] Create unified exports in index.js

### 🚧 Phase 3: Testing & Validation (In Progress)
- [ ] Create comprehensive test suite
- [ ] Validate all color space conversions
- [ ] Test cross-module dependencies
- [ ] Performance benchmarking
- [ ] Edge case testing

### 📝 Phase 4: Documentation Optimization (Next)
- [ ] Generate complete API documentation with JSDoc
- [ ] Create interactive examples
- [ ] Write migration guide from legacy versions
- [ ] Add TypeScript definitions
- [ ] Create visual color space diagrams
- [ ] Document mathematical foundations
- [ ] Add performance optimization guide
- [ ] Create troubleshooting guide

### 🚀 Phase 5: GitHub Preparation
- [ ] Optimize README for GitHub
- [ ] Create CONTRIBUTING.md
- [ ] Add LICENSE file
- [ ] Set up GitHub Actions for CI/CD
- [ ] Create issue templates
- [ ] Add code of conduct
- [ ] Create security policy
- [ ] Add badges (npm, build status, coverage)

### 📦 Phase 6: NPM Publishing Preparation
- [ ] Update package.json with all metadata
- [ ] Create .npmignore
- [ ] Add prepublish scripts
- [ ] Version tagging strategy
- [ ] Create CHANGELOG.md
- [ ] Add npm scripts for common tasks

## 📖 Module Overview

| Module | Description | Key Functions |
|--------|-------------|--------------|
| `srgb.js` | sRGB conversions with gamma correction | `parseSrgbHex`, `formatSrgbAsHex`, `srgbToLinearSrgb` |
| `cielab.js` | CIELAB/LCH color spaces | `srgbToLab`, `labToLch`, `lchToSrgb` |
| `oklab.js` | Oklab/OkLCh modern spaces | `srgbToOklab`, `oklabToOklch` |
| `aoklab.js` | Adaptive Oklab with surround correction | `AdaptiveOklab` class |
| `ciecam16.js` | CIECAM16 appearance model | `srgbToCiecam16` |
| `color-metrics.js` | Color difference and contrast metrics | `calculateWcagContrast`, `calculateCiede2000` |
| `chromaControl.js` | Advanced chroma/luminance control | `findMaxAokChromaForLabL`, `adjustAokColorToLabL` |
| `utils.js` | Mathematical utilities | `degreesToRadians`, `clamp`, `multiplyMatrixVector` |

## 🔬 Technical Details

### Optimizations from v22
- Inline gamma correction functions for better performance
- Direct sRGB↔Lab conversions bypassing XYZ objects
- Optimized matrix multiplication
- Efficient CIEDE2000 implementation

### Unique Aspects
1. **Adaptive Oklab**: One of the few (if not only) public implementations of surround-adapted Oklab
2. **Integrated Chroma Control**: Sophisticated algorithms for maintaining WCAG contrast while maximizing colorfulness
3. **Complete CIECAM16**: Full implementation of the latest CIE color appearance model
4. **Modular Architecture**: Clean separation of concerns with well-documented modules

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific module tests
npm test -- srgb
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details

## 👤 Author

Mark Gorzynski

## 🔗 Links

- [GitHub Repository](https://github.com/TEMP/color-utils)
- [NPM Package](https://www.npmjs.com/package/color-utils)
- [API Documentation](https://temp.github.io/color-utils/)
- [Issue Tracker](https://github.com/TEMP/color-utils/issues)

## 🏷️ Keywords

`color`, `colour`, `srgb`, `lab`, `lch`, `oklab`, `oklch`, `cielab`, `ciecam16`, `wcag`, `contrast`, `color-science`, `color-space`, `color-conversion`, `accessibility`, `a11y`, `color-difference`, `ciede2000`, `adaptive-oklab`, `color-appearance`

---

<p align="center">
  <strong>🎨 Comprehensive • 🚀 Performant • 📚 Well-Documented • 🔬 Scientifically Accurate</strong>
</p>