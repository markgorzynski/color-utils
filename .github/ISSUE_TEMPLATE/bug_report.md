---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

```javascript
// Minimal code example that reproduces the issue
import { srgbToLab } from 'color-utils';

const result = srgbToLab({ r: 1, g: 0, b: 0 });
// Expected: ...
// Actual: ...
```

**Expected behavior**
A clear and concise description of what you expected to happen.

**Actual behavior**
What actually happened instead.

**Environment:**
 - OS: [e.g. macOS 14, Windows 11, Ubuntu 22.04]
 - Node.js version: [e.g. 20.10.0]
 - Package version: [e.g. 0.9.8]

**Additional context**
Add any other context about the problem here, such as:
- Does this happen with specific color values?
- Is this related to a particular color space?
- Have you found a workaround?