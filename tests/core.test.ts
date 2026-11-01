import test from "node:test";
import assert from "node:assert/strict";
import fixtures from "./headlines.json";
import { classify } from "../lib/classify";
import { score, tier } from "../lib/scoring";
import { delta, margin, credibility } from "../lib/math";
import { triggers, Rule } from "../lib/alerts";
import { snapshot } from "../lib/data";
import { financialRows, narrative, cashRows } from "../lib/research";
for (const [i, f] of fixtures.entries())
  test(`Real NSE headline ${i + 1}: ${f.ticker} ${f.expected}`, () =>
    assert.equal(classify(f.text), f.expected));
test("priority: decay, exposure, seniority and caps", () => {
  assert.equal(score("results", 10, 0), 100);
  assert.equal(score("results", 0, 24), 45);
  assert.equal(score("results", 0, -24), 90);
  assert.equal(score("management_change", 0, 0, 0, 0, "Director resigned"), 45);
  assert.equal(score("management_change", 0, 0, 0, 0, "CEO resigned"), 85);
  assert.equal(score("credit_rating", 0, 0, 0, 0, "Downgrade"), 80);
  assert.equal(tier(70), "Must-see");
  assert.equal(tier(40), "Worth a look");
  assert.equal(tier(39), "Routine");
});
test("math: zero denominators, negative bases, margins and verdict exclusions", () => {
  assert.equal(delta(120, 100), 20);
  assert.equal(delta(-5, -10), 50);
  assert.equal(delta(1, 0), null);
  assert.equal(margin(25, 100), 25);
  assert.equal(margin(1, 0), null);
  assert.equal(
    credibility(["met", "partially", "missed", "unclear", "not_yet_due"]),
    50,
  );
  assert.equal(credibility(["unclear"]), null);
});
const rule: Rule = {
  move: 4,
  volume: 2,
  minimum: 40,
  categories: ["results"],
  ticker: "",
};
test("alerts: inclusive OR thresholds, category priority and scope", () => {
  assert.equal(triggers(rule, { ticker: "INFY", move: -4, volume: 1 }), true);
  assert.equal(triggers(rule, { ticker: "INFY", move: 0, volume: 2 }), true);
  assert.equal(
    triggers(rule, { ticker: "INFY", category: "results", score: 40 }),
    true,
  );
  assert.equal(
    triggers(rule, { ticker: "INFY", category: "results", score: 39 }),
    false,
  );
  assert.equal(
    triggers({ ...rule, ticker: "TCS" }, { ticker: "INFY", move: 10 }),
    false,
  );
});
test("snapshot: portfolio weights, positive bars, latest reported financials", () => {
  const d = snapshot();
  assert.equal(d.portfolio.length, 18);
  assert.equal(
    d.portfolio.reduce((n, p) => n + p.weight_pct, 0),
    100,
  );
  for (const t of ["INFY", "TCS", "PERSISTENT"])
    assert.equal(financialRows(d.research[t])[0].period, "Sep 2026");
  assert.equal(financialRows(d.research.INFY)[0].current, 49244);
  assert.equal(financialRows(d.research.TCS)[0].current, 73188);
});
test("grounding: all verdicts cite both distinct documents and correct currency basis", () => {
  const d = snapshot();
  for (const t of ["INFY", "WIPRO", "HCLTECH"]) {
    const rows = narrative(d.research[t]);
    assert.ok(
      rows.some((x) => ["met", "missed"].includes(x.verdict)),
      t,
    );
    for (const row of rows.filter((x) =>
      ["met", "missed"].includes(x.verdict),
    )) {
      assert.equal(row.sources.length, 2);
      assert.notEqual(row.sources[0].doc_id, row.sources[1].doc_id);
      for (const source of row.sources)
        assert.ok(
          d.research[t].chunks.some(
            (c) =>
              c.doc_id === source.doc_id &&
              c.page === source.page &&
              c.text.includes(source.text),
          ),
        );
      if (row.metric.includes("CC"))
        assert.match(row.sources[1].text, /constant.currency/i);
    }
  }
});
test("generalisation: unseen WIPRO and HCLTECH have source pages; missing ticker stays empty", () => {
  const d = snapshot();
  for (const t of ["WIPRO", "HCLTECH"]) {
    assert.ok(d.research[t].chunks.length > 0);
    assert.ok(financialRows(d.research[t]).length > 0);
  }
  assert.equal(d.research.NOTAREALTICKER, undefined);
});
test("cash flow aligns year names rather than table offsets", () => {
  const r = snapshot().research.INFY;
  const rows = cashRows(r);
  assert.ok(rows.length > 0);
  assert.ok(rows.every((x) => Number.isFinite(x.cfo) && x.pat !== null));
});
