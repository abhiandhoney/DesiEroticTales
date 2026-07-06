#!/bin/bash
cd /media/sf_X_DRIVE/DesiEroticTales

git config --global --add safe.directory "$(pwd)"
git remote set-url origin https://github.com/abhiandhoney/DesiEroticTales.git
gh auth setup-git

git add -A
git commit -m "initial push: DesiEroticTales full app" || true
git branch -M main
git push -u origin main --force

echo "DONE"