# Desk Terminal review

## Evidence
Baseline: 47 tests and strict typecheck passed. Baseline lint failed on the old QA
script's require imports; corrected before UI development. Development screenshots
also exposed duplicate React keys, corrected in presentation code. Development HMR
errors during offline mode were not treated as production failures.

Final: 50 tests, strict typecheck, ESLint and Linux production build pass. Financial
research, scoring, classification, arithmetic and committed data files are unchanged.
A thin view-model keeps tables but defers research pages, retains 40 recent price bars
for the 30-calendar-day preview, and omits unused filing PDF pages from initial HTML.
/api/desk and the new service-worker cache retain all compact saved research offline.
A separate offline test reloaded Ask and opened WIPRO's exact source passages.

Production visual rounds r3/r4/r5 cover Today, Ask, Watch, expanded Results, source
drawers and the alert editor in ink and paper at 390×844, 360×740, 430×932 and 1280×800.
The matrix reports no page exceptions or horizontal overflow. Review used individual
screens and full-page contact sheets. Extra loading, search, settings, unavailable ticker
and 404 states were captured at all four sizes. Error boundary is implemented but an
artificial render exception was not injected. The recorded sessions are under docs/demo.
Some full-page captures show sticky headers/nav at the capture's viewport boundary;
these are fixed/sticky elements, not extra in-flow copies. Development round2 is retained
as diagnosis evidence, not accepted production QA: cached development assets made route
captures unreliable. Final screenshots are r5.

Round 1: excessive header height, repeated tables and hidden alert controls.
Round 2: shorter header, compact feed and collapsed matching-session list; development
cache contamination prompted switching all acceptance checks to production.
Round 3 (r3): production composition accepted; paper chips and category contrast failed
Lighthouse, and the replay toast clipped at the screen edge.
Round 4 (r4): fixed contrast/heading order, shortened font payloads and deferred sources.
Round 5 (r5): contained toast, complete source drawer capture, loading/keyboard states,
and offline reload including research sources. No financial outputs were changed.

## Performance
Initial UI-pass measurement: performance 47, accessibility 94, best practices 100,
LCP 8.0 seconds. Intermediate: 73/100/100, LCP 3.2 seconds.
Final Lighthouse mobile simulation: **97 performance, 100 accessibility, 100 best
practices, LCP 1.4 seconds**. See lighthouse-final.json. This is one local production
run, not a deployed field measurement. It meets the requested lab budgets. The initial
HTML was reduced from 3.81 MB to below 1 MB, then reduced again by deferring INFY pages;
all full research data remains available through the precached snapshot endpoint.
Bundle report: 173 kB first-load JavaScript. WOFF2 fonts total about 219 kB versus
1.2 MB TTFs. No third-party chart or icon runtime was added.

## What remains below the complete wish list
This is a substantial UI pass, not every interaction in the brief. Feed details still
expand inline rather than shared-element detail sheets. Existing swipe pin/mute actions
have button alternatives, but no long-press menu, undo toast, rubber-band refresh or
one-time swipe coach mark. Sheets use spring drag/Escape/focus containment; snap points
and history/back-button dismissal remain absent. The calendar still uses date inputs,
not a dual-handle histogram. Filters remain single category and company; Today window,
category and company are URL-synced. Search is company substring search, not global fuzzy
filing search with recents. The short guide is available in settings, not auto-onboarding.
There is no voice composer, credibility trend, quarter-grouped ledger, true streaming
or advanced unsupported research lenses. Evidence-free rating/dividend/biography values
were not invented; those layouts retain the existing disclosed content. Holdings have
sparklines/weight bars and volume readouts, not a separate company chart sheet. Settings
has theme/density/haptics/reset but no default-window preference. The original Desk
component still owns much feature state; extraction into primitives is partial. OG image
and new splash art were not added. Hardware haptics, full manual screen-reader testing
and every gesture under reduced motion are not certified by the automated checks.

## Reproduce
Use the README build/start instructions. QA scripts use port 3002:

```
npm start -- --port 3002
ROUND=5 PLAYWRIGHT_BROWSERS_PATH=/workspace/pw-browsers node docs/ui-after/capture.cjs
node docs/ui-after/states.cjs
node docs/qa/ui-smoke.cjs
```

The custom browser path points to the installed system FFmpeg symlink used by Playwright
video recording. Use Playwright's standard FFmpeg installation on another machine.
No deployment credentials are configured. Deployment and attaching the chat export
remain owner actions. Nothing was pushed to GitHub during this UI pass.
