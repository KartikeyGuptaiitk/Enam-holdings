# Continue FINN in Codex Cloud

Repository: https://github.com/KartikeyGuptaiitk/Enam-holdings

Read MISSION.md, DECISIONS.md and BUILD_LOG.md before continuing. The user wants subsequent development in a GitHub-backed cloud environment, not on their local Windows computer.

## Current state
- Next.js 15 App Router, React, TypeScript (strict), Tailwind, Framer Motion and Zod.
- Today: real saved NSE filings for 18 holdings, deterministic classification and materiality scoring, filters, pins, mute and original sources.
- Watch: persisted rules, threshold previews, replay, deduplicated inbox and unread state.
- Ask: source-linked financial tables, derived EBITDA, guidance extraction, cash conversion and deterministic numeric promises-versus-delivery comparisons for INFY, WIPRO and HCLTECH.
- Python ingestion supports arbitrary valid NSE symbols, cached Screener resolution, PDF extraction and BM25 retrieval. Missing sources remain unavailable. Some IR PDFs return 403.
- Real price, announcement, document and analysis snapshots are committed. No API key is needed for the saved demo.
- Existing Flask prototype is preserved; the primary application is Next.js.

## Cloud setup
Use Node 22+ and Python 3.11+. Enable package-manager networking during setup.

```sh
npm install
python -m pip install -r pipeline/requirements.txt
npx playwright install --with-deps chromium
npm run dev
```

For production: `npm run build && npm start`.
Optional refresh: `python pipeline/refresh_all.py`, then `npx tsx pipeline/precompute.ts`. HTTP downloads reuse their content cache; set FORCE_REFRESH=1 to refetch. Model adapters exist, but the UI demo uses deterministic analysis and has not exercised live providers.

## Verified so far
47 TypeScript unit tests passed, covering 40 real NSE filing examples, scoring, arithmetic, alert rules, source refs and unseen-ticker snapshots. Strict typecheck and ESLint passed before the final small configuration changes. An earlier 390x844 browser smoke check had no horizontal overflow; that was development-only and is not final QA.

## Required next work
1. Run a clean Linux production build, typecheck, lint and unit tests. Windows standalone-output packaging failed due to symlink permissions; `output: standalone` has now been removed. That final build has not been verified.
2. Start the production app; test all routes at 390x844 and desktop. Produce and inspect five screenshots. Verify console errors, alert persistence, source drawers, unknown tickers and offline reload. The updated service worker precaches route HTML and linked Next static assets; its final offline behaviour is unverified.
3. Review promise extraction and period/scope alignment carefully. Annual revenue uses CC disclosures; quarterly guidance uses sequential CC. Avoid substituting a segment metric for consolidated actuals. Current rules deliberately skip ambiguous multi-metric guidance. Credibility is a limited statement-based heuristic, not a broad judgement of management.
4. Record manual results reconciliation in DECISIONS.md. Cached original filing passages: INFY, TCS, PERSISTENT. Persistent statutory consolidated figures are on PDF page 19, in INR million: revenue 46639.04, PBT 4536.84, finance costs 375.69, depreciation 1666.73, other income 244.45, PAT 3515.14. Convert /10 to INR crore. EBITDA from precise inputs is 633.481 crore; rounded Screener inputs derive 635, so disclose rounding uncertainty. Do not claim full reconciliation.
5. Complete README.md, WRITEUP.md (~400 words), DECISIONS.md and BUILD_LOG.md; describe omissions honestly. BSE fallback, management biography enrichment, full LLM orchestration, push notifications and advanced pull modules are not implemented.
6. Review payload size and caching. Raw source documents and full research stay in data; initial UI uses compact retrieved pages. Live unknown-company ingestion requires Python and is intentionally unavailable on Vercel; refresh snapshots in a build/CI job for deployment.
7. Scan for secrets, keep main runnable, commit each phase, and deploy to Vercel when account access is available. No Vercel authentication was configured locally.

Never report this build as finished until production, offline and visual QA pass. Preserve the original mission's financial grounding requirements.

## GitHub import
Source and extracted offline snapshots were imported from local commit 548c404. Re-downloadable data/cache/http responses and generated TypeScript build metadata were excluded. Local phase history remains on the original machine; this repository starts with a snapshot import. Continue work in the cloud.
