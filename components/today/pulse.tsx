export function Pulse({ count, ticker }: { count: number; ticker?: string }) {
  return (
    <section className="pulse" aria-label="Daily signal summary">
      <div className="eyebrow">THE OPENING READ</div>
      <p>
        <em>{count || "No"}</em> signals deserve a look.
        <br />
        <span>
          {ticker
            ? `${ticker} leads the shortlist.`
            : "A quiet session. Keep your attention."}
        </span>
      </p>
    </section>
  );
}
