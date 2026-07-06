#!/bin/bash
set -e

REPO_DIR="/media/sf_X_DRIVE/DesiEroticTales"
REMOTE="https://github.com/abhiandhoney/DesiEroticTales.git"

git config --global --add safe.directory "$REPO_DIR"
cd "$REPO_DIR"

git remote set-url origin "$REMOTE"
gh auth setup-git 2>/dev/null || true

git add -A
git commit -m "chore: add CNAME for custom domain" || echo "Nothing new to commit"

# Remote has unrelated history (placeholder index.html + CNAME from GitHub UI).
# Local has the full app — force push replaces remote safely.
git push --force-with-lease origin main

echo "Pushed to $REMOTE"