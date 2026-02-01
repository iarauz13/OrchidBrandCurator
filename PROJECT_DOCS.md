# Orchid - Project Documentation

## Philosophy
**Why Orchid?**
Named after the flower family with the largest number of variations in the world (~28,000 species). This reflects the core belief of this project: **Human variation is infinite.** Everyone has a unique way of organizing, visualizing, and curating their world. Orchid provides the architectural vault to support that individuality.

## Override Summary
**Status**: ✅ FIXED
**Issue**: The "Scrollytelling" animation was broken because the required 120+ PNG assets were missing from `public/orchid`.
**Fix**:
1.  Located assets in `public/ezgif-split`.
2.  Moved assets to `public/orchid`.
3.  Updated `clean_assets.js` to use ES Modules (`import` vs `require`).
4.  Ran `node clean_assets.js` to normalize filenames to `orchid_001.png` - `orchid_285.png`.
5.  Updated `components/LandingPage.tsx` to set `FRAME_COUNT = 285` (was 120).

## System Architecture

### Core Components
-   **Stack**: React 18.3.1, TypeScript, Tailwind CSS, GSAP (ScrollTrigger), HTML5 Canvas.
-   **`components/LandingPage.tsx`**: The main driver.
    -   **Canvas Rendering**: Efficient 2D context drawing of image frames.
    -   **GSAP ScrollTrigger**: Drives the `frames.current` value based on scroll position.
    -   **Failsafe**: If images don't load within 5 seconds (`LOADING_TIMEOUT`), it falls back to a "Midnight Silk" CSS gradient (`isFailsafe` state).

### Asset Pipeline
-   **Location**: `public/orchid/`
-   **Naming Convention**: `orchid_###.png` (e.g., `orchid_001.png`, `orchid_002.png`).
-   **`clean_assets.js`**: A Node.js utility script to normalize loose files into the strict sequence required by the app.
    -   Usage: `node clean_assets.js`
    -   Requires `type: module` in `package.json` (handled).

## Maintenance
To update the animation:
1.  Place new PNG sequence in `public/orchid`.
2.  Run `node clean_assets.js`.
3.  Update `FRAME_COUNT` in `components/LandingPage.tsx` if the number of frames changes significantly (logic automatically clamps, but correct count ensures full playback).

## Cleanup & QA Report
**Actions Taken**:
-   **Audit**: Scanned `components/` directory and cross-referenced usage with `App.tsx` and `index.tsx`.
-   **Removed Dead Code**: Deleted 7 unused component files (`FileUpload.tsx`, `FilterPanel.tsx`, `FullScreenMapView.tsx`, `MapPin.tsx`, `SelectionCounter.tsx`, `UserSetupModal.tsx`, `ErrorReportModal.tsx` - *retained ErrorBoundary.tsx*).
-   **Refactor**: Fixed multiple import warnings in `ImportModal.tsx` (consolidated static vs dynamic imports).
-   **Verification**: Successfully ran `npm run build` with zero errors or warnings (except standard chunk size warnings).

## Running Production Build
To build and run the optimized production version:
1.  **Build**: Run `npm run build`. This compiles the app into the `dist/` directory.
2.  **Preview**: Run `npm run preview`. This starts a local server hosting the production artifacts (usually on port 4173).


