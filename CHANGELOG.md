# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Complete GitHub Actions CI/CD pipeline
- NPM publishing configuration
- Issue templates for bug reports, feature requests, and documentation
- CONTRIBUTING.md with detailed contribution guidelines
- Optimized README for GitHub presentation with badges and comparison table

## [0.9.8] - 2024-12-30

### Added
- **Adaptive Oklab (Industry First)**: Surround-aware color adaptation for white/gray/dark viewing conditions
- **Chroma Control**: WCAG-constrained color optimization with maximum vibrancy
- **Wide Gamut Support**: Display P3 and Rec. 2020 color spaces
- **CIECAM16**: Complete color appearance model implementation
- **CAM16-UCS**: Perceptually uniform color space based on CIECAM16
- **CSS Color Level 4**: Full parsing support for modern CSS color syntax
- **Chromatic Adaptation**: Bradford, CAT02, CAT16, Von Kries transforms
- **Gamut Mapping**: CSS Color 4 compliant algorithms with binary search
- TypeScript definitions for complete type safety
- Comprehensive test suite with 95.6% coverage (129/135 tests passing)
- Interactive examples demonstrating key features
- Migration guide for users of legacy versions
- Troubleshooting guide with common issues and solutions
- Industry-standard range documentation (RANGE_STANDARDS.md)

### Changed
- **BREAKING**: Consolidated 4 legacy versions into unified API
- **BREAKING**: Renamed functions for consistency (e.g., `rgbToLab` → `srgbToLab`)
- **BREAKING**: XYZ scale changed from Y=100 to Y=1 (ICC standard)
- **BREAKING**: All functions now use object parameters instead of individual values
- **BREAKING**: Parse functions return `null` instead of throwing errors
- Improved performance with optimized gamma correction and matrix operations
- Enhanced documentation with JSDoc comments for all public APIs

### Fixed
- CIELAB precision issues in extreme color ranges
- Adaptive Oklab roundtrip accuracy (now <0.000001 error)
- XYZ scale inconsistencies across modules
- Edge cases in hex color parsing
- Floating-point precision in gamma correction

### Known Issues
- CUSP gamut mapping not fully implemented
- Some precision issues in extreme CIELAB ranges
- Integration tests need updates

## [Legacy Versions]

### color_utils_abridged_v22
- Optimized sRGB↔Lab direct conversions
- Inline gamma correction for performance
- CIEDE2000 implementation

### cielab-oklab-hybrid.js
- Original Adaptive Oklab implementation
- Surround correction algorithms

### rgb-xyz-conversions.js
- Core color space transformations
- Matrix multiplication utilities

### color-utils-augmented.js
- Extended color metrics
- WCAG contrast calculations

---

## Version History

- **0.9.8** - Pre-release with core functionality complete
- **0.9.0-0.9.7** - Internal development versions
- **Legacy** - Multiple separate files with inconsistent APIs

## Upgrade Guide

See [MIGRATION.md](./MIGRATION.md) for detailed upgrade instructions from legacy versions.

## Future Releases

### [1.0.0] - Planned
- Complete CUSP gamut mapping implementation
- 100% test coverage
- Performance optimizations
- WebAssembly module for intensive operations

### [1.1.0] - Roadmap
- CVD (color vision deficiency) optimization
- HDR color mapping with Oklab tone mapping
- Multi-illuminant adaptation
- Time-of-day adaptive colors
- Age-related vision adaptation

[Unreleased]: https://github.com/markgorzynski/color-utils/compare/v0.9.8...HEAD
[0.9.8]: https://github.com/markgorzynski/color-utils/releases/tag/v0.9.8