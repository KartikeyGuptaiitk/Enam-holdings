import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { compactResearch } from "../../../lib/data";
import { ResearchSchema } from "../../../lib/schemas";
export const runtime = "nodejs";
const pending = new Map<string, Promise<unknown>>();
export async function GET(req: NextRequest) {
  const ticker = (req.nextUrl.searchParams.get("ticker") || "").toUpperCase();
  if (!/^[A-Z0-9&-]{1,20}$/.test(ticker))
    return NextResponse.json({ error: "Invalid NSE ticker" }, { status: 400 });
  const unavailable = {
    ticker,
    status: "not_available",
    tables: {},
    chunks: [],
    docs: [],
  };
  try {
    const saved = ResearchSchema.parse(
      JSON.parse(await fs.readFile(`data/research/${ticker}.json`, "utf8")),
    );
    if (saved.status === "available" && saved.chunks.length > 0)
      return NextResponse.json(compactResearch(saved));
  } catch {}
  if (process.env.VERCEL)
    return NextResponse.json({
      ...unavailable,
      error:
        "Live Python ingestion runs locally; use the refresh pipeline and redeploy the snapshot.",
    });
  if (!pending.has(ticker)) {
    if (pending.size >= 2)
      return NextResponse.json({
        ...unavailable,
        error: "Research queue busy. Try again shortly.",
      });
    const task = new Promise((resolve) => {
      const child = spawn(
        process.env.PYTHON_BIN || "python",
        ["pipeline/analyse.py", ticker],
        { cwd: process.cwd(), windowsHide: true, stdio: "ignore" },
      );
      const timer = setTimeout(() => {
        child.kill();
        resolve(unavailable);
      }, 90000);
      child.on("error", () => {
        clearTimeout(timer);
        resolve(unavailable);
      });
      child.on("close", async () => {
        clearTimeout(timer);
        try {
          resolve(
            compactResearch(
              ResearchSchema.parse(
                JSON.parse(
                  await fs.readFile(`data/research/${ticker}.json`, "utf8"),
                ),
              ),
            ),
          );
        } catch {
          resolve(unavailable);
        }
      });
    }).finally(() => pending.delete(ticker));
    pending.set(ticker, task);
  }
  return NextResponse.json(await pending.get(ticker));
}
