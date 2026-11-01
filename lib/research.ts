import { Citation, Research, VerdictSchema } from "./schemas";
import { numeric, delta, margin } from "./math";

export function financialRows(r: Research) {
  const table = r.tables.quarters ?? [];
  const periods = table[0]?.slice(1) ?? [];
  return [
    "Sales",
    "Operating Profit",
    "Profit before tax",
    "Net Profit",
    "EPS in Rs",
  ].flatMap((name) => {
    const row = table.find((x) => x[0]?.replace(/\s*\+$/, "").trim() === name);
    if (!row) return [];
    let values = row.slice(1).map(numeric);
    let sourceText = row.join(" | ");
    let derived = false;
    if (name === "Operating Profit") {
      const inputs = [
        "Profit before tax",
        "Interest",
        "Depreciation",
        "Other Income",
      ].map((key) =>
        table.find((x) => x[0]?.replace(/\s*\+$/, "").trim() === key),
      );
      if (inputs.every((x) => !!x)) {
        values = inputs[0]!
          .slice(1)
          .map(
            (v, i) =>
              numeric(v) +
              numeric(inputs[1]![i + 1]) +
              numeric(inputs[2]![i + 1]) -
              numeric(inputs[3]![i + 1]),
          );
        sourceText =
          "Derived EBITDA = PBT + Interest + Depreciation - Other Income. Rounded standardized inputs; exceptional items may affect comparability.\n" +
          inputs.map((x) => x!.join(" | ")).join("\n");
        derived = true;
      }
    }
    if (!values.length || !Number.isFinite(values.at(-1))) return [];
    const current = values.at(-1) ?? 0,
      prev = values.at(-2) ?? 0,
      year = values.at(-5);
    return [
      {
        name:
          name === "Sales"
            ? "Revenue"
            : name === "Operating Profit"
              ? derived
                ? "EBITDA (derived)"
                : "Operating profit"
              : name === "Net Profit"
                ? "PAT"
                : name,
        values,
        current,
        prev,
        year,
        qoq: delta(current, prev),
        yoy: year === undefined ? null : delta(current, year),
        period: periods.at(-1) ?? "",
        source: {
          doc_id: `${r.ticker}-screener`,
          period: periods.join(" · "),
          page: 0,
          text: sourceText,
          url: r.source_url ?? "",
        } as Citation,
      },
    ];
  });
}

const sentences = (text: string) =>
  text.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim());

const dated = (period: string) => {
  const m = period.match(
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(20\d{2})/,
  );
  return m ? new Date(`${m[1]} 15 ${m[2]}`).getTime() : 0;
};

const fiscal = (period: string) => {
  const d = new Date(dated(period));
  return d.getFullYear() + (d.getMonth() >= 3 ? 1 : 0);
};

function range(text: string) {
  const clean = text
    .toLowerCase()
    .replace(/minus\s*|negative\s*/g, "-")
    .replace(/plus\s*|positive\s*/g, "+")
    .replace(/\bzero\b/g, "0");
  const m = clean.match(
    /([+-]?\d+(?:\.\d+)?)\s*%?\s*(?:to|and|–|-)\s*([+-]?\d+(?:\.\d+)?)\s*%/,
  );
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export function guidance(r: Research) {
  const seen = new Set<string>();
  return r.chunks
    .filter((c) => c.doc_type === "transcript")
    .flatMap((c) =>
      sentences(c.text)
        .filter(
          (s) =>
            /\b(guidance|we expect|we target|we aim|we anticipate|we are guiding|we are projecting)\b/i.test(
              s,
            ) &&
            /\d/.test(s) &&
            s.length < 650 &&
            s.length > 35 &&
            !/\?|your guidance|you have|you are/i.test(s),
        )
        .map((s) => ({ s, source: c })),
    )
    .filter((x) => {
      const key = x.s.toLowerCase().replace(/\s/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function narrative(r: Research) {
  const items = guidance(r);
  const outputs: ReturnType<typeof VerdictSchema.parse>[] = [];
  const seen = new Set<string>();

  for (const x of items) {
    const rangeText = /company level guidance/i.test(x.s)
      ? (x.s.split(/company level guidance/i).at(-1) ?? x.s)
      : /revised from/i.test(x.s)
        ? (x.s.split(/now/i).at(-1) ?? x.s)
        : x.s;
    const bounds = range(rangeText);
    if (!bounds || bounds[0] > bounds[1]) continue;
    const quarterly = /sequential/i.test(x.s);
    if (
      /services revenue growth.*guidance/i.test(x.s) &&
      !quarterly &&
      !/company level guidance/i.test(x.s)
    )
      continue;
    if (
      (x.s.match(/(?:to|–)\s*[+-]?\d+(?:\.\d+)?%/g) ?? []).length > 1 &&
      !/revised from|company level guidance/i.test(x.s)
    )
      continue;
    const metric = /margin|EBIT/i.test(x.s)
      ? "Operating margin"
      : /growth|revenue/i.test(x.s)
        ? "Revenue growth (CC)"
        : null;
    if (!metric) continue;
    if (metric === "Revenue growth (CC)" && !/constant.currency/i.test(x.s))
      continue;
    const fy = fiscal(x.source.period);
    const key = `${x.source.period.split(" Transcript")[0]}-${metric}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const candidates = r.chunks.filter(
      (c) =>
        c.doc_type === "transcript" &&
        dated(c.period) > dated(x.source.period) &&
        (quarterly
          ? dated(c.period) - dated(x.source.period) < 120 * 864e5
          : new Date(dated(c.period)).getMonth() === 3 &&
            new Date(dated(c.period)).getFullYear() === fy),
    );

    let actual: { value: number; source: Citation; quote: string } | undefined;

    for (const c of candidates) {
      for (const sentence of sentences(c.text)) {
        if (/guidance|expect|target|excluding|adjusted|\?/i.test(sentence))
          continue;
        let value: number | undefined;

        if (quarterly) {
          if (
            !/revenue|revenues/i.test(sentence) ||
            !/constant.currency/i.test(sentence) ||
            !/sequential|quarter.on.quarter/i.test(sentence)
          )
            continue;
          if (/flat sequentially|flat.*constant.currency/i.test(sentence))
            value = 0;
          else {
            const m = sentence.match(
              /(?:grew|growth of|declin(?:ed|ing)|degrowth of|increased by)\s*([+-]?\d+(?:\.\d+)?)%\s*(?:sequentially|on a QoQ|quarter.on.quarter)/i,
            );
            if (m)
              value = Number(m[1]) * (/declin|degrowth/i.test(m[0]) ? -1 : 1);
            if (value === undefined) {
              const m2 = sentence.match(
                /(?:declining|declined|degrowth of|grew|growth of)\s*(\d+(?:\.\d+)?)%\s*(?:sequentially|in constant currency)/i,
              );
              if (m2)
                value =
                  Number(m2[1]) * (/declin|degrowth/i.test(m2[0]) ? -1 : 1);
            }
          }
        } else if (metric === "Operating margin") {
          if (
            !/full.year/i.test(sentence) ||
            !/margin|EBIT/i.test(sentence) ||
            (/basis point|increase of|improvement of/i.test(sentence) &&
              !/(?:was|at|is at)\s*\d/.test(sentence))
          )
            continue;
          const m = sentence.match(
            /(?:margin[s]?[^%]{0,50}?(?:at|was|is)|EBIT[^%]{0,80}?at)\s*(\d+(?:\.\d+)?)%/i,
          );
          if (m) value = Number(m[1]);
        } else {
          if (
            !/constant.currency/i.test(sentence) ||
            !(
              /full.year/i.test(sentence) ||
              new RegExp(`FY.?['’]?${String(fy).slice(-2)}`).test(sentence)
            ) ||
            /services business|segment/i.test(sentence)
          )
            continue;
          const m = sentence.match(
            /(?:growth of|grew|increase of|declined by|degrowth of)\s*(\d+(?:\.\d+)?)%/i,
          );
          if (m)
            value = Number(m[1]) * (/declin|degrowth/i.test(m[0]) ? -1 : 1);
        }

        if (value !== undefined && Number.isFinite(value)) {
          actual = { value, source: c, quote: sentence };
          break;
        }
      }

      if (actual) break;
    }

    const target = `${bounds[0]}–${bounds[1]}%`;
    const gap = actual
      ? actual.value < bounds[0]
        ? actual.value - bounds[0]
        : actual.value > bounds[1]
          ? actual.value - bounds[1]
          : 0
      : null;
    const latest = Math.max(...r.chunks.map((c) => dated(c.period)));
    const due = quarterly
      ? dated(x.source.period) + 120 * 864e5
      : new Date(fy, 3, 30).getTime();
    const verdict = actual
      ? actual.value >= bounds[0] && actual.value <= bounds[1]
        ? "met"
        : metric === "Revenue growth (CC)" && actual.value > bounds[1]
          ? "met"
          : "missed"
      : latest < due
        ? "not_yet_due"
        : "unclear";

    outputs.push(
      VerdictSchema.parse({
        statement: x.s,
        metric: quarterly ? "Quarterly revenue growth (CC)" : metric,
        target,
        delivered: actual
          ? `${actual.value}%${gap ? ` · ${gap > 0 ? "+" : ""}${gap.toFixed(1)} pp outside range` : ""}`
          : "not_disclosed",
        verdict,
        sources: actual
          ? [
              { ...x.source, text: x.s },
              { ...actual.source, text: actual.quote },
            ]
          : [{ ...x.source, text: x.s }],
      }),
    );
  }

  const completedPeriods = [
    ...new Set(
      outputs
        .filter((o) => ["met", "missed"].includes(o.verdict))
        .map((o) => o.sources[0].period),
    ),
  ].slice(0, 4);
  return outputs
    .filter(
      (o) =>
        !["met", "missed"].includes(o.verdict) ||
        completedPeriods.includes(o.sources[0].period),
    )
    .sort(
      (a, b) =>
        Number(["met", "missed"].includes(b.verdict)) -
        Number(["met", "missed"].includes(a.verdict)),
    )
    .slice(0, 12);
}

export function searchPassages(r: Research, query: string) {
  const words: string[] = query.toLowerCase().match(/[a-z]{3,}/g) ?? [];
  return r.chunks
    .map((c) => ({
      c,
      score: words.reduce(
        (n, w) => n + (c.text.toLowerCase().includes(w) ? 1 : 0),
        0,
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.c);
}

export function cashRows(r: Research) {
  const table = r.tables["cash-flow"] ?? [];
  const row = table.find((x) => /Cash from Operating/i.test(x[0] ?? ""));
  const pl = r.tables["profit-loss"] ?? [];
  const pat = pl.find((x) => /^Net Profit/i.test(x[0] ?? ""));
  if (!row) return [];
  return row
    .slice(1)
    .map((v, i) => ({
      period: table[0]?.[i + 1],
      cfo: numeric(v),
      pat: (() => {
        const j = pl[0]?.indexOf(table[0]?.[i + 1]);
        return j > 0 && pat?.[j] ? numeric(pat[j]) : null;
      })(),
    }))
    .filter((x) => x.period && !/TTM/i.test(x.period))
    .slice(-5);
}

export function resultsSummary(r: Research) {
  const rows = financialRows(r);
  const revenue = rows.find((x) => x.name === "Revenue"),
    op = rows.find(
      (x) => x.name === "EBITDA (derived)" || x.name === "Operating profit",
    );
  return {
    rows,
    margin: revenue && op ? margin(op.current, revenue.current) : null,
    bps:
      revenue && op && revenue.year && op.year
        ? ((margin(op.current, revenue.current) ?? 0) -
            (margin(op.year, revenue.year) ?? 0)) *
          100
        : null,
  };
}
