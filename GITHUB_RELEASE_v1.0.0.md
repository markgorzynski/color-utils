# GitHub Release v1.0.0

## To Create the Release

1. Go to: https://github.com/markgorzynski/color-utils/releases/new

2. Fill in the following:

**Tag:** v1.0.0 (select existing tag)
**Target:** main
**Release title:** v1.0.0 - Adaptive Oklab with Advanced Tone Mapping

**Release notes:** (Copy the text below)

---

# 🎉 Color Utils v1.0.0 - Adaptive Oklab with Advanced Tone Mapping

## Major Release Highlights

This release introduces **Adaptive Oklab (Aoklab)** with sophisticated tone mapping, providing perceptually uniform colors across different viewing conditions - from dark cinema rooms to bright outdoor displays.

## ✨ Key Features

### 🎨 Enhanced Adaptive Oklab
- **Two-layer tone mapping**: Gamma adjustment + sigmoid enhancement
- **Empirically-calibrated presets**: Based on perceptual testing matching CIELAB
- **Universal shadow lifting**: All surrounds use sigmoid=1.0 for perceptual uniformity
- **Improved shadow separation**: Critical for dark mode UIs and design systems

### 📦 New Presets Module
```javascript
import { createAoklabForSurround } from '@markgorzynski/color-utils';

// Create for typical office viewing
const aoklab = createAoklabForSurround('gray');
const color = aoklab.fromHex('#336699');
```

### 📊 Calibrated Settings
All presets use maximum shadow lifting (sigmoid = 1.0):
- **black**: γ=1.05 (cinema/dark room)
- **dark**: γ=1.10 (dim room)  
- **gray**: γ=0.85 (office - matches CIELAB)
- **light**: γ=0.80 (bright room)
- **white**: γ=0.75 (outdoor/sunlight)

## 🔬 Technical Improvements

### Refined Tone Mapping
- Shadow lift multiplier increased 50% (0.2 → 0.3)
- Contrast enhancement multiplier increased 60% (5 → 8)
- Smooth shadow lifting in 0-50% range
- Mathematical guarantees against black clipping

### Biological Basis
The model compensates for:
- Human vision's evolution for bright daylight conditions
- Neural compression that affects shadows more than highlights
- Oklab's dark-optimization requiring compensation for typical viewing

## 📚 Documentation

- Complete guide: [Adaptive Oklab Guide](https://markgorzynski.github.io/color-utils/aoklab-guide.md)
- API Reference: [Full API Documentation](https://markgorzynski.github.io/color-utils/API.html)
- JSDoc: [Auto-generated docs](https://markgorzynski.github.io/color-utils/api/)

## 🎯 Use Cases

### UI Design Systems
- Create perceptually uniform color scales
- Ensure proper shadow separation in dark modes
- Maintain consistent contrast across viewing conditions

### Cross-Media Color Matching
- Design on screen, adapt for different viewing conditions
- Match colors between devices with different surrounds
- Consistent brand colors across media

## 💻 Installation

```bash
npm install @markgorzynski/color-utils@1.0.0
```

## 🔄 Migration from v0.x

The core API remains compatible. New features are additive:
- Existing `AdaptiveOklab` class enhanced with `toneMapping` option
- New `aoklab-defaults` module for convenience
- Presets can be used or custom parameters specified

**Note**: While the API is compatible, colors will appear different (better!) due to refined tone mapping.

## 🐛 Bug Fixes
- Fixed sigmoid discontinuity at midpoint
- Resolved black clipping in shadow lifting
- Corrected polarity in contrast enhancement

## 🙏 Acknowledgments

Special thanks to empirical testing that revealed:
- Oklab's dark-optimization isn't suitable for typical viewing
- Maximum shadow lifting needed for perceptual uniformity
- Human vision's evolutionary bias toward bright conditions

## 📖 Full Release Notes

See [RELEASE_NOTES_v1.0.0.md](https://github.com/markgorzynski/color-utils/blob/main/RELEASE_NOTES_v1.0.0.md) for complete details.

---

**NPM Package**: https://www.npmjs.com/package/@markgorzynski/color-utils
**Documentation**: https://markgorzynski.github.io/color-utils/
**Issues**: https://github.com/markgorzynski/color-utils/issues

---

## What's Changed

### Features
* Enhanced Adaptive Oklab with two-layer tone mapping
* New aoklab-defaults module with empirically-calibrated presets
* Factory functions for easy Aoklab instantiation
* Ambient light-based surround selection
* Configuration import/export utilities

### Documentation
* Complete Adaptive Oklab guide
* Updated API documentation
* GitHub Pages documentation site
* Migration guide from v0.x

### Technical
* Refined sigmoid function for smooth shadow lifting
* Increased tone mapping strength (50-60% stronger)
* Mathematical guarantees against black clipping
* Perceptual calibration matching CIELAB

**Full Changelog**: https://github.com/markgorzynski/color-utils/compare/v0.9.0...v1.0.0