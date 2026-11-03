1. Build FINN with Next.js App Router, TypeScript, Tailwind, Zod, and SVG charts.
2. Keep a runnable offline snapshot and honest source availability throughout.
3. Phase 1: create the mobile shell, navigation, manifest, and service worker.
4. Phase 2: normalise portfolio, price, filing, classification, and scoring data.
5. Phase 3: ship a ranked digest with windows, filters, and source-linked cards.
6. Phase 4: add persisted alert rules, historical preview, and simulation.
7. Phase 5: render financial results with deterministic comparison mathematics.
8. Phase 6: build source-grounded research cards and general ticker resolution.
9. Phase 7: test unseen tickers, arithmetic, schemas, offline use, and mobile layout.
10. Phase 8: document limitations, verify production build, and provide a local demo.


## Cloud continuation — 3 November 2026
The existing thin slice is the delivery target: saved digest, deterministic results,
Watch replay, and cited research. Live scraping and provider orchestration are optional.
Use the pnpm lockfile with pnpm 12.16.1; do not regenerate it with npm install.
The Linux production build passes on Node 24.22.1. Python 3.12 runs in an external venv.

### Product and presentation decisions
The dark editorial desk gives attention a hierarchy: materiality first, routine filings
collapsed, citations one tap away. Today uses the latest saved disclosure as its clock
(1 November 2026), rather than making an old snapshot appear empty. Portfolio exposure,
24-hour decay and unusual market moves modify category weights; this is a shortlist,
not investment advice. Results use standardized consolidated tables where available.
Management cards extract disclosed role/date/reason; no biography is invented. Other
categories currently show filing text and priority rather than bespoke extracted fields.
Watch stores one rule set and inbox locally; replay is a demonstration, not monitoring.
Ask is a module selector and extractive retrieval interface, not a conversational LLM.

### Manual results reconciliation
Checked cached original filing passages for the quarter ended September 2026.
Values below are INR crore. Page numbers refer to the original PDF, not printed labels.

| Company / filing ID / page | Metric | Filing | Standardized UI | Finding |
|---|---|---:|---:|---|
| INFY / f608d6276ce17a / 31 | Revenue | 49,244 | 49,244 | Matches |
| INFY / f608d6276ce17a / 31 | PBT | 11,063 | 11,063 | Matches |
| INFY / f608d6276ce17a / 31 | PAT before NCI | 7,838 | 7,838 | Matches group profit; shareholder PAT is 7,823 |
| INFY / f608d6276ce17a / 20 | Derived EBITDA | 11,689 | 11,689 | 11,063 + 115 + 1,359 - 848; not IFRS operating profit 10,330 |
| TCS / 2c759e54fd5cbd / 8 | Revenue | 73,188 | 73,188 | Matches |
| TCS / 2c759e54fd5cbd / 8 | PBT | 18,638 | 18,638 | Matches |
| TCS / 2c759e54fd5cbd / 8 | PAT before NCI | 13,934 | 13,934 | Shareholder PAT is 13,884; retain distinction |
| TCS / 2c759e54fd5cbd / 8 | Derived EBITDA | 18,815 | 18,815 | 18,638 + 252 + 1,262 - 1,337 |
| PERSISTENT / 8b5dd96ec3fe37 / 19 | Revenue | 4,663.904 | 4,664 | Rounded |
| PERSISTENT / 8b5dd96ec3fe37 / 19 | PBT | 453.684 | 454 | Rounded |
| PERSISTENT / 8b5dd96ec3fe37 / 19 | PAT | 351.514 | 352 | Rounded |
| PERSISTENT / 8b5dd96ec3fe37 / 19 | Derived EBITDA | 633.481 | 635 | Rounded inputs compound uncertainty |

Persistent filing units are INR million: divide by 10. Precise EBITDA is
(4536.84 + 375.69 + 1666.73 - 244.45) / 10. Its promotional operating PAT/EBIT
are adjusted measures and must not substitute for statutory consolidated results.
This is a limited latest-quarter comparison, not full reconciliation of all periods,
EPS, all holdings, or accounting bases. UI deliberately retains its unverified label.

### Promise extraction review
Annual CC growth is compared to later full-year CC disclosures; quarterly guidance
requires sequential CC evidence. Ambiguous multiple ranges are skipped. Only matched
numeric statements contribute to the heuristic score; pending/unclear rows do not.
The rules are heuristic: date labels, consolidated versus service/segment scope, and
negation can still be ambiguous. A 100 score covers selected statements only, not
management integrity or forecast reliability. No broad credibility claim is justified.
A future phase should require explicit fiscal-quarter identifiers and entity scope in
the extraction schema and manually annotate a larger adversarial corpus.

### Deliberate omissions and constraints
No BSE fallback, external management biographies, push notifications, account sync,
full LLM orchestration, free-form generated answers, trajectory/business/balance-sheet/
bull-bear modules, or production scheduler. Provider adapters exist but are unexercised;
the snapshot uses zero model tokens and $0 model spend. Python ingestion is unavailable
on Vercel; refresh snapshots outside serverless and redeploy. Upstream access is flaky
and additional network domains may be required. No deployment credentials are present.
Initial HTML includes all compact company research and filing passages: this favors
reliable offline use over first-load size. Raw documents remain server-side; future work
should split company payloads and precache a deliberately bounded offline collection.

## Desk Terminal UI pass
The signature accent is electric lime (#C6F432): it marks a selected control or a
signal worth attention. Green/red remain reserved for market direction. Ink and
paper share semantic CSS tokens; paper uses a darker olive accent for legibility.
Newsreader, Inter Tight and JetBrains Mono are licensed, self-hosted via next/font/local
so the snapshot does not fetch fonts from a remote service. Licenses are included.
The portfolio temperature grid encodes signed daily change with restrained intensity.
Equal tiles preserve ticker legibility rather than suggesting precision through a tiny
weight treemap. Today rows are compact; financial tables reveal on expansion rather
than repeating four times before the next company. Watch puts the inbox and session
preview first, with the long matching list collapsed. Ask uses a ledger and labels
its ring SELECTED CLAIMS to avoid implying broad management credibility.
New sources/search/settings sheets support keyboard containment, Escape, drag dismissal
and focus restoration. Haptics are opt-in. Default state remains quiet and demoable.
This pass deliberately does not fabricate biographies, ratings, dividend fields or
advanced research lenses where structured evidence is absent. Streaming and advanced
charts remain limited to supported modules. Performance budgets and the full original
interaction wish list must be reported as unverified where not measured or implemented.

Final UI validation reached Lighthouse mobile 97 performance / 100 accessibility /
100 best practices, LCP 1.4 seconds in a local production run. Source JSON remains
committed; exact passages load after first paint through a precached endpoint. This
preserves offline research while reducing initial HTML. See docs/UI_REVIEW.md for
all measured results and the explicit interaction cuts; not every wishlist item shipped.
