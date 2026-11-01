import fs from "node:fs";
import path from "node:path";
import { FilingSchema, ResearchSchema } from "./schemas";
import { classify } from "./classify";
const read = (p: string, fallback: unknown) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), p), "utf8"));
  } catch {
    return fallback;
  }
};
export function compactResearch(r: import("./schemas").Research) {
  return {
    ...r,
    chunks: r.chunks
      .filter((c) => c.doc_type === "transcript" && c.page <= 20)
      .concat(
        r.chunks
          .filter(
            (c) =>
              c.doc_type === "annual_report" &&
              /cash flows|contingent liabilities|segments|business overview/i.test(
                c.text,
              ),
          )
          .slice(0, 12),
      ),
  };
}
export function snapshot() {
  const portfolio = read("config/portfolio.json", []) as {
    ticker: string;
    name: string;
    sector: string;
    weight_pct: number;
  }[];
  let filings = portfolio.flatMap((p) =>
    (read(`data/announcements/${p.ticker}.json`, []) as unknown[]).map((x) =>
      (() => {
        const f = FilingSchema.parse(x);
        return { ...f, category: classify(f.headline + " · " + f.body) };
      })(),
    ),
  );
  if (!filings.length) {
    const old = read("data/briefing.json", {}) as { groups?: string[][][] };
    filings = (old.groups?.[1] ?? []).map((x, i) => ({
      id: `legacy-${i}`,
      ticker: x[0],
      headline: x[1],
      body: "Saved exchange disclosure. Open the original filing for the complete details.",
      attachment_url: x[2],
      ts_iso: new Date(x[3] + " GMT+0530").toISOString(),
      source: "NSE · inherited snapshot",
      category: classify(x[1]),
    }));
  }
  const prices = Object.fromEntries(
    portfolio.map((p) => [p.ticker, read(`data/prices/${p.ticker}.json`, [])]),
  );
  const research = Object.fromEntries(
    [
      ...new Set([
        ...portfolio.map((p) => p.ticker),
        "PIDILITIND",
        "TRENT",
        "APOLLOHOSP",
        "DEEPAKNTR",
        "WIPRO",
        "HCLTECH",
      ]),
    ].map((t) => [
      t,
      compactResearch(
        ResearchSchema.parse(
          read(`data/research/${t}.json`, {
            ticker: t,
            status: "not_available",
            tables: {},
            docs: [],
            chunks: [],
          }),
        ),
      ),
    ]),
  );
  const filingPassages = read("data/filing-passages.json", {}) as Record<
    string,
    import("./schemas").Citation[]
  >;
  return {
    portfolio,
    filings,
    prices,
    research,
    filingPassages,
    asOf: filings.length
      ? filings.reduce(
          (a, f) => (f.ts_iso > a ? f.ts_iso : a),
          filings[0].ts_iso,
        )
      : new Date().toISOString(),
  };
}
