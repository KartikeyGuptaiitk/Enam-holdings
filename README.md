# FINN — Investor desk

A mobile-first filter for financial filings, with a saved NSE digest, configurable
alerts and primary-source research. The committed snapshot runs without API keys.

## Run

Requires Node 22+ and Python 3.11+ only for optional ingestion.

```sh
corepack pnpm@12.16.1 install --frozen-lockfile
npm run dev
```

For a production demo:

```sh
npm run build
npm start
```

The server listens on port 3000. On your own network, open your computer's address
on a phone; PWA installation and service workers require HTTPS except on localhost.
Deployment URL: **not deployed from this cloud session**. On Vercel import the GitHub
repository, use Next.js and the build command above. The snapshot requires no secrets.
Live unknown-ticker ingestion requires Python and does not run on Vercel.

## Try it

- Today: change 24h/3d/7d/30d, filter by company/category, expand a filing, pin or mute it.
- Ask: select INFY, WIPRO or HCLTECH; compare explicit guidance to later disclosures.
  Tap a source passage; switch to Financial snapshot, Guidance or Cash quality.
- Watch: adjust thresholds, inspect the historical preview, run a check twice, reload.
  The inbox persists and duplicate replay entries are suppressed.
- Load the app online once, wait for service-worker activation, then reload Today,
  Ask and Watch offline. Saved research remains available. Original external PDFs
  and new-company ingestion require network access. First-ever offline visits cannot work.
- Triple-tap the logo for snapshot cost diagnostics. Missing tickers stay unavailable.

## Validation

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Linux production build, strict typecheck, lint and 47 unit tests passed. Chromium QA
covered 390×844 and 1440×1000 routes, source drawers, persisted/deduplicated alerts,
unknown ticker state and offline reload of all three main routes. See
[QA evidence](docs/qa/README.md), [decisions](DECISIONS.md), and [handoff](CLOUD_HANDOFF.md).
Screenshots: [Today](docs/qa/01-today-mobile.png), [Ask](docs/qa/02-ask-mobile.png),
[Watch](docs/qa/03-watch-mobile.png), [Sources](docs/qa/04-sources-mobile.png),
[Desktop](docs/qa/05-today-desktop.png).

## Data and architecture

```mermaid
flowchart LR
  NSE[NSE filings and price sources] --> PY[Python cached ingestion]
  DOC[Annual reports / transcripts / Screener] --> PY
  PY --> JSON[Committed JSON snapshots]
  JSON --> NEXT[Next.js server: schema validation and compact context]
  NEXT --> UI[Today / Ask / Watch]
  UI --> LOCAL[Local storage rules and inbox]
  UI --> SW[Service worker: routes and static assets]
```

Snapshot timestamps stay visible; the digest clock follows the latest saved filing
(1 November 2026). Math, classification, alerting and current research comparisons
run deterministically. Every research source opens its exact saved passage. Derived
EBITDA uses PBT + interest + depreciation - other income; rounded inputs and exceptional
items limit comparison. PAT may include non-controlling interests. See the three-filing
manual reconciliation in DECISIONS.md; full reconciliation is not claimed.

Raw source data is retained under data/. Compact retrieved pages feed the initial UI;
this still produces a large HTML payload and should be split before wider rollout.

## Optional refresh and providers

```sh
python -m venv /workspace/finn-venv
/workspace/finn-venv/bin/pip install -r pipeline/requirements.txt
/workspace/finn-venv/bin/python pipeline/refresh_all.py
./node_modules/.bin/tsx pipeline/precompute.ts
```

Refresh can change committed snapshots: inspect the diff. Downloads reuse content-hash
caches; FORCE_REFRESH=1 refetches. Sources may return 403 or be unavailable. In cloud,
allow required upstream hosts in environment settings before refreshing. Do not disable
TLS or invent missing data. Set PYTHON_BIN to the venv Python for local API ingestion.

.env.example lists optional LLM_PROVIDER, LLM_API_KEY, LLM_CHEAP_MODEL and
LLM_STRONG_MODEL. Keep keys out of Git. Gemini is the adapter default; Groq,
OpenRouter, Anthropic and OpenAI adapters are present. Routing intends cheap extraction
and strong cross-document reasoning; arithmetic never uses a model. Adapters and live
provider cost tracking are not integrated into this deterministic demo. Measured demo
model spend: $0, zero model tokens, not a forecast of refresh costs.

No BSE fallback, management biography enrichment, web push, account sync, advanced pull
modules or live scheduler is implemented. Promise scoring is a limited statement-based
heuristic, not a judgment of management. Deployment requires the owner's Vercel access;
attach your Codex chat export manually if required for submission.
