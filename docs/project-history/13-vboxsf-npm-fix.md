# 13 — VirtualBox Shared Folder npm Fix

## Problem

Project lives on `/media/sf_X_DRIVE/DesiEroticTales` (VirtualBox `vboxsf` mount).

`npm install` fails with:
```
EPERM: operation not permitted, symlink '../nanoid/bin/nanoid.cjs' -> '.../node_modules/.bin/nanoid'
```

**Cause:** `vboxsf` does not support Unix symlinks. npm creates symlinks in `node_modules/.bin/` by default.

## Fix applied

### 1. `.npmrc` in project root
```
bin-links=false
```

### 2. `package.json` scripts updated

Scripts call binaries directly (no `.bin` symlinks needed):

```json
"dev": "node ./node_modules/vite/bin/vite.js",
"build": "node ./node_modules/typescript/bin/tsc -b && node ./node_modules/vite/bin/vite.js build",
"lint": "node ./node_modules/oxlint/bin/oxlint",
"preview": "node ./node_modules/vite/bin/vite.js preview"
```

## Install commands (run in order)

```bash
cd /media/sf_X_DRIVE/DesiEroticTales

# Kill anything holding node_modules files
pkill -f vite 2>/dev/null

# Remove broken partial install
rm -rf node_modules

# Fresh install (bin-links disabled via .npmrc)
npm install
```

## If install still fails (ETXTBSY)

File busy — close VS Code/Cursor file watchers on that folder, then:

```bash
rm -rf node_modules
sleep 2
npm install
```

## Alternative: node_modules on native Linux fs

If problems persist, keep source on X_DRIVE but install deps locally:

```bash
# Option B — symlink node_modules from home (native ext4 supports symlinks FROM home TO vboxsf may still fail)

# Option C — clone/work from native path instead:
cd /home/troy
git clone https://github.com/abhiandhoney/DesiEroticTales.git
cd DesiEroticTales
npm install
npm run dev
```

Use X_DRIVE for backup/sync only; develop from `/home/troy/DesiEroticTales` for best npm compatibility.

## Verify after install

```bash
npm run build
npm run dev
```