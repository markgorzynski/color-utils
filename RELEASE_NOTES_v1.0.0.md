# Release v1.0.0 - Adaptive Oklab with Tone Mapping

## 🎉 Major Release

This release introduces refined Adaptive Oklab (Aoklab) with advanced tone mapping capabilities, providing perceptually uniform colors across different viewing conditions.

## ✨ New Features

### Enhanced Adaptive Oklab
- **Two-layer tone mapping system**: Gamma adjustment + sigmoid enhancement
- **Empirically-derived presets**: Based on perceptual testing matching CIELAB
- **Universal shadow lifting**: All surrounds use sigmoid=1.0 for perceptual uniformity
- **Improved shadow separation**: Critical for dark mode UIs and design systems

### New Presets Module
- `aoklab-defaults.js`: Ready-to-use presets for common viewing conditions
- Factory functions for easy instantiation
- Ambient light-based surround selection
- Configuration import/export utilities

### Comprehensive Documentation
- Complete API guide in `/docs/aoklab-guide.md`
- Theory and calibration methodology
- Practical examples for UI design
- Biological basis for the model

## 🔬 Technical Improvements

### Refined Tone Mapping
- **Stronger sigmoid effects**: 
  - Shadow lift multiplier increased from 0.2 to 0.3 (50% stronger)
  - Contrast enhancement multiplier increased from 5 to 8 (60% stronger)
- **Smooth shadow lifting**: Focuses on 0-50% range without discontinuities
- **No black clipping**: Mathematical guarantees against crushing blacks

### Updated Presets (Empirically Tested)
```javascript
// All with sigmoid = 1.0 for uniform perception
black:  γ=1.05  // Slight darkening
dark:   γ=1.10  // More darkening  
gray:   γ=0.85  // Matches CIELAB
light:  γ=0.80  // Moderate lightening
white:  γ=0.75  // Significant lightening
```

## 🎯 Key Use Cases

### UI Design Systems
- Create perceptually uniform color scales
- Ensure proper shadow separation in dark modes
- Maintain consistent contrast across viewing conditions

### Cross-Media Color Matching
- Design on screen, adapt for different viewing conditions
- Match colors between devices with different surrounds
- Consistent brand colors across media

## 📚 Installation

```bash
npm install @markgorzynski/color-utils@1.0.0
```

## 💻 Basic Usage

```javascript
import { createAoklabForSurround } from '@markgorzynski/color-utils';

// Create for typical office viewing
const aoklab = createAoklabForSurround('gray');

// Convert colors with proper adaptation
const color = aoklab.fromHex('#336699');
const adjusted = aoklab.toHex(color);
```

## 🔄 Migration from v0.x

The core API remains compatible. New features are additive:
- Existing `AdaptiveOklab` class enhanced with `toneMapping` option
- New `aoklab-defaults` module for convenience
- Presets can be used or custom parameters specified

## 🐛 Bug Fixes
- Fixed sigmoid discontinuity at midpoint
- Resolved black clipping in shadow lifting
- Corrected polarity in contrast enhancement

## 📊 Performance
- ~15% overhead vs standard Oklab
- Optimized sigmoid calculations
- Suitable for real-time applications

## 🙏 Acknowledgments

Special thanks to empirical testing that revealed:
- Oklab's dark-optimization isn't suitable for typical viewing
- Maximum shadow lifting needed for perceptual uniformity
- Human vision's evolutionary bias toward bright conditions

## 📖 Documentation

See `/docs/aoklab-guide.md` for:
- Complete API reference
- Theory and calibration methodology
- Practical examples
- Biological basis

## 🔮 Future Work
- Extended sigmoid range for artistic effects
- Alternative base curves to gamma
- HDR support
- GPU acceleration

---

**Breaking Change**: While the API is compatible, the visual output of Aoklab has changed significantly due to refined tone mapping. Colors will appear different (better!) than in v0.x.