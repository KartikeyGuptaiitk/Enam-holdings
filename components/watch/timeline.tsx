export function Timeline({ dates, asOf }: { dates: string[]; asOf: string }) {
  return (
    <div
      className="timeline"
      role="img"
      aria-label={`${dates.length} matching alerts across the last 30 days`}
    >
      <div>
        {Array.from({ length: 30 }, (_, i) => {
          const d = new Date(asOf);
          d.setUTCDate(d.getUTCDate() - 29 + i);
          const date = d.toISOString().slice(0, 10);
          const n = dates.filter((x) => x === date).length;
          return (
            <span
              title={`${date}: ${n} alerts`}
              className={n ? "lit" : ""}
              key={i}
              style={{ height: Math.min(36, 8 + n * 4) }}
            />
          );
        })}
      </div>
      <small>
        30 DAYS AGO <span>LATEST SESSION</span>
      </small>
    </div>
  );
}
