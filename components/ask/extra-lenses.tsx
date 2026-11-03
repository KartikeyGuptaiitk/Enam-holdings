import { Research, Citation } from "../../lib/schemas";
import { financialRows, searchPassages } from "../../lib/research";
import { numeric } from "../../lib/math";
import { number, percent } from "../../lib/format";
export function ExtraLenses({
  r,
  lens,
  source,
}: {
  r: Research;
  lens: string;
  source: (c: Citation[]) => void;
}) {
  const rows = financialRows(r);
  const cite = (table: string): Citation => ({
    doc_id: r.ticker + "-screener",
    page: 0,
    period: r.tables[table]?.[0]?.join(" · ") || "",
    url: r.source_url || "",
    text: JSON.stringify(r.tables[table]),
  });
  if (lens === "Trajectory")
    return (
      <section className="panel">
        <h2>The longer arc.</h2>
        <p className="footnote">
          Quarterly sequence. CAGR is withheld without a verified annual-period
          match.
        </p>
        {rows.slice(0, 4).map((row) => {
          const low = Math.min(...row.values),
            range = Math.max(...row.values) - low || 1;
          return (
            <button
              className="trajectory-row"
              key={row.name}
              onClick={() => source([row.source])}
            >
              <b>{row.name}</b>
              <strong>{number(row.current)}</strong>
              <svg
                viewBox="0 0 200 48"
                role="img"
                aria-label={`${row.name} quarterly trend`}
              >
                <path
                  d={row.values
                    .map(
                      (v, i) =>
                        `${i ? "L" : "M"}${(i * 200) / (row.values.length - 1)},${44 - ((v - low) / range) * 40}`,
                    )
                    .join(" ")}
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="1.5"
                />
              </svg>
              <span>{percent(row.yoy)} YoY · source ↗</span>
            </button>
          );
        })}
      </section>
    );
  if (lens === "Balance sheet") {
    const t = r.tables["balance-sheet"] || [],
      periods = t[0] || [];
    const fields = [
      "Borrowings",
      "Equity Capital",
      "Reserves",
      "Total Assets",
      "Other Liabilities",
    ];
    return (
      <section className="panel">
        <h2>Capital, accounted for.</h2>
        <p>{periods.at(-1) || "Period not disclosed"} · ₹ Cr</p>
        {fields.map((key) => {
          const row = t.find((x) => x[0]?.replace(/\s*\+$/, "").trim() === key);
          const raw = row?.at(-1);
          return (
            <button
              className="balance-row"
              key={key}
              onClick={() => source([cite("balance-sheet")])}
            >
              <span>{key}</span>
              <b>
                {raw && Number.isFinite(numeric(raw))
                  ? number(numeric(raw))
                  : "not_disclosed"}{" "}
                ↗
              </b>
            </button>
          );
        })}
        <p className="footnote">
          No leverage or working-capital waterfall is inferred from unmatched
          periods.
        </p>
      </section>
    );
  }
  if (lens === "Business") {
    const excerpts = searchPassages(
      r,
      "business segments revenue operations",
    ).slice(0, 3);
    return (
      <section className="panel">
        <h2>Read the business.</h2>
        <p className="footnote">
          Extractive passages. Revenue mix is withheld unless a structured
          segment split is disclosed.
        </p>
        {excerpts.length ? (
          excerpts.map((c, i) => (
            <button className="passage" key={i} onClick={() => source([c])}>
              {c.text.slice(0, 280)}…<span>p.{c.page} ↗</span>
            </button>
          ))
        ) : (
          <p>not_disclosed · No matching source passage.</p>
        )}
      </section>
    );
  }
  if (lens === "Bull vs bear")
    return (
      <section className="panel">
        <h2>Two sides of the numbers.</h2>
        <p className="footnote">
          Mechanical YoY comparisons, not forecasts or investment
          recommendations.
        </p>
        <div className="two-sides">
          {[true, false].map((up) => (
            <div key={String(up)}>
              <h3>{up ? "Improving" : "Under pressure"}</h3>
              {rows
                .filter((x) => x.yoy !== null && (up ? x.yoy >= 0 : x.yoy < 0))
                .slice(0, 3)
                .map((row) => (
                  <button
                    className="passage"
                    key={row.name}
                    onClick={() => source([row.source])}
                  >
                    {row.name}: {percent(row.yoy)} YoY ↗
                  </button>
                ))}
              {!rows.some(
                (x) => x.yoy !== null && (up ? x.yoy >= 0 : x.yoy < 0),
              ) && <p>not_disclosed · No qualifying comparison.</p>}
            </div>
          ))}
        </div>
      </section>
    );
  return null;
}
