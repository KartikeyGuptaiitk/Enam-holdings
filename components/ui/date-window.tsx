export function DateWindow({
  dates,
  asOf,
  from,
  to,
  change,
}: {
  dates: string[];
  asOf: string;
  from: string;
  to: string;
  change: (from: string, to: string) => void;
}) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(asOf);
    d.setUTCDate(d.getUTCDate() - 29 + i);
    return d.toISOString().slice(0, 10);
  });
  const start = Math.max(0, days.indexOf(from)),
    end = to ? Math.max(start, days.indexOf(to)) : 29;
  return (
    <div>
      <div
        className="date-histogram"
        role="img"
        aria-label="Filings per day over the last 30 days"
      >
        {days.map((d, i) => (
          <i
            key={d}
            title={`${d}: ${dates.filter((x) => x === d).length} filings`}
            style={{
              height: Math.max(3, dates.filter((x) => x === d).length * 3),
              opacity: i >= start && i <= end ? 1 : 0.2,
            }}
          />
        ))}
      </div>
      <label className="field">
        Start of window
        <input
          aria-label="Window start"
          type="range"
          min="0"
          max="29"
          value={start}
          onChange={(e) =>
            change(days[Math.min(Number(e.target.value), end)], days[end])
          }
        />
      </label>
      <label className="field">
        End of window
        <input
          aria-label="Window end"
          type="range"
          min="0"
          max="29"
          value={end}
          onChange={(e) =>
            change(days[start], days[Math.max(start, Number(e.target.value))])
          }
        />
      </label>
      <p className="footnote">
        {days[start]} — {days[end]}
      </p>
    </div>
  );
}
