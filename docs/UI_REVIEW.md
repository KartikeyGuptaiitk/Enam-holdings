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

## Completion pass
The follow-up adds body-level portal sheets with peek/half/full controls, drag snapping,
Back/Escape dismissal and nested history ownership. Filing details and company market
records now open in sheets. Long-press opens filing actions; pin/mute retain explicit
buttons. Mute and inbox archive expose undo. Alert rows support swipe archive and a
per-row Archive button. A one-time skippable guide and swipe hint introduce the desk.
Settings persist a default window; preference initialization is guarded against overwrite.
The custom window now includes a 30-day filing histogram and two constrained range
controls, alongside accessible date inputs. Category selection supports multiple chips.
Command search includes ad-hoc companies, fuzzy subsequence matching, filing headlines
and recent companies. Ask adds a follow-up composer and opt-in speech recognition where
the browser supplies it; dictation is reviewed before sending. Additional lenses show
quarterly trajectory, disclosed balance-sheet fields, exact business passages and a
mechanical two-sided comparison of reported YoY changes. They cite saved sources.
Statement cohorts have score bars and period labels. Reading stages have a progress
rail and skeletons. Management disclosures gain initials; source passages are highlighted.
An Open Graph image is generated locally. No paid service or API key is needed.

The completed interaction acceptance covers first-visit skip, coach dismissal, sheet
snap controls and browser Back, date sliders, fuzzy WIPRO selection, all four additional
lenses, persisted settings, inbox undo, offline reload and exact WIPRO source drawers.
During QA, fixed stacking-context interference by portalling sheets, corrected a
full-height mobile rail intercepting pointer events, and guarded preference hydration.

### Evidence boundaries
The additional lenses do not invent missing segment splits, biographies or leverage
waterfalls. Trajectory currently shows the saved quarterly series; long-term CAGR is
withheld without a verified annual-period match. Bull/bear is explicitly mechanical
comparison, not generated investment advice. Speech and vibration depend on hardware,
browser support and user permission; automated tests do not certify microphones.
The guide explains gestures using the real desk rather than running a separate animated
simulation. Pull-to-refresh checks the saved snapshot; it does not claim a live fetch.
Research progress describes source retrieval, not streaming LLM reasoning. Broad manual
screen-reader certification and field performance measurements remain outside these lab
checks. These limits preserve the original mission's grounding requirements.

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
remain owner actions. The follow-up is committed and pushed to GitHub main after acceptance checks.

## Completed-build acceptance
Production round r6 passes the four viewport sizes in both themes with no horizontal
overflow or page exceptions. The saved interaction acceptance script passes, including
first-visit onboarding, sheet Back/snaps, range controls, fuzzy WIPRO lookup, additional
lenses, default-window settings, archive/undo and offline exact source drawers.
The completed build passes 51 unit tests, strict typecheck, lint and production build.
Latest Lighthouse (including first-visit onboarding): **93 performance, 96 accessibility,
100 best practices, LCP 1.4 seconds**. See lighthouse-completed.json. Earlier 97/100/100
results above refer to the preceding build. Browser/hardware support boundaries remain
as documented. Source-grounded missing-data states are intentional.
