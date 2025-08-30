# color-utils JavaScript Library

`color-utils` is a modular, maintainable, and comprehensively documented JavaScript library designed for precise and efficient color manipulations and conversions across various color spaces including sRGB, Linear sRGB, CIE XYZ, CIELAB, CIELCh, Oklab, OkLCh, Adaptive Oklab, and CIECAM16.

## Overview

`color-utils` aims to provide a unified and intuitive API for working with colors in diverse color spaces. It supports accurate conversions, gamut checks, contrast calculations, and advanced chroma controls, making it an ideal tool for UI/UX designers, color scientists, developers, and accessibility experts.

## Installation

```bash
npm install color-utils
```

## Features

* **Modular Design:** ES6 modules structured by color spaces for clarity and maintainability.
* **Comprehensive Conversions:** Full support for conversions between sRGB, Linear sRGB, XYZ (D65), CIELAB, CIELCh, Oklab, OkLCh, Adaptive Oklab, and CIECAM16.
* **Adaptive Color Models:** Customizable Adaptive Oklab conversions based on viewing conditions (`white`, `gray`, `dark` surrounds).
* **Color Metrics:** Accurate calculation of WCAG contrast ratios, CIEDE2000, and optimized OkLCh differences.
* **Advanced Chroma Control:** Methods to find maximum chroma for target lightness while respecting sRGB gamut constraints.
* **Detailed Documentation:** Extensive JSDoc comments, API reference, and practical examples.

## Usage Examples

### Converting sRGB Hex to Adaptive Oklab (White Surround)

```javascript
import { AdaptiveOklab } from 'color-utils';

const adaptiveConverter = new AdaptiveOklab({ surround: 'white' });
const adaptiveColor = AdaptiveOklab.fromHex('#4A90E2', { surround: 'white' });

console.log(adaptiveColor);
```

### Calculating WCAG Contrast

```javascript
import { calculateWcagContrast } from 'color-utils';

const contrast = calculateWcagContrast('#FFFFFF', '#000000');
console.log(`Contrast ratio: ${contrast}`);
```

### Finding Maximum Chroma for Given Lightness

```javascript
import { findMaxChromaForLabLightness } from 'color-utils';

const maxChroma = findMaxChromaForLabLightness(120, 50); // Hue = 120°, L* = 50
console.log(`Maximum Chroma: ${maxChroma}`);
```

## API Overview

The core modules exported by `color-utils` include:

### sRGB and Utilities

* `srgbToLinearSrgb`, `linearSrgbToSrgb`
* `srgbToXyz`, `xyzToSrgb`
* `parseSrgbHex`, `formatSrgbAsHex`

### CIELAB and CIELCh

* `xyzToLab`, `labToXyz`
* `labToLch`, `lchToLab`
* `srgbToLab`, `labToSrgb`

### Oklab and OkLCh

* `linearSrgbToOklab`, `oklabToLinearSrgb`
* `oklabToOklch`, `oklchToOklab`
* `srgbToOklab`, `oklabToSrgb`

### Adaptive Oklab

* `AdaptiveOklab` class supporting surround conditions (`white`, `gray`, `dark`)

### CIECAM16

* `srgbToCiecam16`

### Color Metrics

* `getSrgbRelativeLuminance`
* `calculateWcagContrast`, `isWcagContrastSufficient`
* `calculateCiede2000`, `calculateOklchDifference`

### Chroma Control

* `findMaxChromaForLabLightness`
* `adjustOklchForLabLightness`

## Development

### Project Structure

```
color-utils/
├── src/
│   ├── utils.js
│   ├── srgb.js
│   ├── cielab.js
│   ├── oklab.js
│   ├── aoklab.js
│   ├── ciecam16.js
│   ├── color-metrics.js
│   ├── chromaControl.js
│   ├── types.js
│   └── index.js
├── tests/
└── docs/
```

### Contributing

Contributions are welcome! Please ensure code is accompanied by relevant unit tests and comprehensive documentation updates.

## License

This project is open-source and available under the MIT License.

---

Happy color transforming! 🎨
