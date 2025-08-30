# Contributing to Color Utils

Thank you for your interest in contributing to Color Utils! We welcome contributions from the community to make this library even better.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Issues

Before creating a new issue, please:
1. Check existing issues to avoid duplicates
2. Use the appropriate issue template if available
3. Provide clear reproduction steps for bugs
4. Include relevant environment details (Node.js version, OS, etc.)

### Suggesting Features

We love hearing your ideas! When suggesting features:
1. Explain the use case and why it would benefit users
2. Consider if it aligns with our focus on perceptual color science and accessibility
3. Provide examples or mockups if applicable

### Submitting Pull Requests

#### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/color-utils.git
cd color-utils
npm install
```

#### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

#### 3. Make Your Changes

- Follow the existing code style and conventions
- Add/update tests for new functionality
- Update documentation as needed
- Ensure all tests pass

#### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Test specific module
npm test -- srgb
```

#### 5. Commit Your Changes

We follow conventional commit messages:

```bash
# Format: <type>(<scope>): <subject>

# Examples:
git commit -m "feat(oklab): add support for custom white points"
git commit -m "fix(cielab): correct rounding in Lab to XYZ conversion"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(wcag): add edge cases for contrast calculation"
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code restructuring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### 6. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Reference to any related issues
- Summary of changes made
- Screenshots/examples if applicable

## Development Guidelines

### Code Style

- Use ES6+ features where appropriate
- Follow existing naming conventions (camelCase for functions/variables)
- Add JSDoc comments for public APIs
- Keep functions focused and modular

### Range Conventions

This library follows strict range conventions. Please review [RANGE_STANDARDS.md](./RANGE_STANDARDS.md) before working with color values:

- sRGB: `[0, 1]` for all channels
- XYZ: Y-normalized to `[0, 1]` (ICC standard)
- CIELAB: L in `[0, 100]`, a/b typically `[-128, 127]`
- Oklab: L in `[0, 1]`, a/b typically `[-0.4, 0.4]`

### Testing Requirements

- All new features must include tests
- Maintain or improve code coverage (currently 95.6%)
- Test edge cases and error conditions
- Use descriptive test names

### Documentation

- Update JSDoc comments for API changes
- Add examples for new features
- Update TypeScript definitions if needed
- Keep README examples current

## Areas of Focus

We're particularly interested in contributions that:

### High Priority
- Performance optimizations
- Additional color space support (ProPhoto RGB, ACEScg)
- Improved gamut mapping algorithms
- CVD (color vision deficiency) utilities
- WebAssembly implementations

### Good First Issues
- Documentation improvements
- Additional examples
- Test coverage improvements
- TypeScript definition enhancements
- Bug fixes in edge cases

### Research Areas
- HDR color mapping techniques
- Machine learning for color harmony
- Advanced interpolation methods
- Temporal adaptation models

## Module Structure

When adding new functionality, follow our module organization:

```
src/
├── color-spaces/      # Core color space conversions
│   ├── srgb.js
│   ├── cielab.js
│   └── oklab.js
├── advanced/          # Advanced color models
│   ├── aoklab.js
│   └── ciecam16.js
├── metrics/           # Color difference and analysis
│   └── color-metrics.js
└── utils/            # Shared utilities
    └── utils.js
```

## Questions?

If you have questions about contributing:
1. Check existing issues and discussions
2. Review the documentation
3. Open a discussion for broader topics
4. Contact maintainers for specific guidance

## Recognition

Contributors will be:
- Listed in the project's contributors section
- Credited in release notes for significant contributions
- Eligible for maintainer status with sustained contributions

## License

By contributing, you agree that your contributions will be licensed under the same ISC License as the project.

---

Thank you for helping make Color Utils better for everyone! 🎨