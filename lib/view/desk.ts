import { snapshot } from "../data";
// Tables remain available immediately. Other companies' exact research pages load
// after first paint and are precached by the service worker for offline use.
export function deskSnapshot() {
  const data = snapshot();
  const management = new Set(
    data.filings
      .filter((f) => f.category === "management_change")
      .map((f) => f.id),
  );
  return {
    ...data,
    prices: Object.fromEntries(
      Object.entries(data.prices).map(([t, b]) => [
        t,
        (b as unknown[]).slice(-40),
      ]),
    ),
    research: Object.fromEntries(
      Object.entries(data.research).map(([t, r]) => [t, { ...r, chunks: [] }]),
    ),
    filingPassages: Object.fromEntries(
      Object.entries(data.filingPassages).filter(([id]) => management.has(id)),
    ),
  };
}
