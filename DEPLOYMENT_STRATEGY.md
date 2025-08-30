# Deployment Strategy for Dual GitHub Accounts

## Repository Management

### 1. Git Remote Configuration

```bash
# Add both remotes
git remote add personal https://github.com/yourusername/color-utils.git
git remote add work https://github-enterprise.yourcompany.com/team/color-utils.git

# View remotes
git remote -v

# Push to specific remote
git push personal main
git push work main

# Push to all remotes at once
git remote set-url --add --push origin https://github.com/yourusername/color-utils.git
git remote set-url --add --push origin https://github-enterprise.yourcompany.com/team/color-utils.git
git push origin main  # pushes to both
```

### 2. NPM Package Naming

You have several options for NPM publishing:

#### Option A: Scoped Packages
```json
// Personal version
{
  "name": "@yourusername/color-utils"
}

// Company version (using private registry)
{
  "name": "@company/color-utils"
}
```

#### Option B: Private Registry for Work
```bash
# .npmrc for company registry
@company:registry=https://npm.yourcompany.com/
//npm.yourcompany.com/:_authToken=${NPM_TOKEN}

# Publish to company registry
npm publish --registry https://npm.yourcompany.com/
```

#### Option C: Single Public Package
- Publish only to public NPM
- Company uses public package as dependency

## Recommended Setup

### 1. Package.json Modifications

Create two versions:

**package.json** (personal/public):
```json
{
  "name": "@yourusername/color-utils",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

**package.company.json** (work):
```json
{
  "name": "@company/color-utils",
  "version": "1.0.0",
  "publishConfig": {
    "registry": "https://npm.company.com/"
  }
}
```

### 2. Deployment Scripts

Create deployment helper scripts:

**scripts/deploy-personal.sh**:
```bash
#!/bin/bash
echo "Deploying to personal GitHub..."
git push personal main
git push personal --tags

echo "Publishing to NPM..."
npm publish --access public
```

**scripts/deploy-work.sh**:
```bash
#!/bin/bash
echo "Deploying to work GitHub..."
git push work main
git push work --tags

echo "Publishing to company registry..."
# Temporarily swap package.json
mv package.json package.personal.json
mv package.company.json package.json
npm publish --registry https://npm.company.com/
# Restore original
mv package.json package.company.json
mv package.personal.json package.json
```

### 3. GitHub Actions Considerations

**For Personal GitHub (.github/workflows/ci.yml)**:
- Public CI/CD
- Publish to public NPM

**For Work GitHub (create .github-enterprise/workflows/ci.yml)**:
```yaml
# Copy to .github/workflows/ when on work network
name: Internal CI

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: self-hosted  # Company runners
    steps:
    # Company-specific steps
```

## Legal Compliance Checklist

Before dual-hosting, verify:

- [ ] Employment agreement allows personal open-source projects
- [ ] No company confidential information in code
- [ ] Clear separation of work vs personal development time
- [ ] Manager/legal approval if unclear
- [ ] License compatibility (ISC is permissive)

## Maintenance Strategy

### Sync Approach
```bash
# Create sync script
#!/bin/bash

# Fetch from both
git fetch personal
git fetch work

# Check for divergence
PERSONAL_HEAD=$(git rev-parse personal/main)
WORK_HEAD=$(git rev-parse work/main)

if [ "$PERSONAL_HEAD" != "$WORK_HEAD" ]; then
    echo "⚠️ Repositories have diverged!"
    echo "Personal: $PERSONAL_HEAD"
    echo "Work: $WORK_HEAD"
else
    echo "✅ Repositories are in sync"
fi
```

### Version Management

1. **Synchronized Versions**: Keep same version numbers
2. **Independent Versions**: Use different version schemes
   - Personal: 1.0.x
   - Work: 1.0.x-company

## Security Considerations

### For Personal Repository
- No company-specific implementations
- No internal URLs or references
- Generic examples only

### For Work Repository
- Can include company-specific integrations
- Internal documentation
- Custom features for company needs

### Secrets Management
```bash
# .env.personal
NPM_TOKEN=your_personal_npm_token
GITHUB_TOKEN=your_personal_github_token

# .env.work (only accessible on VPN)
NPM_TOKEN=company_npm_token
GITHUB_TOKEN=company_github_token
```

## Recommended Approach

1. **Start with personal GitHub** (if legally permitted)
   - Build in public
   - Get community feedback
   - Establish as open-source project

2. **Import to work when stable**
   - Fork or import specific versions
   - Add company-specific features if needed
   - Use company CI/CD infrastructure

3. **Maintain single source of truth**
   - Develop primarily in one location
   - Sync/mirror to the other
   - Avoid divergent branches

## Example Workflow

```bash
# Morning (at home, no VPN)
git push personal feature-branch
# Create PR on personal GitHub

# Afternoon (at work, on VPN)
git fetch personal
git push work feature-branch
# Create PR on work GitHub

# After merge
git push personal main
git push work main
npm publish  # to public
npm publish --registry https://npm.company.com  # to company
```

## Questions to Answer First

1. **Who owns the IP?** Check employment agreement
2. **What's the company policy on open source?**
3. **Will the library contain any proprietary algorithms?**
4. **Does your team want to contribute?**
5. **Who maintains which version?**

## Final Recommendation

If legally permitted, maintain the library publicly on your personal GitHub and publish to public NPM. Then, have your company:
1. Use the public package as a dependency, OR
2. Fork it internally for company-specific modifications

This approach:
- ✅ Simplifies maintenance
- ✅ Allows community contributions
- ✅ Builds your personal portfolio
- ✅ Benefits your company
- ✅ Avoids sync issues