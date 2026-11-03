# Production QA — 3 November 2026

Run from the repository root after `npm run build` and `npm start`:

```sh
node docs/qa/run.cjs
```

Requires installed Playwright dependencies and system Chromium at /usr/bin/chromium.
The script overwrites the five PNGs and results.json. It uses a fresh browser context.
On other systems change the executable path to the installed Chromium location.

Final run passed: six mobile routes at 390×844, four desktop routes at 1440×1000,
no horizontal overflow, unknown-ticker unavailable state, source drawer,
alert threshold persistence, four inbox items and replay deduplication, and offline
navigation/reload of /, /ask and /watch after service-worker activation.
No page errors, console errors or HTTP 4xx/5xx responses occurred in the final run.
The first run found a missing favicon; metadata now points at existing PWA icons.
All five screenshots were inspected: cards/tables fit, controls and navigation remain
usable, and source passages are legible. Full-page images include fixed navigation
at the viewport boundary; this is expected screenshot behavior.

This is smoke coverage, not exhaustive accessibility or financial correctness QA.
Browser offline mode demonstrates cached route HTML and JavaScript; external PDFs,
first-ever offline visits, uncached research API calls and live refresh are not supported.
Unknown ticker UI was checked without invoking an upstream ingestion job. Unseen
WIPRO/HCLTECH saved research is covered by unit tests and route rendering; fresh live
ingestion in this cloud environment is unverified. Python dependency imports passed.
Live providers and Vercel deployment were not exercised.

The initial production HTML measured 3,807,991 uncompressed bytes. Shared client JS
is 169 kB per the Next build report; these are different measurements. The HTML carries
compact research for offline use. Split this payload before wider rollout; do not
mistake the small route-code size for the total transfer size. Three route HTML caches
also duplicate snapshot data. No cache-size optimization was attempted in this phase.

A tracked-file secret-pattern scan found no matching AWS access IDs, GitHub token
patterns, OpenAI-style tokens or private-key headers. This is a bounded scan, not an
assertion that every possible secret format is absent.
