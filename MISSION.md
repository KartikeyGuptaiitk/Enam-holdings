# MISSION

Build **FINN**, a mobile-first financial investment agent, end to end, in this repository. This is a take-home build challenge from ENAM Holdings (a public-markets investment firm). It is graded on product sense, creativity, judgment, architecture, and how the build was done. It is NOT graded on completeness or polish.

**Hard deadline: today.** Work autonomously. Do not ask me questions. Decide, record the decision in `DECISIONS.md`, and keep moving. A deployed, running thin slice beats a broad broken app. A demo that does not run is the worst outcome. Commit after every phase and keep `main` runnable at all times.

Report back only once, at the end (see section 14).

---

# 1. THE PROBLEM (verbatim intent)

An investor is drowning in prices, filings, announcements, results, macro. Most of it does not matter. The scarce skill is **filtering**: surface the few things that matter, bury the rest, beautifully. FINN should become part of a daily investor's workflow, something they reach for several times a day that saves time and shows only what's important.

Two interaction modes:
- **Push**: FINN proactively tells you what changed and why you should care.
- **Pull**: you ask FINN to research or analyse a company on demand.

The backend data is guided. **The frontend (product, interaction model, design) is deliberately ours, and is where the evaluators most want to see a point of view.** Experiment with the interaction model; avoid the obvious "dashboard of tables".

Quality bar: **no AI slop**. Concise, dense, interactive, beautifully presented. It should feel like a product someone thought hard about, not a model filling a template.

---

# 2. NON-NEGOTIABLE RULES

1. **Mobile-first.** Primary viewport 390x844. Must also be usable on desktop. No horizontal scroll, tap targets >= 44px, safe-area insets, installable PWA.
2. **Always demoable offline.** External scraping (NSE, BSE, screener.in, Yahoo) is flaky. Commit a pre-fetched snapshot under `data/` so the deployed app works with zero network access and zero API keys. Live refresh is a bonus, never a dependency.
3. **Pull side uses PRIMARY SOURCES ONLY**: annual reports + concall transcripts (and standardised financials from screener.in, which the brief names as the source of "standardised multi-year financials"). **No news, broker notes, research reports, and no reliance on the LLM's own memory of the company.** Prompts must say "answer only from the provided context; cite doc + page; otherwise output `not_disclosed`". Every number and claim on a pull card carries a tappable citation to the source passage.
4. **Push-side enrichment may use outside info** (e.g. a person's professional background). Label it as unverified with a source.
5. **The research engine must generalise to ANY NSE ticker** where data exists. Nothing hard-coded per company. The evaluators may test a ticker we did not pick. Missing data produces an honest "not available" state, never a crash.
6. **Efficiency earns bonus points.** Route models by task difficulty, cache aggressively, chunk smartly, prefer deterministic code over LLM calls. Show a cost/tokens debug panel.
7. **Free tiers only.** Provider-pluggable LLM via env vars. No secrets in git. Provide `.env.example`.
8. Pull-side reasoning outputs must be **schema-validated structured JSON**, rendered as visual cards (tables, deltas, verdict chips, sparklines), not walls of prose.

---

# 3. TECH STACK (decided; do not deliberate)

- **App:** Next.js 14+ App Router, TypeScript, Tailwind CSS, PWA manifest + service worker (offline shell), deployed on Vercel. Charts as hand-rolled SVG sparklines/bars plus a light lib only if needed (`recharts`/`visx`). `framer-motion` for transitions. `zod` for schemas.
- **Pipeline:** Python 3.11 scripts in `pipeline/` (`yfinance`, `requests`, `beautifulsoup4`, `pdfplumber` or `PyMuPDF`, `rank_bm25` or a small embedding model, `pydantic`). Output goes to `data/` as JSON files and/or a SQLite file read by the Next.js server code.
- **LLM layer:** one `llm` interface (TS and Python) with providers: Gemini (free tier; default), Groq/OpenRouter free models, Anthropic/OpenAI optional. Selected by `LLM_PROVIDER`, `LLM_CHEAP_MODEL`, `LLM_STRONG_MODEL` env vars. All calls go through a content-hash cache (`data/cache/llm/<sha256>.json`).
- If an LLM key is missing, the app serves precomputed outputs from `data/` and shows a subtle "demo data" badge. It must never break.

---

# 4. REPO STRUCTURE

```
/app                      Next.js routes (today, ask, watch, company/[ticker], api/*)
/components               UI (cards, sheets, charts, nav, skeletons)
/lib                      llm.ts, scoring.ts, classify.ts, alerts.ts, schemas.ts, cost.ts
/pipeline
  fetch_prices.py         yfinance EOD -> data/prices/<TICKER>.json
  fetch_announcements.py  NSE/BSE -> data/announcements/<TICKER>.json
  classify.py             rules first, cheap LLM for ambiguous
  resolve_screener.py     ticker -> screener.in URL, doc links (ARs, concalls)
  ingest_docs.py          download PDFs, extract text per page, chunk, index
  extract_results.py      results filing -> Rev/EBITDA/PBT/PAT (+ screener fallback)
  analyse.py              runs pull modules per ticker -> data/analysis/<TICKER>/<module>.json
  refresh_all.py          orchestrates everything with caching + retries
/config
  portfolio.json          18 companies (weights, sectors)
  adhoc.json              demo research set
  models.json             routing table with rationale
  categories.json         announcement taxonomy + priority weights
/data                     committed snapshot (prices, announcements, docs index, analysis, cache)
/tests                    classifier, scoring, results math, alert engine
README.md  DECISIONS.md  WRITEUP.md  BUILD_LOG.md  .env.example
```

---

# 5. DATA LAYER

## 5.1 Portfolio and demo set
`config/portfolio.json`: 18 NSE-listed companies, mixed sectors and caps, each with `ticker`, `name`, `sector`, `weight_pct` (sums to 100). Suggested (verify each resolves on yfinance with `.NS`; replace any that fail, and avoid recently renamed/demerged tickers):
RELIANCE, HDFCBANK, ICICIBANK, SBIN, TCS, INFY, PERSISTENT, SUNPHARMA, MARUTI, HINDUNILVR, ITC, LT, BAJFINANCE, TITAN, ASIANPAINT, POLYCAB, DIXON, CDSL.

`config/adhoc.json`: 4 tickers for the pull demo, at least two NOT in the portfolio (e.g. PIDILITIND, TRENT, APOLLOHOSP, DEEPAKNTR). Also pick one extra "unseen" ticker and use it in the generalisation test in phase 7.

## 5.2 Prices (EOD)
`yfinance` history for ~90 trading days, `.NS` suffix, fallback `.BO`. Store `date, open, high, low, close, volume`. Derive `pct_change`, `vol_avg_20d`, `vol_ratio`. Handle splits/bonuses (use auto-adjusted close for % moves).

## 5.3 Announcements
- **NSE**: `https://www.nseindia.com/api/corporate-announcements?index=equities&symbol=<SYM>&from_date=DD-MM-YYYY&to_date=DD-MM-YYYY`. Requires browser-like headers and a cookie obtained by first GETting `https://www.nseindia.com`. Use a `requests.Session`, UA string, `Referer`, retries with backoff, politeness delay. Fields typically include `desc`, `attchmntText`, `attchmntFile`, `an_dt`/`sort_date`, `symbol`.
- **BSE**: fallback via the BSE announcements API (find the current endpoint; it needs BSE scrip codes, resolvable from the symbol). Use it only if NSE fails.
- Normalise to `{id, ticker, ts_iso, headline, body, attachment_url, source, category, subcategory?}`.
- Fetch the last 30 days per ticker; snapshot it. Note in DECISIONS.md what the snapshot "as of" date is, and make the UI's default window relative to the snapshot's latest timestamp when the live clock is far ahead (so the demo is never empty). Show "as of" clearly.

## 5.4 Fundamentals
- Resolve screener.in page: `https://www.screener.in/company/<TICKER>/consolidated/` (fallback to standalone). Parse the **Documents** section for Annual Report links (last 3-5 years) and **Concall** links (Transcript, PPT, Notes; last 6-8 quarters), and parse the quarterly results table, P&L, balance sheet, cash flow tables (standardised multi-year financials).
- Download PDFs, extract text per page with page numbers, store chunks as `{doc_id, doc_type, period, page, text}`; build a BM25 (or small embedding) index per company; cache on disk keyed by URL hash.
- Be polite to screener (delay, cache, no login). If blocked, fall back to company IR links found in announcements, else mark data unavailable.

---

# 6. ANNOUNCEMENT CLASSIFICATION

Taxonomy (`config/categories.json`; adapt if you want, document why):

`results, M&A, fund_raise, management_change, litigation, insider_trading, earnings_call, investor_meetings, credit_rating, dividend, bonus_split, capex, press_release, postal_ballot, agm_egm, pledging, unclassified`

Definitions: results (quarterly/annual results, board meeting approving them, decks, shareholder letters); M&A (acquisition, merger, demerger, JV, investing in/selling stake in subsidiary); fund_raise (rights, QIP, preferential, buyback, commercial paper/debt); management_change (CEO/CFO/MD/director joins/resigns/retires); litigation (lawsuits, regulatory orders, fines, insolvency); insider_trading (promoter/insider personal buy/sell); earnings_call (notice, transcript, recording); investor_meetings; credit_rating; dividend; bonus_split; capex; press_release (order wins, products, partnerships, rumour clarifications); postal_ballot; agm_egm; pledging; unclassified (ESOP allotments, compliance certificates, ESG, auditor appointments).

Approach: **keyword/regex rules first (cheap, deterministic, tested)**, cheap LLM only for rows the rules leave as `unclassified` or ambiguous, batched in one call per ~30 rows. Cache by announcement hash. Unit-test the rules on at least 40 real headlines.

## Priority score (0-100), in `lib/scoring.ts`
`score = base_category_weight x portfolio_weight_boost x recency_decay x market_reaction_boost`
- Base weights: results 90, M&A 85, management_change (CEO/CFO/MD 85, other director 45), litigation 75, fund_raise 70, credit_rating (downgrade 80, upgrade/reaffirm 40), pledging 70, insider_trading 55, guidance-bearing press_release 60, capex 55, dividend 50, bonus_split 45, earnings_call 35, investor_meetings 20, press_release 30, agm_egm 15, postal_ballot 15, unclassified 5.
- `portfolio_weight_boost`: 1.0 + weight_pct/20 (cap 1.5).
- `recency_decay`: exponential, half-life 24h within the chosen window.
- `market_reaction_boost`: +10 to +25 if that day's |price move| or volume ratio is unusual.
Tiers: **Must-see (>=70)**, **Worth a look (40-69)**, **Routine (<40, collapsed behind "N routine filings")**.

---

# 7. PUSH EXPERIENCE ("Today" tab)

## 7.1 Windowed digest
- Window picker (segmented control: 24h / 3d / 7d / 30d + custom range sheet). Default 24h relative to the latest data timestamp.
- Header strip: "N filings, M need you" plus portfolio mini-summary (green/red tickers, any unusual movers).
- Feed grouped by tier. Must-see cards first, full-width; Worth-a-look as compact cards; Routine collapsed into one expandable row. Filters by category chips and by company. Pull-to-refresh. Swipe actions: mute this category for this company, pin, "ask FINN about this" (opens the Ask tab with context).
- Every card: company, time ago, category chip, **one-line "why it matters"** (LLM-written, cheap model, <=18 words, grounded only in the filing text), link to the original filing, and expand-for-detail.

## 7.2 Rich card types (judgment is the point; document rules per type in DECISIONS.md)
- **results**: a compact table: Revenue, EBITDA, PBT, PAT; columns Current Q, Prev Q, same Q last year; QoQ% and YoY% deltas (green/red), EBITDA margin and change in bps, tiny sparkline of last 8 quarters. Extraction strategy: (a) deterministic from screener's quarterly table (Sales, Operating Profit, Profit before tax, Net Profit) when the quarter is present, (b) LLM extraction from the results filing PDF/text for the freshest quarter, with a cross-check against (a) where both exist, and an `extraction_confidence` flag shown in the UI ("verified against screener" / "from filing, unverified"). Include a plain-English one-line takeaway (e.g. "Margin up 140 bps YoY, PAT +22%; revenue growth slowing"). Math done in code, never by the LLM. Handle "EBITDA" absent in filings by computing from PBT + interest + depreciation - other income, and label it derived.
- **management_change**: extract person, role, effective date, reason, incoming vs outgoing from the filing. Then enrich the incoming person with a short bio (prior employers, tenure, notable roles) via web search / search API / search-grounded LLM as best effort (LinkedIn itself is login-walled, so do not scrape it behind a login). Show a "Who is this?" mini-profile with 2-3 facts and source links, tagged "unverified background". If enrichment fails, show the extracted facts only.
- **litigation / fund_raise / M&A / credit_rating / pledging / dividend**: structured one-liner extraction (e.g. rating: agency, instrument, old -> new rating, outlook; dividend: Rs/share, record date, yield on last close; fund_raise: instrument, size, price; pledging: % of promoter holding pledged, change).
- **insider_trading, earnings_call, investor_meetings, agm_egm, postal_ballot, unclassified**: filing surfaced at low priority with no LLM spend except where a record date/time matters (e.g. earnings call date shown as a calendar chip).

## 7.3 Triggered alerts ("Watch" tab + inbox)
Configurable, persisted rules (localStorage plus optional server persistence):
- **Announcement rule**: categories to care about (multi-select), optional per-company scope, optional minimum priority.
- **Unusual move rule**: `volume_ratio >= N` (default 2.0x vs 20-day average) and/or `abs(day_change_pct) >= X%` (default 4%), per-portfolio or per-company overrides.
- UI: sliders/steppers with **live preview**: "With these settings, 7 alerts would have fired in the last 30 days" with the list. Alert inbox with unread state, grouping, and deep links to the cards.
- A "Run check now" / "Simulate next EOD" button replays the engine over the latest snapshot so evaluators can see an alert fire. Web Push is optional bonus; do in-app first.

---

# 8. PULL EXPERIENCE ("Ask" tab + company page)

## 8.1 Interaction model
Ask is a **copilot with rich result cards**, not a text chat. The input accepts a ticker or company name plus an optional question. Quick-action chips: "Numbers vs narrative", "Financial snapshot", "Cash quality", "Guidance", "Bull vs bear". Results stream in as cards that appear module by module with progress states ("Reading 3 annual reports...", "Searching 6 transcripts..."). Free-text questions are routed (cheap model) to the right module(s) or answered via grounded RAG with citations. Every card has a **Sources** drawer (doc, period, page, the exact passage). Conversation is persisted per company; follow-ups ("why did margins fall?") reuse the cached index and prior cards as context.

## 8.2 Modules (build in this priority; cut from the bottom if time is short)
1. **Numbers vs narrative (flagship, make it excellent).** For the last 4 quarters: from the earlier concall(s) extract management's explicit **forward statements** (growth %, margin targets, capex, order book, launches, deleveraging, etc.) as structured items `{statement, metric, target, timeframe, source_doc, page}`. Then, from later results/transcripts and standardised financials, find the **actual delivered** value for the same metric and period (compute in code whenever numeric). Output a "promised vs delivered" table: item, promised, delivered, gap, verdict (`met | partially | missed | unclear | not_yet_due`), one-line evidence, citations. Add a top-line "credibility score" computed from verdicts (e.g. met=1, partial=0.5, missed=0, ignore unclear/not_yet_due) and a trend across quarters. Tone changes (more hedging language quarter over quarter) as a small secondary signal, only if grounded in quoted text.
2. **Financial snapshot**: Revenue, EBITDA margin, PAT, EPS, ROCE/ROE, D/E, P/E where derivable from standardised financials (not market data from outside unless it's the price file); small multiples with trend arrows.
3. **Guidance**: explicit headline guidance by metric with source and date, and whether it was revised up/down vs the previous call.
4. **Cash quality**: CFO vs PAT (cash conversion %), FCF, 5-year trend chart, red-flag callouts (profit up while CFO flat/negative, receivable days up).
5. **Trajectory**: 5-10 year revenue/EBITDA/PAT CAGR and margin lines; what is growing vs compressing by segment where disclosed.
6. **Business snapshot**: what the company does, segments, revenue mix (donut or stacked bar) from the annual report.
7. **Balance sheet**: debt, D/E, interest cover, working-capital days trend, contingent liabilities, related-party transactions, auditor qualifications / emphasis of matter (from the AR notes and auditor report).
8. **Bull vs bear**: three crisp points each way, each tied to a cited fact from the modules above.

Pipeline per company: resolve -> ingest -> index -> per-module **targeted retrieval** (BM25/embedding top-k chunks with metadata filters) -> structured extraction (cheap model) -> reasoning/verdicts (strong model only for modules 1, 3 and 8) -> numeric verification in code -> schema validation (retry once on failure) -> cache. Pre-compute the demo/adhoc tickers; compute others on demand with a progress UI and graceful partial results.

## 8.3 Grounding prompt template (use for every pull LLM call)
```
You are a careful financial analyst. Use ONLY the CONTEXT below, which consists of
excerpts from the company's annual reports and earnings-call transcripts, each tagged
[doc_id | period | page]. Do not use any outside knowledge about the company. If a fact
is not in the CONTEXT, output "not_disclosed". Every claim must include source refs
(doc_id, page) and a short supporting quote (<= 25 words). Output strictly valid JSON
matching the provided schema. Do not do arithmetic: copy numbers verbatim with units,
the code will compute ratios.
```

---

# 9. MODEL ROUTING (`config/models.json`, with written rationale in DECISIONS.md)

| Task | Model tier | Why |
|---|---|---|
| Announcement classification of leftovers, one-line summaries | cheap/fast (Gemini Flash-class or small open model) | high volume, low reasoning |
| Result-number extraction, forward-statement extraction, field extraction | cheap with schema + deterministic cross-check | extraction, verified by code |
| Query routing in Ask | cheap | tiny prompt |
| Promised-vs-delivered verdicts, guidance revisions, bull/bear | strong | multi-document reasoning |
| Everything numeric (QoQ/YoY, margins, CAGR, cash conversion, credibility score) | **no LLM, plain code** | accuracy and cost |

Cache LLM outputs by hash of (model, prompt, context). Batch small items. Track tokens and estimated cost per run in `lib/cost.ts`; expose via a hidden debug panel (triple-tap on the logo) and summarise in README ("full demo precompute cost: ~$X on free tier").

---

# 10. DESIGN DIRECTION

- Pick one distinctive identity and commit: e.g. an editorial "terminal meets newspaper" look; strong typographic hierarchy (a characterful display or serif for headlines, a clean mono for numbers, tabular figures), restrained palette with one accent, semantic green/red only for deltas, dark mode as the hero theme, generous density without clutter.
- Motion with purpose: card expand/collapse, tier transitions, number tick-ups, skeleton shimmer, haptic-style feedback on swipe. No gratuitous animation.
- Bottom tab bar (Today, Ask, Watch), thumb-reachable controls, bottom sheets for filters/settings/sources.
- Empty, loading, error, and offline states are designed, not defaults.
- Avoid: purple-gradient hero, emoji-heavy cards, generic shadcn defaults left unstyled, lorem text, walls of bullet points, fake numbers.

---

# 11. PHASED PLAN (follow in order; each phase ends runnable + committed)

1. **Skeleton (target 30 min)**: Next.js shell, theme, tab nav, PWA manifest, deploy to Vercel (or provide a static/preview run command if deploy is not possible here).
2. **Data (60 min)**: portfolio config, price pipeline, announcements pipeline with snapshot, classifier + tests, scoring + tests.
3. **Push digest UI (60 min)**: window picker, tiers, collapsed routine, card shells with real data. *First demoable slice. Deploy.*
4. **Alerts (40 min)**: rule editor, engine, live preview, inbox, simulate button.
5. **Rich cards (60 min)**: results card with QoQ/YoY (screener + filing extraction), management-change card with bio enrichment, other types' one-liners.
6. **Pull (90 min)**: screener resolver, doc ingest, index, **numbers-vs-narrative first**, then snapshot/guidance/cash quality, then the rest; Ask UI with streaming cards and citations.
7. **Generalisation test (20 min)**: run pull on two unseen tickers; fix crashes; verify graceful errors.
8. **Polish + docs (40 min)**: states, motion, accessibility, README, DECISIONS, WRITEUP, BUILD_LOG, cost panel, final deploy.

If time runs short: cut Pull modules 6-8 first, then 5, then 4, but never cut a working deployed demo of Push digest + results card + numbers-vs-narrative for at least 3 companies.

---

# 12. TESTING AND VERIFICATION

- Unit tests: classifier rules (>= 40 real headlines), priority scoring, QoQ/YoY and margin math, alert engine thresholds, credibility score.
- **Manually verify the results extraction** against at least 3 real filings and record the comparison table in DECISIONS.md.
- Typecheck and lint clean. Run the app, load it at 390x844 in a headless browser (Playwright), take screenshots of each main screen, and review them for layout bugs; fix what you see. Check the console for errors.
- Generalisation test on unseen tickers (phase 7), and a **no-network, no-API-key run** to confirm the snapshot demo works.
- Verify no secrets are committed (`git grep` for key patterns) and `.env.example` is complete.

---

# 13. DELIVERABLES (all in the repo)

- `README.md`: product summary, screenshots, quick start (`npm i && npm run dev`), data refresh command, env vars, architecture diagram (mermaid), model routing and cost notes, deployment URL placeholder, how to try on a phone.
- `DECISIONS.md`: stack choice, interaction-model rationale, per-announcement-type presentation rules, model routing rationale, what was deliberately left out, known limitations, next steps.
- `WRITEUP.md`: ~400-word covering-email text (what I built, key decisions and trade-offs, what was left out, where I'd take it next), ready to paste into an email.
- `BUILD_LOG.md`: brief per-phase log of what was asked, what was built, and key course-corrections (the evaluators want to see how I work with AI tools).
- `data/` snapshot, `config/*`, `.env.example`, `pipeline/refresh_all.py`.

---

# 14. FINAL REPORT (the only time you message me)

When done, reply with: (1) deployed URL or exact run instructions, (2) what works end to end, (3) what is stubbed or fragile, (4) anything I must do manually (API keys, Vercel login, adding my Codex chat export), (5) the 5 screenshots' file paths.

**Begin now.** First action: write a 10-line plan (stack, phases, risks) at the top of `DECISIONS.md`, then execute phase 1.