# 日本旅记 · 2026 秋

Mobile-first Japan travel PWA at https://mayu0701.github.io/nkfuen/.

## Final source

The sole itinerary source is `空白模板_V2(3)(2).xlsx` (SHA-256 in `build_report.json`). The user confirmed that branches are cancelled and blank fields are intentional. No older itinerary content is substituted.

- 2026-11-20 through 2026-11-29, 10 days
- 106 source itinerary rows, 86 cards after grouping 20 image-only continuation rows
- 36 shopping items
- 81 original embedded images: 52 itinerary, 29 shopping
- Sample rows and the template instructions are excluded
- Dates on rows 24, 88 and 106–108 continue the preceding date
- All priorities, budget wording, notes, approximate times and source Maps URLs are preserved
- Empty fields stay empty; missing links and images are allowed

`data.json` is the readable parsed source; `data.js` is its browser bundle. `sourceRows` allows auditing grouped pictures against Excel. Previews are WebP; saving uses the untouched original image. Existing identical image blobs are reused.

## Features

Daily navigation, persistent completion and shopping checkboxes, Maps links, searchable product categories and budgets, accessible image dialog with zoom/pan, original image download, and native file sharing when supported. iPhone users can use the share sheet's Save Image action or long-press an image. No branch selection is present.

Progress uses `nkfuen.final.progress.v2` in localStorage, stable content IDs and timestamped records for cross-tab merging. Backups can be exported/imported from Travel Tools. Only exact verified old item matches are migrated; old localStorage keys are preserved. Unmatched old item progress is intentionally not applied to different items. Browser storage is device-specific and may be cleared by the browser; export backups before changing browsers/devices.

The service worker caches the shell and viewed images. Travel Tools can download all preview images for offline use. Original images require a first online load and are cached on access. Cache preparation reports progress and failures. Storage failures produce a visible backup reminder. No third-party fonts, scripts or analytics.

## Deployment

GitHub Pages serves the repository root on `main`. Keep the same repository and Pages configuration to preserve the public URL. The release commit is a child of the current `main` commit, without history rewriting. The application uses relative URLs under `/nkfuen/`.

Version: `2026.11.final.1`. On subsequent content/code updates, increment this string in the app data, index asset URLs and service worker. The previous `nkfuen-v1` cache is removed on worker activation. The browser may need one reload after the new worker activates.
