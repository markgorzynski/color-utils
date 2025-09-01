# GitHub Pages Setup Instructions

To fix the 404 error for the documentation at https://markgorzynski.github.io/color-utils/:

## Steps to Enable GitHub Pages

1. Go to https://github.com/markgorzynski/color-utils/settings/pages

2. Under "Source", select:
   - **Source**: Deploy from a branch
   - **Branch**: main
   - **Folder**: /docs

3. Click "Save"

4. Wait 2-5 minutes for GitHub to build and deploy the site

5. Visit https://markgorzynski.github.io/color-utils/ to verify

## Documentation Structure

The `/docs` folder contains:
- `index.html` - Main documentation page with links
- `API.html` - Markdown-converted API documentation  
- `api/` - JSDoc generated documentation
- `aoklab-guide.md` - Adaptive Oklab guide
- `.nojekyll` - Prevents Jekyll processing (already added)

## Troubleshooting

If the site still shows 404 after enabling:
1. Check that the `/docs` folder exists in the main branch
2. Verify `.nojekyll` file is present in `/docs`
3. Check GitHub Actions tab for any build errors
4. Try a hard refresh (Ctrl+Shift+R) on the documentation page

## Alternative: Using gh-pages Branch

If serving from `/docs` doesn't work, you can create a gh-pages branch:

```bash
# Create orphan gh-pages branch
git checkout --orphan gh-pages

# Remove all files
git rm -rf .

# Copy docs content
cp -r ../color-utils/docs/* .
cp ../color-utils/docs/.nojekyll .

# Commit and push
git add .
git commit -m "Deploy documentation"
git push origin gh-pages

# Return to main branch
git checkout main
```

Then in GitHub Pages settings, select source as "gh-pages" branch.