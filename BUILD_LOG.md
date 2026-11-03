# Build log
Phase 1: Inspected the existing Flask prototype and preserved it. Added a separate Next.js shell. Existing briefing snapshot remains provenance-labelled; no synthetic market history.
Phase 2: Added deterministic classification and persistent HTTP caching; started fetching real EOD data, NSE filings, Screener tables, and source PDF pages.
Phase 3: Digest now renders real saved NSE disclosures, materiality tiers, portfolio moves, window and category filters, pins, mute, and original filing links.
Phase 4: Persisted announcement and unusual-move rules, live historical preview, replay button, deduplicated inbox, unread state, and alert-to-digest navigation.
Phase 5: Results tables cover all 18 holdings with code-computed changes. Original INFY, TCS and PERSISTENT filings cached for reconciliation; HDFC Bank retirement card extracts primary disclosure facts without external biography.
Phase 6: Added exact-passage research, schema-validated numbers-versus-narrative comparisons for INFY, WIPRO, HCLTECH, financial snapshot, explicit guidance and annual cash quality. General BM25 ingestion persists targeted contexts. No LLM calls needed for the demo.
Cloud handoff: User requested GitHub-backed cloud development. Prepared repository transfer, original mission and explicit outstanding verification notes. Local work stops after transfer.

Cloud validation phase (3 November 2026): Installed frozen pnpm dependencies and Python
venv outside the checkout. Clean Linux production build, strict typecheck, lint and all
47 unit tests passed. Initial sandbox IPC restrictions required running the normal test
runner with local socket permission; a loader-only run reporting one file was not counted
as the 47-test result. System Chromium avoided an unnecessary blocked browser download.
Production browser smoke checks passed mobile/desktop, citations, alert persistence and
deduplication, unknown-ticker states and offline main-route reload. Fixed the missing
favicon by declaring existing PWA icons, rebuilt, restarted and reran QA with zero errors.
Inspected five screenshots. Manual reconciliation records three latest-quarter filings,
PAT scope differences and Persistent rounding uncertainty; no full verification claim.
Measured initial HTML at 3.81 MB uncompressed and recorded payload/cache limitations.
Completed README, ~400-word writeup, decisions and reproducible QA evidence. Saved cloud
install_script/start_skill draft; user publication remains separate. GitHub read access
works without new credentials. Vercel access is absent, so deployment was not attempted.
No live refresh was run or source snapshots altered. Bounded secret-pattern scan passed.
