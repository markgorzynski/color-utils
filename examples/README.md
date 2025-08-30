# Color Utils Examples

This directory contains practical examples demonstrating the capabilities of the Color Utils library.

## Quick Start Examples

### Basic Color Conversions
- `basic-conversions.js` - Simple sRGB to Lab/Oklab conversions
- `hex-colors.js` - Working with hex color strings
- `color-spaces.js` - Converting between all supported color spaces

### Advanced Features
- `adaptive-oklab.js` - Using Adaptive Oklab for different viewing conditions
- `gamut-mapping.js` - Handling out-of-gamut colors
- `wcag-contrast.js` - Calculating and ensuring WCAG compliance
- `color-difference.js` - Measuring perceptual color differences

### Professional Use Cases
- `dark-mode-adaptation.js` - Adapting colors for dark/light themes
- `accessibility-optimization.js` - Maximizing vibrancy while maintaining WCAG compliance
- `wide-gamut-workflow.js` - Working with Display P3 and Rec. 2020
- `color-appearance-modeling.js` - Using CIECAM16 for accurate appearance prediction

## Running the Examples

### Node.js
```bash
node examples/basic-conversions.js
```

### Browser
Open `examples/browser/index.html` in a modern browser.

## Interactive Demos

Visit our [online playground](https://color-utils-demo.vercel.app) for interactive demos with live code editing.

## Example Patterns

### Pattern 1: Safe Color Processing
```javascript
import { srgbToLab, isSrgbInGamut, gamutMapToSrgb } from 'color-utils';

function processUserColor(input) {
  let color = parseColorInput(input);
  
  // Check if in gamut
  if (!isSrgbInGamut(color)) {
    console.warn('Color out of gamut, mapping...');
    color = gamutMapToSrgb(color);
  }
  
  // Now safe to convert
  const lab = srgbToLab(color);
  return lab;
}
```

### Pattern 2: Theme-Aware Colors
```javascript
import { AdaptiveOklab } from 'color-utils';

function getThemeColor(baseColor, theme) {
  const surround = theme === 'dark' ? 'dark' : 'white';
  const aok = new AdaptiveOklab({ surround });
  
  const adapted = aok.fromSrgb(baseColor);
  return aok.toSrgb(adapted);
}
```

### Pattern 3: Accessibility-First Design
```javascript
import { calculateWcagContrast, adjustAokColorToLabL } from 'color-utils';

function ensureAccessibleColor(foreground, background, minContrast = 4.5) {
  const contrast = calculateWcagContrast(foreground, background);
  
  if (contrast >= minContrast) {
    return foreground;
  }
  
  // Adjust color to meet contrast requirements
  // Implementation details in accessibility-optimization.js
}
```