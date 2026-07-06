#!/bin/bash
set -e
cd "$(dirname "$0")"
git config --global --add safe.directory "$(pwd)"
npm install
npm run build
git add -A
git commit -m "feat: admin review modal, dropdown filters, UX improvements" || echo "Nothing new to commit"
git push origin main
echo "Done."