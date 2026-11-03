import Link from "next/link";
export default function NotFound() {
  return (
    <main style={{ padding: 32, maxWidth: 500, margin: "auto" }}>
      <p className="eyebrow">FINN / 404</p>
      <h1>Outside the shortlist.</h1>
      <p>This page is unavailable. Start with the latest saved disclosures.</p>
      <Link href="/">Back to the desk ↗</Link>
    </main>
  );
}
