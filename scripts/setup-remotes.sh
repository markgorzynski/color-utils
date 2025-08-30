#!/bin/bash

# Setup script for dual repository management
# Run this once to configure your remotes

echo "🎨 Color Utils - Remote Repository Setup"
echo "========================================"
echo ""

# Personal GitHub (primary)
echo "Setting up personal GitHub remote..."
git remote add origin https://github.com/YOUR_USERNAME/color-utils.git
git remote add personal https://github.com/YOUR_USERNAME/color-utils.git

# Work GitHub (secondary - only when on VPN)
echo "Setting up work GitHub remote..."
echo "Note: Replace COMPANY_GITHUB with your company's GitHub Enterprise URL"
# git remote add work https://github-enterprise.COMPANY.com/TEAM/color-utils.git

echo ""
echo "Current remotes:"
git remote -v

echo ""
echo "📝 Next steps:"
echo "1. Edit this script to add your actual GitHub URLs"
echo "2. Run: git push personal main"
echo "3. When on VPN: git push work main"
echo ""
echo "To publish to NPM:"
echo "  npm publish --access public"