# 08 — Move to X_DRIVE

**When:** July 6, 2026  
**From:** `/home/troy/DesiEroticTales`  
**To:** `/media/sf_X_DRIVE/DesiEroticTales`

## Why

User requested moving the work folder to the VirtualBox shared drive (`sf_X_DRIVE`) — likely for persistence on Windows host drive.

## First attempt — FAILED

```bash
mv /home/troy/DesiEroticTales /media/sf_X_DRIVE/DesiEroticTales
```

**Error:** `vboxsf` (VirtualBox shared folder) does not support symlinks in `node_modules/.bin/`:
```
mv: cannot create symbolic link '.../node_modules/.bin/vite': Operation not permitted
```

Result: partial copy on X_DRIVE + original still at `/home/troy/`.

## Second attempt — SUCCESS

Excluded problematic directories, synced, then removed original:

```bash
rm -rf /media/sf_X_DRIVE/DesiEroticTales/node_modules
rm -rf /media/sf_X_DRIVE/DesiEroticTales/dist
rm -rf /media/sf_X_DRIVE/DesiEroticTales/.vite

rsync -a --exclude node_modules --exclude dist --exclude .vite \
  /home/troy/DesiEroticTales/ /media/sf_X_DRIVE/DesiEroticTales/

rm -rf /home/troy/DesiEroticTales
```

## What was preserved

- Full `src/` codebase
- `.git/` history (all commits)
- `supabase/` migrations
- `.env` (local, gitignored)
- `package.json`, `package-lock.json`

## What was NOT moved (must regenerate)

```bash
cd /media/sf_X_DRIVE/DesiEroticTales
npm install    # REQUIRED after every fresh clone/move
npm run build  # regenerates dist/
```

## vboxsf caveats for future agents

1. **Never `mv node_modules`** to/from shared folders — always exclude and `npm install`
2. Shared folder may be slower for `npm install`
3. File permissions show `root:vboxsf` — user `troy` is in group `vboxsf`
4. If builds fail oddly, try `npm install` on native Linux fs or use `npm config set bin-links false`