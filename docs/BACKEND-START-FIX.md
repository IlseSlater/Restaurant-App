# Backend won't start – fix (lodash)

## What was wrong
- `npm run start:dev` runs the Nest CLI, which loads **lodash** (via node-emoji).
- The copy of **lodash** in the repo root was **incomplete** (missing many internal files), so Node threw `Cannot find module './_Symbol'` or `'./isArrayLike'`, etc., and the backend never started.

## What was done
1. The broken **lodash** folder at the repo root was **removed** so it can be replaced with a full install.
2. In this environment, `npm install` could not run (cache/network), so you need to run the install **locally**.

## What you need to do (in your terminal)

From the **project root** (`c:\Restaurant App`), run:

```bash
npm install
```

Then start the backend:

```bash
cd backend
npm run start:dev
```

If `npm run start:dev` still fails with a lodash “Cannot find module” error, run a **full lodash reinstall** from the project root:

```bash
node scripts/fix-lodash.js
```

Then again:

```bash
cd backend
npm run start:dev
```

## Alternative: run without Nest CLI (no watch)
If you only need the API and already have a built `dist`:

```bash
cd backend
npm run start:run
```

This runs `node dist/src/main.js` and does not use the Nest CLI or lodash.
