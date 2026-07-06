#!/bin/bash
set -e

REPO_DIR="/media/sf_X_DRIVE/DesiEroticTales"
REMOTE="https://github.com/abhiandhoney/DesiEroticTales.git"

git config --global --add safe.directory "$REPO_DIR"
cd "$REPO_DIR"

git remote set-url origin "$REMOTE"
gh auth setup-git 2>/dev/null || true

git add -A
git commit -m "fix: vboxsf npm + docs/project-history for AI handoff" || echo "Nothing new to commit"
git push -u origin main

echo "Done. Check: $REMOTE"