"use client";
import { useState } from "react";
export function Timeline({ dates, asOf }: { dates: string[]; asOf: string }) {
  const [selected, setSelected] = useState("");
  return (
    <div className="timeline">
      <div aria-label="Matching alert days">
        {Array.from({ length: 30 }, (_, i) => {
          const d = new Date(asOf);
          d.setUTCDate(d.getUTCDate() - 29 + i);
          const date = d.toISOString().slice(0, 10),
            n = dates.filter((x) => x === date).length;
          return (
            <button
              aria-label={`${date}: ${n} matching alerts`}
              aria-pressed={selected === date}
              className={n ? "lit" : ""}
              key={date}
              onClick={() => setSelected(date)}
              style={{ height: Math.min(36, 8 + n * 4) }}
            />
          );
        })}
      </div>
      <small>
        30 DAYS AGO <span>LATEST SESSION</span>
      </small>
      {selected && (
        <p role="status">
          {selected} · {dates.filter((x) => x === selected).length} matching
          alerts. Inspect matching sessions below for filings.
        </p>
      )}
    </div>
  );
}
