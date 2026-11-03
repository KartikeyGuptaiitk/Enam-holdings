import test from "node:test";
import assert from "node:assert/strict";
import { number, percent } from "../lib/format";
test("Indian formatting preserves signed deltas and missing values", () => {
  assert.equal(number(1234567), "12,34,567");
  assert.equal(percent(null), "—");
  assert.equal(percent(2), "↑ +2.0%");
  assert.equal(percent(-2), "↓ -2.0%");
});
import { gapScale } from "../lib/view/gap";
test("gap visualization preserves negative ranges and excludes missing actuals", () => {
  const s = gapScale("-2–1%", "-1%");
  assert.ok(s);
  assert.equal(s.value, -1);
  assert.ok(s.actual > s.start);
  assert.equal(gapScale("2–3%", "not_disclosed"), null);
  assert.equal(gapScale("3–2%", "1%"), null);
});
import { deskSnapshot } from "../lib/view/desk";
import { snapshot } from "../lib/data";
test("desk view preserves financial research and only removes unused filing pages", () => {
  const original = snapshot(),
    view = deskSnapshot();
  for (const [t, r] of Object.entries(view.research)) {
    assert.deepEqual(r.tables, original.research[t].tables);
    assert.deepEqual(r.chunks, []);
  }
  assert.deepEqual(view.filings, original.filings);
  for (const [id, pages] of Object.entries(view.filingPassages)) {
    assert.ok(
      original.filings.some(
        (f) => f.id === id && f.category === "management_change",
      ),
    );
    assert.deepEqual(pages, original.filingPassages[id]);
  }
});
import { matches } from "../lib/view/search";
test("command search tolerates missing letters while preserving order", () => {
  assert.equal(matches("infs", "Infosys"), true);
  assert.equal(matches("xyz", "Infosys"), false);
  assert.equal(matches("", "INFY"), true);
});
