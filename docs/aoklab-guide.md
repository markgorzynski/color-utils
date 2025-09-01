# Adaptive Oklab (Aoklab) Guide

## Overview

Adaptive Oklab (Aoklab) extends the standard Oklab color space to account for viewing surround conditions. While Oklab is optimized for dark viewing (like cinema), Aoklab adapts to different surrounds from black to white, providing perceptually uniform color under various viewing conditions.

## Quick Start

```javascript
import { createAoklabForSurround } from '@markgorzynski/color-utils';

// Create an instance for typical office lighting
const aoklab = createAoklabForSurround('gray');

// Convert colors
const labColor = aoklab.fromHex('#336699');
const hexColor = aoklab.toHex(labColor);
```

## Understanding the Problem

### Why Aoklab?

Standard color spaces have fixed assumptions about viewing conditions:
- **Oklab**: Optimized for dark viewing (cinema/dark room)
- **CIELAB**: Optimized for mid-gray surround (D50 lighting)
- **sRGB**: Assumes dim surround (typical monitor in dim room)

When these don't match your actual viewing conditions, colors appear wrong:
- Dark colors become indistinguishable ("shadow blocking")
- Light colors may appear washed out
- Color gradients show uneven steps

### The Science

Human vision adapts to surround luminance through:
1. **Stevens Effect**: Perceived contrast changes with surround brightness
2. **Neural Compression**: Visual system compresses signals at extremes to avoid saturation
3. **Shadow Roll-off**: Evolutionary bias to compress darks while maintaining highlight headroom

## Aoklab Solution

Aoklab uses a two-layer tone mapping system:

### Layer 1: Gamma Adjustment
Base adaptation using a power function to adjust overall lightness:
- **γ < 1**: Lightens image (for bright surrounds)
- **γ = 1**: No change
- **γ > 1**: Darkens image (for very dark surrounds)

### Layer 2: Sigmoid Enhancement
Selective tone curve adjustment for shadow/highlight control:
- **Positive values**: Lift shadows while preserving highlights (for UI uniformity)
- **Zero**: No change
- **Negative values**: Increase contrast (S-curve for photographic look)

## Presets

Based on empirical testing matching to CIELAB under gray surround:

| Surround | Gamma | Sigmoid | Use Case |
|----------|-------|---------|----------|
| black | 1.05 | +1.0 | Cinema, dark room |
| dark | 1.10 | +1.0 | Dim room, evening |
| gray | 0.85 | +1.0 | Office, studio (CIELAB match) |
| light | 0.80 | +1.0 | Bright room, near window |
| white | 0.75 | +1.0 | Outdoor, direct sunlight |

All presets use maximum shadow lifting (sigmoid = 1.0) to achieve perceptual uniformity, especially important for UI design.

## API Reference

### Basic Usage

```javascript
import { AdaptiveOklab } from '@markgorzynski/color-utils';

// Create with surround preset
const aoklab = new AdaptiveOklab({
  surround: 'gray',
  toneMapping: {
    gammaAdjustment: -0.15,  // γ = 0.85
    sigmoidStrength: 1.0      // Maximum shadow lift
  }
});

// Convert from sRGB
const labColor = aoklab.fromSrgb({ r: 0.2, g: 0.4, b: 0.6 });
// Returns: { L: 0.xyz, a: 0.xyz, b: 0.xyz }

// Convert back to sRGB
const rgbColor = aoklab.toSrgb(labColor);
```

### Convenience Functions

```javascript
import { 
  createAoklabForSurround,
  getRecommendedSurround,
  AOKLAB_PRESETS 
} from '@markgorzynski/color-utils';

// Auto-select surround based on ambient light
const lux = 250; // Office lighting
const surround = getRecommendedSurround(lux);
const aoklab = createAoklabForSurround(surround);

// Access presets directly
const grayPreset = AOKLAB_PRESETS.gray;
```

### Advanced Configuration

```javascript
// Custom tone mapping
const customAoklab = new AdaptiveOklab({
  surround: 'gray',
  toneMapping: {
    gammaAdjustment: -0.2,   // Custom gamma
    sigmoidStrength: 0.8     // Custom sigmoid
  },
  x0: 0.5  // LMS reference point (advanced)
});

// Save and restore settings
import { exportConfig, createFromConfig } from '@markgorzynski/color-utils';

const config = exportConfig(customAoklab);
// Save config to user preferences...

// Later, restore:
const restoredAoklab = createFromConfig(config);
```

## Use Cases

### 1. UI Design Systems

Create perceptually uniform color scales:

```javascript
// Generate evenly-spaced grays for UI
const aoklab = createAoklabForSurround('gray');
const uiGrays = [];

for (let l = 0; l <= 100; l += 10) {
  const labColor = { L: l/100, a: 0, b: 0 };
  const hex = aoklab.toHex(labColor);
  uiGrays.push(hex);
}
// Result: 11 grays with perceptually even steps
```

### 2. Dark Mode Optimization

Ensure shadow separation in dark themes:

```javascript
// Adapt dark mode colors for actual viewing conditions
const viewingSurround = 'light'; // Bright room
const aoklab = createAoklabForSurround(viewingSurround);

// Convert dark mode palette
const darkBg = aoklab.fromHex('#121212');
const card = aoklab.fromHex('#1e1e1e');
const border = aoklab.fromHex('#333333');

// These will have better separation under bright viewing
```

### 3. Cross-Media Color Matching

Match colors across different viewing conditions:

```javascript
// Design on screen, match for print
const screenAok = createAoklabForSurround('gray');
const printAok = createAoklabForSurround('white');

const screenColor = screenAok.fromHex('#336699');
const printHex = printAok.toHex(screenColor);
// printHex is adjusted for bright paper viewing
```

## Theory and Calibration

### Calibration Process

The presets were derived by:
1. Starting with CIELAB as reference for gray surround (its design condition)
2. Adjusting Aoklab parameters until grayscale ramps matched perceptually
3. Finding that maximum shadow lifting (sigmoid = 1.0) was needed
4. Discovering Oklab's inherent dark-optimization requires compensation

### Why Maximum Shadow Lifting?

Testing revealed that even with different gamma values, all surrounds needed sigmoid = 1.0 because:
- Human vision evolved for daylight (bright conditions)
- Neural compression always affects shadows more than highlights
- Oklab's dark-baseline compounds this compression
- UI design needs uniform perceptual steps, fighting natural compression

### Biological Basis

The model compensates for:
- **Photoreceptor compression**: Logarithmic response at extremes
- **Neural adaptation**: Gain control based on surround
- **Evolutionary bias**: Optimized for bright conditions with shadow roll-off

## Performance Considerations

- Aoklab adds ~15% overhead vs standard Oklab
- Tone mapping is applied per-color (no batch optimization currently)
- Consider caching converted colors for repeated use
- For real-time applications, consider GPU implementation

## Comparison with Other Models

| Model | Surround Adaptation | Shadow Detail | UI Suitability |
|-------|-------------------|---------------|----------------|
| Oklab | None (fixed dark) | Poor in light | Poor |
| CIELAB | None (fixed gray) | Good at gray | Medium |
| CIECAM16 | Full but complex | Good | Slow |
| Aoklab | Simplified, fast | Excellent | Excellent |

## Future Developments

- Extended sigmoid range for artistic tone mapping
- Softer base curves (alternatives to gamma)
- Automatic calibration from user testing
- HDR support with extended range

## References

- [Oklab Color Space](https://bottosson.github.io/posts/oklab/) - Björn Ottosson
- Stevens, S.S. (1963). "Psychophysics: Introduction to its perceptual, neural, and social prospects"
- Hunt, R.W.G. (2004). "The Reproduction of Colour" (6th ed.)

## Support

For issues or questions:
- GitHub: [@markgorzynski/color-utils](https://github.com/markgorzynski/color-utils)
- Examples: See `/examples/adaptive-oklab.js` in the package

## License

MIT License - See LICENSE file for details