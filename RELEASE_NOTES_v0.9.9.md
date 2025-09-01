# Release v0.9.9 - Bug Fix

## 🐛 Bug Fixes

### Fixed: Duplicate Export Error
- **Issue**: Module failed to load due to duplicate export of `clamp` function
- **Impact**: Prevented the library from being imported as ES module
- **Solution**: Removed duplicate export from `src/index.js`

## 📦 What's Changed
- Removed duplicate `clamp` export from gamut.js exports section
- Module now loads correctly when imported

## 🔧 Testing
- Verified fix with test project
- All core functionality working as expected
- Module imports successfully in browser and Node.js

## 📚 Installation

```bash
npm install @markgorzynski/color-utils@0.9.9
```

## 🙏 Thanks
Thanks to early testing that helped identify this critical issue!