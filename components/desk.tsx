"use client";
import { DateWindow } from "./ui/date-window";
import { Composer } from "./ask/composer";
import { ExtraLenses } from "./ask/extra-lenses";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { snapshot } from "../lib/data";
import { score, tier, weights } from "../lib/scoring";
import { triggers, Rule } from "../lib/alerts";
import { ResearchSchema, type Citation, type Research } from "../lib/schemas";
import {
  financialRows,
  narrative,
  guidance,
  searchPassages,
  cashRows,
  resultsSummary,
} from "../lib/research";
import { Sheet } from "./ui/sheet";
import { TerminalTools } from "./ui/terminal-tools";
import { Pulse } from "./today/pulse";
import { Holdings } from "./watch/holdings";
import { Timeline } from "./watch/timeline";
import { Gap } from "./ask/gap";
import { Ring } from "./ask/ring";
import { percent } from "../lib/format";
import { credibility } from "../lib/math";
function historyReplace(params: URLSearchParams) {
  window.history.replaceState(
    window.history.state,
    "",
    `/${params.size ? "?" + params.toString() : ""}`,
  );
}
type Data = ReturnType<typeof snapshot>;
type Bar = {
  date: string;
  close: number;
  pct_change: number;
  vol_ratio: number;
  volume: number;
};
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(n);
const label = (s: string) => s.replaceAll("_", " ");
const signed = percent;
function Icon({ name }: { name: string }) {
  return (
    <svg
      className="icon"
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {name === "Today" ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <path d="M8 4v16m4-11h6m-6 4h6" />
        </>
      ) : name === "Watch" ? (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v5l3 2" />
        </>
      ) : (
        <>
          <circle cx="10" cy="10" r="6" />
          <path d="m15 15 6 6" />
        </>
      )}
    </svg>
  );
}
export function Spark({
  values,
  color = "currentColor",
}: {
  values: number[];
  color?: string;
}) {
  if (values.length < 2) return null;
  const low = Math.min(...values),
    range = Math.max(...values) - low || 1;
  return (
    <svg
      viewBox="0 0 200 48"
      role="img"
      aria-label="Historical trend"
      className="spark"
    >
      <path
        d={values
          .map(
            (v, i) =>
              `${i ? "L" : "M"}${(i * 200) / (values.length - 1)},${44 - ((v - low) / range) * 40}`,
          )
          .join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
export default function Desk({ data }: { data: Data }) {
  const [tab, setTab] = useState("Today"),
    [days, setDays] = useState(1),
    [category, setCategory] = useState("all"),
    [company, setCompany] = useState(""),
    [routine, setRoutine] = useState(false),
    [sources, setSources] = useState<Citation[] | null>(null),
    [ticker, setTicker] = useState("INFY"),
    [query, setQuery] = useState(""),
    [module, setModule] = useState("Numbers vs narrative"),
    [research, setResearch] = useState<Record<string, Research>>(data.research),
    [loading, setLoading] = useState(""),
    [debug, setDebug] = useState(false),
    [online, setOnline] = useState(true),
    [pins, setPins] = useState<string[]>([]),
    [muted, setMuted] = useState<string[]>([]),
    [notice, setNotice] = useState(""),
    [expanded, setExpanded] = useState<string | null>(null),
    [history, setHistory] = useState<Record<string, string[]>>({}),
    [inbox, setInbox] = useState<string[]>([]),
    [read, setRead] = useState<string[]>([]),
    [ready, setReady] = useState(false),
    [custom, setCustom] = useState(false),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const [rule, setRule] = useState<Rule>({
    move: 4,
    volume: 2,
    minimum: 40,
    categories: ["results", "M&A", "management_change"],
    ticker: "",
  });
  const [researchReady, setResearchReady] = useState(false);
  const [detail, setDetail] = useState<string | null>(null),
    [chart, setChart] = useState<string | null>(null),
    [coach, setCoach] = useState(false);
  const undo = useRef<(() => void) | null>(null);
  const longPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pullStart = useRef(0);
  const taps = useRef(0);
  const touch = useRef(0);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("finn-state") || "null");
      if (saved) {
        setRule(saved.rule);
        setPins(saved.pins || []);
        setMuted(saved.muted || []);
        setHistory(saved.history || {});
        setInbox(saved.inbox || []);
        setRead(saved.read || []);
      }
    } catch {}
    try {
      const prefs = JSON.parse(localStorage.getItem("finn-prefs") || "{}");
      if (prefs.defaultWindow) setDays(Number(prefs.defaultWindow));
      setCoach(!localStorage.getItem("finn-coach"));
    } catch {}
    const params = new URLSearchParams(location.search);
    const windowDays = Number(params.get("window"));
    if ([1, 3, 7, 30].includes(windowDays)) setDays(windowDays);
    if (params.get("company")) setCompany(params.get("company")!);
    if (params.get("category")) setCategory(params.get("category")!);
    setReady(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const path = location.pathname;
    if (path === "/ask" || path.startsWith("/company/")) {
      setTab("Ask");
      if (path.startsWith("/company/"))
        setTicker(decodeURIComponent(path.split("/")[2]).toUpperCase());
    } else if (path === "/watch") setTab("Watch");
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(
          "finn-state",
          JSON.stringify({ rule, pins, muted, history, inbox, read }),
        );
      } catch {}
  }, [ready, rule, pins, muted, history, inbox, read]);
  useEffect(() => {
    if (!ready || tab !== "Today") return;
    const params = new URLSearchParams();
    if (days !== 1) params.set("window", String(days));
    if (company) params.set("company", company);
    if (category !== "all") params.set("category", category);
    historyReplace(params);
  }, [ready, tab, days, company, category]);
  useEffect(() => {
    let active = true;
    fetch("/api/desk")
      .then((r) => {
        if (!r.ok) throw Error("Snapshot unavailable");
        return r.json();
      })
      .then((json) => {
        const saved = Object.fromEntries(
          Object.entries(json).map(([t, r]) => [t, ResearchSchema.parse(r)]),
        );
        if (active) setResearch((current) => ({ ...current, ...saved }));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setResearchReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const go = (t: string) => {
    setTab(t);
    window.history.replaceState(
      null,
      "",
      t === "Today" ? "/" : `/${t.toLowerCase()}`,
    );
  };
  const latest = (t: string): Bar | undefined =>
    (data.prices[t] as Bar[] | undefined)?.at(-1);
  const all = data.filings
    .map((f) => {
      const p = data.portfolio.find((x) => x.ticker === f.ticker);
      const bar = latest(f.ticker);
      return {
        ...f,
        priority: score(
          f.category,
          p?.weight_pct ?? 0,
          (+new Date(data.asOf) - +new Date(f.ts_iso)) / 36e5,
          bar?.pct_change,
          bar?.vol_ratio,
          f.headline + " " + f.body,
        ),
      };
    })
    .sort(
      (a, b) =>
        Number(pins.includes(b.id)) - Number(pins.includes(a.id)) ||
        b.priority - a.priority,
    );
  const shown = all.filter((f) => {
    const age = (+new Date(data.asOf) - +new Date(f.ts_iso)) / 864e5;
    return (
      (from || to
        ? (!from || f.ts_iso.slice(0, 10) >= from) &&
          (!to || f.ts_iso.slice(0, 10) <= to)
        : age <= days) &&
      (category === "all" || category.split(",").includes(f.category)) &&
      (!company || f.ticker === company) &&
      !muted.includes(f.ticker + f.category)
    );
  });
  const must = shown.filter((f) => f.priority >= 70),
    worth = shown.filter((f) => f.priority >= 40 && f.priority < 70),
    other = shown.filter((f) => f.priority < 40);
  const movers = data.portfolio
    .map((p) => ({ ...p, bar: latest(p.ticker) }))
    .filter((p) => p.bar)
    .sort((a, b) => Math.abs(b.bar!.pct_change) - Math.abs(a.bar!.pct_change));
  const alertItems = useMemo(() => {
    const moves = data.portfolio.flatMap((p) =>
      ((data.prices[p.ticker] as Bar[]) || [])
        .filter(
          (b) =>
            (+new Date(data.asOf) - +new Date(b.date + "T00:00:00+05:30")) /
              864e5 <=
            30,
        )
        .filter((b) =>
          triggers(rule, {
            ticker: p.ticker,
            move: b.pct_change,
            volume: b.vol_ratio,
          }),
        )
        .map((b) => ({
          id: `${p.ticker}-${b.date}`,
          ticker: p.ticker,
          date: b.date,
          text: `${signed(b.pct_change)} · ${b.vol_ratio.toFixed(1)}× volume`,
          kind: "Market move",
        })),
    );
    const filings = all
      .filter((f) =>
        triggers(rule, {
          ticker: f.ticker,
          category: f.category,
          score: f.priority,
        }),
      )
      .map((f) => ({
        id: f.id,
        ticker: f.ticker,
        date: f.ts_iso.slice(0, 10),
        text: f.headline,
        kind: label(f.category),
      }));
    return [...moves, ...filings].sort((a, b) => b.date.localeCompare(a.date));
  }, [data, rule, pins]);
  const current = research[ticker];
  const noticeTimer = useRef<number | null>(null);
  const action = (message: string, revert?: () => void) => {
    undo.current = revert || null;
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 5000);
  };
  async function ask(nextModule = module) {
    const raw = query.trim();
    const token = raw.split(/\s/)[0]?.toUpperCase();
    const found = data.portfolio.find(
      (p) => p.name.toLowerCase() === raw.toLowerCase() || p.ticker === token,
    );
    const t =
      found?.ticker ||
      (/^[A-Z0-9&-]{1,20}$/.test(token ?? "") &&
      (raw.split(/\s/).length === 1 ||
        /^[A-Z0-9&-]{1,20}$/.test(raw.split(/\s/)[0]))
        ? token
        : ticker);
    setTicker(t);
    setModule(
      /cash|CFO|cash conversion/i.test(raw)
        ? "Cash quality"
        : /guidance|outlook/i.test(raw)
          ? "Guidance"
          : /snapshot|financial|revenue|profit|EPS/i.test(raw)
            ? "Financial snapshot"
            : nextModule,
    );
    setLoading("Resolving company disclosures…");
    setHistory((h) => ({
      ...h,
      [t]: [...(h[t] || []), raw || nextModule].slice(-6),
    }));
    try {
      await new Promise((r) => setTimeout(r, 300));
      if (
        !research[t] ||
        research[t].status === "not_available" ||
        research[t].chunks.length === 0
      ) {
        const response = await fetch(
          `/api/research?ticker=${encodeURIComponent(t)}`,
        );
        const json = ResearchSchema.parse(await response.json());
        setResearch((r) => ({ ...r, [t]: json }));
      }
      setLoading("Reading source passages…");
      await new Promise((r) => setTimeout(r, 350));
    } catch {
      action("Live research unavailable. Saved sources remain accessible.");
    } finally {
      setLoading("");
    }
  }
  function results(r: Research, compact = false) {
    const s = resultsSummary(r);
    if (!s.rows.length)
      return (
        <p className="muted">
          Financial tables not available for this company.
        </p>
      );
    return (
      <div className="results">
        <div className="table-caption">
          ₹ crore unless EPS · {s.rows[0].period}
          <button
            className="text-button"
            onClick={() => setSources(s.rows.map((x) => x.source))}
          >
            Sources ↗
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Current</th>
              {!compact && <th>Prev Q</th>}
              <th>QoQ</th>
              <th>YoY</th>
            </tr>
          </thead>
          <tbody>
            {s.rows.slice(0, compact ? 4 : 5).map((row) => (
              <tr key={row.name}>
                <td>
                  {row.name}
                  <Spark values={row.values.slice(-8)} color="var(--muted)" />
                </td>
                <td>
                  <button
                    className="number-link"
                    onClick={() => setSources([row.source])}
                  >
                    {fmt(row.current)}
                  </button>
                </td>
                {!compact && <td>{fmt(row.prev)}</td>}
                <td className={(row.qoq ?? 0) >= 0 ? "positive" : "negative"}>
                  {signed(row.qoq)}
                </td>
                <td className={(row.yoy ?? 0) >= 0 ? "positive" : "negative"}>
                  {signed(row.yoy)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {s.margin !== null && (
          <div className="result-footer">
            <span>
              Derived EBITDA margin <b>{s.margin.toFixed(1)}%</b>
            </span>
            <span className={(s.bps ?? 0) >= 0 ? "positive" : "negative"}>
              {s.bps === null
                ? "—"
                : `${s.bps >= 0 ? "+" : ""}${Math.round(s.bps)} bps YoY`}
            </span>
          </div>
        )}
        <Spark values={s.rows[0].values.slice(-8)} color="var(--accent)" />
        <p className="footnote">
          Screener standardized financials · not fully reconciled to filing.
          Operating profit is not labelled EBITDA. Same-quarter last year
          appears in Sources.
        </p>
      </div>
    );
  }
  function archiveAlert(id: string) {
    setInbox((ids) => ids.filter((x) => x !== id));
    action("Alert archived", () =>
      setInbox((ids) => [...new Set([...ids, id])]),
    );
  }
  function muteCompany(t: string, c: string) {
    const key = t + c;
    setMuted((m) => [...new Set([...m, key])]);
    action(`Muted ${label(c)} for ${t}`, () =>
      setMuted((m) => m.filter((x) => x !== key)),
    );
  }
  function card(f: (typeof all)[number]) {
    const r = research[f.ticker],
      open = expanded === f.id,
      passages = data.filingPassages[f.id] || [];
    return (
      <motion.article
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`filing ${f.priority >= 70 ? "lead" : "compact-filing"}`}
        style={{ "--priority": `${f.priority}%` } as React.CSSProperties}
        key={`${f.ticker}-${f.id}`}
        onContextMenu={(e) => {
          e.preventDefault();
          setDetail(f.id);
        }}
        onTouchStart={(e) => {
          touch.current = e.touches[0].clientX;
          longPress.current = setTimeout(() => setDetail(f.id), 550);
        }}
        onTouchMove={() => {
          if (longPress.current) clearTimeout(longPress.current);
        }}
        onTouchEnd={(e) => {
          if (longPress.current) clearTimeout(longPress.current);
          const dx = e.changedTouches[0].clientX - touch.current;
          if (dx > 90) {
            setPins((p) => (p.includes(f.id) ? p : p.concat(f.id)));
            action("Filing pinned");
          } else if (dx < -90) {
            muteCompany(f.ticker, f.category);
          }
        }}
      >
        <div className="card-meta">
          <span className="ticker">{f.ticker}</span>
          <span className="category">{label(f.category)}</span>
          <span className="time">
            {Math.max(
              0,
              Math.floor((+new Date(data.asOf) - +new Date(f.ts_iso)) / 36e5),
            )}
            h ago
          </span>
        </div>
        <button
          className="headline-button"
          onClick={() => {
            setExpanded(open ? null : f.id);
            setDetail(f.id);
          }}
          aria-expanded={open}
        >
          <h2 className="filing-title">{f.headline}</h2>
          <span>{open ? "−" : "+"}</span>
        </button>
        <p className="why">
          {f.body
            ? f.body.replace(/\s+/g, " ").split(" ").slice(0, 18).join(" ")
            : "New exchange disclosure; review the original before making an investment decision."}
        </p>
        {f.category === "results" &&
          r &&
          (open || f.priority >= 70) &&
          results(r, true)}
        {f.category === "management_change" && passages.length > 0 && (
          <ManagementCard passages={passages} showSources={setSources} />
        )}
        {open && (
          <div className="detail">
            <p>
              {f.body ||
                "No additional filing text was provided by the exchange."}
            </p>
            <p className="footnote">
              Priority {f.priority}/100 · {f.source} ·{" "}
              {new Date(f.ts_iso).toLocaleString("en-IN")}
            </p>
            <div className="actions">
              <button
                onClick={() => {
                  setPins((p) =>
                    p.includes(f.id)
                      ? p.filter((x) => x !== f.id)
                      : p.concat(f.id),
                  );
                  action("Pin updated");
                }}
              >
                {pins.includes(f.id) ? "Unpin" : "Pin"}
              </button>
              <button
                onClick={() => {
                  muteCompany(f.ticker, f.category);
                }}
              >
                Mute category
              </button>
              <button
                onClick={() => {
                  setTicker(f.ticker);
                  setQuery(`${f.ticker} ${f.headline}`);
                  go("Ask");
                }}
              >
                Ask FINN ↗
              </button>
            </div>
          </div>
        )}
        <div className="card-bottom">
          <span className="score">
            <i /> {pins.includes(f.id) ? "Pinned · " : ""}
            {tier(f.priority)} <span className="muted">/ {f.priority}</span>
          </span>
          <a href={f.attachment_url} target="_blank" rel="noreferrer">
            Original filing ↗
          </a>
        </div>
      </motion.article>
    );
  }
  return (
    <div className="app-shell">
      <aside className="rail">
        <button
          className="brand"
          aria-label="FINN, triple tap for diagnostics"
          onClick={() => {
            taps.current++;
            if (taps.current >= 3) {
              setDebug(!debug);
              taps.current = 0;
            }
            setTimeout(() => (taps.current = 0), 1000);
          }}
        >
          finn<span>®</span>
        </button>
        <div className="rail-caption">THE INVESTOR’S FILTER</div>
        <nav>
          {["Today", "Ask", "Watch"].map((t) => (
            <button
              className={tab === t ? "active" : ""}
              key={t}
              onClick={() => go(t)}
            >
              <Icon name={t} />
              <span>{t}</span>
              {t === "Watch" &&
                inbox.filter((id) => !read.includes(id)).length > 0 && (
                  <i className="unread-dot" />
                )}
            </button>
          ))}
        </nav>
        <div className="rail-bottom">
          <span className="status-dot" />{" "}
          {online ? "Snapshot ready" : "Offline · snapshot ready"}
          <p>
            Less noise.
            <br />
            More conviction.
          </p>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <TerminalTools
            filings={data.filings}
            companies={[
              ...data.portfolio,
              ...Object.keys(research)
                .filter((t) => !data.portfolio.some((p) => p.ticker === t))
                .map((t) => ({ ticker: t, name: t })),
            ]}
            select={(t) => {
              setTicker(t);
              setQuery(t);
              go("Ask");
            }}
          />
          <span className="edition">PRIVATE MARKETS OF ATTENTION</span>
          <span className="demo-badge">SAVED DATA</span>
          <span className="date">
            {new Date(data.asOf).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </header>
        <main
          onTouchStart={(e) => {
            if (window.scrollY === 0) pullStart.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            if (
              pullStart.current &&
              e.changedTouches[0].clientY - pullStart.current > 110
            ) {
              action(
                "Saved snapshot checked. Live refresh runs through the pipeline.",
              );
            }
            pullStart.current = 0;
          }}
        >
          {coach && tab === "Today" && (
            <div className="coach" role="status">
              Swipe right to pin. Left to quiet.
              <button
                onClick={() => {
                  setCoach(false);
                  try {
                    localStorage.setItem("finn-coach", "seen");
                  } catch {}
                }}
              >
                Got it
              </button>
            </div>
          )}
          {tab === "Today" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR DAILY EDGE / 01</div>
                  <h1>
                    Signal over noise<span>.</span>
                  </h1>
                  <p>
                    The few things in your portfolio that deserve your time.
                  </p>
                </div>
                <button
                  className="refresh"
                  onClick={() => {
                    action(
                      "Snapshot checked. Run the refresh pipeline for new exchange data.",
                    );
                  }}
                  aria-label="Refresh digest"
                >
                  ↻
                </button>
              </div>
              <div className="digest-stat">
                <span>
                  <b>{shown.length}</b> filings scanned
                </span>
                <span>
                  <b>{must.length + worth.length}</b> need your attention
                </span>
                <span className="muted">
                  18 holdings · as of{" "}
                  {new Date(data.asOf).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  IST
                </span>
              </div>
              <Pulse
                count={must.length + worth.length}
                ticker={shown[0]?.ticker}
              />
              <div className="heat-label eyebrow">
                PORTFOLIO TEMPERATURE <span>DAY CHANGE / TAP TO FILTER</span>
              </div>
              <div className="market-strip heat-grid">
                {movers.map((p) => (
                  <button
                    key={p.ticker}
                    aria-pressed={company === p.ticker}
                    data-direction={p.bar!.pct_change >= 0 ? "up" : "down"}
                    style={
                      {
                        "--heat": Math.min(
                          0.3,
                          0.05 + Math.abs(p.bar!.pct_change) * 0.04,
                        ),
                      } as React.CSSProperties
                    }
                    onClick={() => {
                      setCompany(company === p.ticker ? "" : p.ticker);
                      setChart(p.ticker);
                    }}
                  >
                    <span>{p.ticker}</span>
                    <b
                      className={
                        p.bar!.pct_change >= 0 ? "positive" : "negative"
                      }
                    >
                      {signed(p.bar!.pct_change)}
                    </b>
                    <Spark
                      values={(data.prices[p.ticker] as Bar[])
                        .slice(-20)
                        .map((x) => x.close)}
                      color={
                        p.bar!.pct_change >= 0 ? "var(--green)" : "var(--red)"
                      }
                    />
                  </button>
                ))}
              </div>
              <div className="toolbar">
                <div className="segmented">
                  {[1, 3, 7, 30].map((d) => (
                    <button
                      key={d}
                      className={days === d && !from && !to ? "selected" : ""}
                      onClick={() => {
                        setDays(d);
                        setFrom("");
                        setTo("");
                      }}
                    >
                      {d === 1 ? "24h" : `${d}d`}
                    </button>
                  ))}
                  <button
                    onClick={() => setCustom(true)}
                    aria-label="Custom date range"
                  >
                    ⌁
                  </button>
                </div>
                <select
                  aria-label="Filter company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                >
                  <option value="">All holdings</option>
                  {data.portfolio.map((p) => (
                    <option key={p.ticker}>{p.ticker}</option>
                  ))}
                </select>
              </div>
              <div className="chips">
                <button
                  className={category === "all" ? "selected" : ""}
                  onClick={() => setCategory("all")}
                >
                  All signals
                </button>
                {[
                  "results",
                  "management_change",
                  "M&A",
                  "litigation",
                  "earnings_call",
                ].map((c) => (
                  <button
                    className={
                      category.split(",").includes(c) ? "selected" : ""
                    }
                    key={c}
                    onClick={() =>
                      setCategory((prev) => {
                        const selected = prev === "all" ? [] : prev.split(",");
                        const next = selected.includes(c)
                          ? selected.filter((x) => x !== c)
                          : [...selected, c];
                        return next.join(",") || "all";
                      })
                    }
                  >
                    {label(c)}
                  </button>
                ))}
              </div>
              <div className="feed-layout">
                <section className="feed">
                  <div className="section-label">
                    <span>
                      <i className="status-dot" /> MUST-SEE
                    </span>
                    <span>{String(must.length).padStart(2, "0")}</span>
                  </div>
                  {must.length ? (
                    must.map(card)
                  ) : (
                    <div className="quiet">
                      <span>✓</span>
                      <p>
                        No urgent disclosures in this window.
                        <br />
                        <small>Your attention is yours.</small>
                      </p>
                    </div>
                  )}
                  <div className="section-label">
                    <span>WORTH A LOOK</span>
                    <span>{String(worth.length).padStart(2, "0")}</span>
                  </div>
                  {worth.length ? (
                    worth.map(card)
                  ) : (
                    <p className="muted empty-line">
                      No medium-priority filings. Try a wider window.
                    </p>
                  )}
                  <button
                    className="routine-toggle"
                    onClick={() => setRoutine(!routine)}
                    aria-expanded={routine}
                  >
                    <span>
                      <b>{other.length}</b> routine filings
                      <br />
                      <small>Filed, filtered, out of your way.</small>
                    </span>
                    <span>{routine ? "−" : "+"}</span>
                  </button>
                  {routine && other.map(card)}
                  {muted.length > 0 && (
                    <button
                      className="text-button"
                      onClick={() => setMuted([])}
                    >
                      Restore {muted.length} muted company categories
                    </button>
                  )}
                </section>
                <aside className="context-panel">
                  <div className="eyebrow">A BETTER QUESTION</div>
                  <h2>Did they deliver?</h2>
                  <p>
                    Put management’s words next to the numbers. See the evidence
                    before the verdict.
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      go("Ask");
                      setModule("Numbers vs narrative");
                    }}
                  >
                    Numbers vs narrative <span>↗</span>
                  </button>
                  <div className="context-divider" />
                  <div className="eyebrow">HOW FINN FILTERS</div>
                  <ol>
                    <li>Materiality of the disclosure</li>
                    <li>Your portfolio exposure</li>
                    <li>Recency and market reaction</li>
                  </ol>
                  <p className="footnote">
                    Ranked relative to the latest saved filing. Sources,
                    timestamps and missing coverage stay visible.
                  </p>
                  <div className="coverage">
                    <b>
                      {
                        Object.values(data.prices).filter(
                          (x) => (x as Bar[]).length,
                        ).length
                      }
                      /18
                    </b>
                    <span>
                      price snapshots
                      <br />
                      in this edition
                    </span>
                  </div>
                </aside>
              </div>
            </>
          )}
          {tab === "Ask" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">PRIMARY SOURCES / 02</div>
                  <h1>
                    Words. Meet numbers<span>.</span>
                  </h1>
                  <p>Research that shows its working.</p>
                </div>
              </div>
              <form
                className="ask-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  ask();
                }}
              >
                <Icon name="Ask" />
                <input
                  aria-label="Ticker or research question"
                  placeholder="NSE ticker, company or a follow-up…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="primary" disabled={!!loading}>
                  Ask ↗
                </button>
              </form>
              <div className="suggestions">
                {["INFY", "WIPRO", "HCLTECH", "PIDILITIND", "TRENT"].map(
                  (t) => (
                    <button
                      className={ticker === t ? "selected" : ""}
                      key={t}
                      onClick={() => {
                        setTicker(t);
                        setQuery("");
                      }}
                    >
                      {t}
                    </button>
                  ),
                )}
              </div>
              <div className="lens-label eyebrow">
                CHOOSE A LENS <span>Saved evidence · no model calls</span>
              </div>
              <div className="chips module-chips">
                {[
                  "Numbers vs narrative",
                  "Financial snapshot",
                  "Guidance",
                  "Cash quality",
                  "Trajectory",
                  "Balance sheet",
                  "Business",
                  "Bull vs bear",
                ].map((m) => (
                  <button
                    key={m}
                    className={module === m ? "selected" : ""}
                    title={
                      (
                        {
                          "Numbers vs narrative":
                            "Explicit targets beside subsequent disclosures",
                          "Financial snapshot":
                            "Quarterly numbers, margins and change",
                          Guidance: "Management’s numeric forward statements",
                          "Cash quality":
                            "Cash generation beside reported profit",
                        } as Record<string, string>
                      )[m]
                    }
                    onClick={() => {
                      setModule(m);
                      setQuery("");
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {loading || !researchReady ? (
                <div className="loading" role="status">
                  <div className="spinner" />
                  <div
                    className="reading-rail"
                    role="progressbar"
                    aria-label="Source retrieval"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={loading.includes("Reading") ? 75 : 25}
                  >
                    <i
                      style={{
                        width: loading.includes("Reading") ? "75%" : "25%",
                      }}
                    />
                  </div>
                  <div className="reading-skeleton" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                  <h2>{loading || "Opening saved source passages…"}</h2>
                  <p>
                    Retrieving disclosures. Checking the source, not guessing.
                  </p>
                </div>
              ) : !current || current.status === "not_available" ? (
                <div className="empty">
                  <h2>No saved disclosures for {ticker}.</h2>
                  <p>
                    Enter the ticker and tap Ask to try primary-source
                    retrieval. A blocked source stays unavailable.
                  </p>
                  <button className="primary" onClick={() => ask()}>
                    Try live retrieval ↗
                  </button>
                </div>
              ) : (
                <ResearchCards
                  r={current}
                  module={module}
                  query={query}
                  results={results}
                  showSources={setSources}
                />
              )}
              <Composer value={query} change={setQuery} send={() => ask()} />
              {history[ticker]?.length > 0 && (
                <details className="session-history">
                  <summary>Research history · {ticker}</summary>
                  {history[ticker].map((h, i) => (
                    <button key={i} onClick={() => setQuery(h)}>
                      {h}
                    </button>
                  ))}
                </details>
              )}
            </>
          )}
          {tab === "Watch" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR ATTENTION, YOUR RULES / 03</div>
                  <h1>
                    Keep a quiet watch<span>.</span>
                  </h1>
                  <p>Set the threshold. FINN keeps the shortlist.</p>
                </div>
              </div>
              <div className="watch-layout">
                <section className="panel">
                  <div className="section-label">
                    <span>ALERT RULES</span>
                    <span>Saved on this device</span>
                  </div>
                  <label className="field">
                    Scope
                    <select
                      value={rule.ticker}
                      onChange={(e) =>
                        setRule({ ...rule, ticker: e.target.value })
                      }
                    >
                      <option value="">Entire portfolio</option>
                      {data.portfolio.map((p) => (
                        <option key={p.ticker}>{p.ticker}</option>
                      ))}
                    </select>
                  </label>
                  <label className="slider-label">
                    Daily price move <b>±{rule.move}%</b>
                    <input
                      aria-label="Daily price move threshold"
                      type="range"
                      min="1"
                      max="12"
                      step=".5"
                      value={rule.move}
                      onChange={(e) =>
                        setRule({ ...rule, move: +e.target.value })
                      }
                    />
                  </label>
                  <label className="slider-label">
                    Volume vs 20-day average <b>{rule.volume.toFixed(1)}×</b>
                    <input
                      aria-label="Volume threshold"
                      type="range"
                      min="1"
                      max="5"
                      step=".1"
                      value={rule.volume}
                      onChange={(e) =>
                        setRule({ ...rule, volume: +e.target.value })
                      }
                    />
                  </label>
                  <div className="field">
                    Filing categories
                    <div className="chips">
                      {Object.keys(weights).map((c) => (
                        <button
                          className={
                            rule.categories.includes(c) ? "selected" : ""
                          }
                          key={c}
                          onClick={() =>
                            setRule({
                              ...rule,
                              categories: rule.categories.includes(c)
                                ? rule.categories.filter((x) => x !== c)
                                : rule.categories.concat(c),
                            })
                          }
                        >
                          {label(c)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="slider-label">
                    Minimum filing priority <b>{rule.minimum}</b>
                    <input
                      aria-label="Minimum filing priority"
                      type="range"
                      min="0"
                      max="100"
                      value={rule.minimum}
                      onChange={(e) =>
                        setRule({ ...rule, minimum: +e.target.value })
                      }
                    />
                  </label>
                  <button
                    className="primary full"
                    onClick={() => {
                      const latestDay = alertItems[0]?.date;
                      const hits = alertItems
                        .filter((x) => x.date === latestDay)
                        .map((x) => x.id);
                      setInbox((ids) => [...new Set([...hits, ...ids])]);
                      action(
                        hits.length
                          ? `${hits.length} latest-session alerts replayed. Duplicate alerts suppressed.`
                          : "No alerts match. Lower a threshold to preview more.",
                      );
                    }}
                  >
                    Run check now <span>↗</span>
                  </button>
                  <p className="footnote">
                    Replays the latest matching saved session. Price OR volume
                    triggers; selected categories also require minimum priority.
                  </p>
                </section>
                <section>
                  <Timeline
                    dates={alertItems.map((x) => x.date)}
                    asOf={data.asOf}
                  />
                  <div className="preview-stat">
                    <b>{alertItems.length}</b>
                    <div>
                      alerts would have fired
                      <small>last 30 calendar days of saved data</small>
                    </div>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      const previous = inbox;
                      setInbox([]);
                      action("Inbox archived", () => setInbox(previous));
                    }}
                  >
                    Archive inbox
                  </button>
                  <div className="section-label">
                    <span>
                      INBOX · {inbox.filter((id) => !read.includes(id)).length}{" "}
                      UNREAD
                    </span>
                    <button
                      className="text-button"
                      onClick={() => setRead(inbox)}
                    >
                      Mark all read
                    </button>
                  </div>
                  {inbox.length === 0 && (
                    <p className="muted">
                      Run a check to replay alerts into your inbox.
                    </p>
                  )}
                  {alertItems
                    .filter((a) => inbox.includes(a.id))
                    .slice(0, 8)
                    .map((a) => (
                      <div
                        className="inbox-entry"
                        key={`${a.ticker}-${a.id}-${a.text}`}
                        onTouchStart={(e) => {
                          touch.current = e.touches[0].clientX;
                        }}
                        onTouchEnd={(e) => {
                          if (e.changedTouches[0].clientX - touch.current < -80)
                            archiveAlert(a.id);
                        }}
                      >
                        <button
                          className={`alert-row ${read.includes(a.id) ? "read" : ""}`}
                          onClick={() => {
                            setRead((r) => [...new Set([...r, a.id])]);
                            setCompany(a.ticker);
                            setDays(30);
                            const filing = all.find((f) => f.id === a.id);
                            if (filing) setDetail(filing.id);
                            go("Today");
                          }}
                        >
                          <b>{a.ticker}</b>
                          <span>{a.text}</span>
                          <small>
                            {a.date} · {a.kind} ↗
                          </small>
                        </button>
                        <button
                          aria-label={`Archive ${a.ticker} alert`}
                          onClick={() => archiveAlert(a.id)}
                        >
                          Archive
                        </button>
                      </div>
                    ))}
                  <details className="preview-details">
                    <summary>Inspect matching sessions</summary>
                    <div className="section-label">
                      <span>LIVE RULE PREVIEW</span>
                      <span>Most recent first</span>
                    </div>
                    {alertItems.slice(0, 15).map((a) => (
                      <div
                        className="alert-row"
                        key={`${a.ticker}-${a.id}-${a.text}`}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setInbox((ids) => ids.filter((id) => id !== a.id));
                          undo.current = () =>
                            setInbox((ids) => [...new Set([...ids, a.id])]);
                          action("Alert archived");
                        }}
                      >
                        <b>{a.ticker}</b>
                        <span>{a.text}</span>
                        <small>
                          {a.date} · {a.kind}
                        </small>
                      </div>
                    ))}
                  </details>
                </section>
              </div>
              <Holdings
                items={movers.map((p) => ({
                  ticker: p.ticker,
                  weight_pct: p.weight_pct,
                  move: p.bar!.pct_change,
                  volume: p.bar!.vol_ratio,
                  values: (data.prices[p.ticker] as Bar[])
                    .slice(-20)
                    .map((x) => x.close),
                }))}
                select={(t) => {
                  setTicker(t);
                  go("Ask");
                }}
              />
            </>
          )}
          <footer className="page-footer">
            <span>FINN / INVESTOR DESK</span>
            <span>Primary evidence. Independent judgment.</span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav">
        {["Today", "Ask", "Watch"].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => go(t)}
          >
            <Icon name={t} />
            {t}
            {t === "Watch" && inbox.some((id) => !read.includes(id)) && (
              <i className="unread-dot" />
            )}
          </button>
        ))}
      </nav>
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="toast"
            role="status"
          >
            {notice}
            {undo.current && (
              <button
                onClick={() => {
                  undo.current?.();
                  undo.current = null;
                  setNotice("Action undone");
                }}
              >
                Undo
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {sources && (
        <Sheet title="Source passages" close={() => setSources(null)}>
          <button
            aria-label="Close sources"
            className="text-button"
            onClick={() => setSources(null)}
          >
            Back to research
          </button>
          {sources.map((s, i) => (
            <article className="source" key={i}>
              <div className="eyebrow">
                {s.doc_id} · {s.page ? `PAGE ${s.page}` : "STANDARDIZED TABLE"}
              </div>
              <p className="muted">{s.period}</p>
              <blockquote>
                <mark>{s.text}</mark>
              </blockquote>
              <button
                className="text-button"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(
                      `${s.doc_id} · ${s.period} · p.${s.page}: ${s.text}`,
                    )
                    .then(() => action("Citation copied"))
                    .catch(() => action("Copy unavailable in this browser"));
                }}
              >
                Copy citation ↗
              </button>
              <a
                target="_blank"
                rel="noreferrer"
                href={s.url + (s.page ? `#page=${s.page}` : "")}
              >
                Open original source ↗
              </a>
            </article>
          ))}
        </Sheet>
      )}
      {detail &&
        (() => {
          const f = all.find((x) => x.id === detail);
          return f ? (
            <Sheet
              title={`${f.ticker} / ${label(f.category)}`}
              close={() => setDetail(null)}
            >
              <h3>{f.headline}</h3>
              <p>{f.body}</p>
              {f.category === "results" &&
                research[f.ticker] &&
                results(research[f.ticker])}
              <div className="actions">
                <button
                  onClick={() => {
                    setPins((p) =>
                      p.includes(f.id)
                        ? p.filter((x) => x !== f.id)
                        : [...p, f.id],
                    );
                    action("Pin updated");
                  }}
                >
                  Toggle pin
                </button>
                <button
                  onClick={() => {
                    muteCompany(f.ticker, f.category);
                    setDetail(null);
                  }}
                >
                  Mute category
                </button>
                <button
                  onClick={() => {
                    setTicker(f.ticker);
                    setDetail(null);
                    go("Ask");
                  }}
                >
                  Ask FINN
                </button>
              </div>
              <a href={f.attachment_url} target="_blank" rel="noreferrer">
                Original filing ↗
              </a>
            </Sheet>
          ) : null;
        })()}
      {chart && (
        <Sheet title={`${chart} / market record`} close={() => setChart(null)}>
          <Spark
            values={((data.prices[chart] as Bar[]) || [])
              .slice(-20)
              .map((b) => b.close)}
          />
          <p>Last 20 saved sessions · adjusted close</p>
          <p className="footnote">
            {signed(latest(chart)?.pct_change ?? null)} ·{" "}
            {latest(chart)?.vol_ratio.toFixed(1)}× volume
          </p>
          <button
            onClick={() => {
              setTicker(chart);
              setChart(null);
              go("Ask");
            }}
          >
            Research company ↗
          </button>
        </Sheet>
      )}
      {custom && (
        <Sheet title="Choose your window." close={() => setCustom(false)}>
          <DateWindow
            dates={data.filings.map((f) => f.ts_iso.slice(0, 10))}
            asOf={data.asOf}
            from={from}
            to={to}
            change={(f, t) => {
              setFrom(f);
              setTo(t);
            }}
          />
          <label className="field">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="field">
            To
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <button className="primary full" onClick={() => setCustom(false)}>
            Apply window
          </button>
        </Sheet>
      )}
      {debug && (
        <div className="sheet-backdrop">
          <section
            className="sheet"
            role="dialog"
            aria-label="Cost diagnostics"
          >
            <div className="sheet-header">
              <h2>Under the hood.</h2>
              <button
                aria-label="Close diagnostics"
                onClick={() => setDebug(false)}
              >
                ×
              </button>
            </div>
            <div className="debug-grid">
              <b>
                $0.00<small>demo model spend</small>
              </b>
              <b>
                0<small>LLM tokens used</small>
              </b>
              <b>
                {data.filings.length}
                <small>cached filings</small>
              </b>
              <b>
                {Object.values(research).reduce(
                  (n, r) => n + r.chunks.length,
                  0,
                )}
                <small>source pages</small>
              </b>
            </div>
            <p>
              Rules, arithmetic and evidence retrieval run in code. No API calls
              are needed for this snapshot. Provider adapters are available for
              future schema-validated reasoning; the demo does not invent
              verdicts.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
function ResearchCards({
  r,
  module,
  query,
  results,
  showSources,
}: {
  r: Research;
  module: string;
  query: string;
  results: (r: Research, compact?: boolean) => React.ReactNode;
  showSources: (s: Citation[]) => void;
}) {
  const promises = narrative(r),
    g = guidance(r),
    cash = cashRows(r),
    financial = financialRows(r),
    score = credibility(promises.map((x) => x.verdict));
  const passages = query.split(/\s/).length > 1 ? searchPassages(r, query) : [];
  return (
    <div className="research-content">
      <div className="research-header">
        <div>
          <span className="ticker">{r.ticker}</span>
          <span className="muted">
            {" "}
            / {r.docs.length} source documents · {r.chunks.length} pages
          </span>
        </div>
        <span className="verified">PRIMARY SOURCES ONLY</span>
      </div>
      {passages.length > 0 && (
        <section className="panel">
          <div className="eyebrow">
            RELEVANT SOURCE PASSAGES · EXTRACTIVE RETRIEVAL
          </div>
          {passages.map((p, i) => (
            <button
              className="passage"
              key={i}
              onClick={() => showSources([p])}
            >
              {p.text.slice(0, 320)}… <span>p.{p.page} ↗</span>
            </button>
          ))}
          <p className="footnote">
            Keyword retrieval, not a generated answer. Open passages to inspect
            context.
          </p>
        </section>
      )}
      <ExtraLenses r={r} lens={module} source={showSources} />
      {module === "Numbers vs narrative" && (
        <>
          <div className="credibility-card">
            <div>
              <div className="eyebrow">THE STATEMENT LEDGER</div>
              <h2>Promises need a period.</h2>
              <p>Explicit forward statements, with the evidence kept close.</p>
            </div>
            <div className="credibility-score" style={{ display: "none" }}>
              {score ?? "—"}
              <small>{score === null ? "Not scored" : "/ 100"}</small>
            </div>
          </div>
          <Ring
            score={score}
            counts={Object.fromEntries(
              ["met", "partially", "missed", "unclear", "not_yet_due"].map(
                (v) => [v, promises.filter((p) => p.verdict === v).length],
              ),
            )}
          />
          <div
            className="cohort-trend"
            role="img"
            aria-label="Scores by statement period, excluding pending claims"
          >
            {[...new Set(promises.map((p) => p.sources[0].period))]
              .filter((period) =>
                promises.some(
                  (p) =>
                    p.sources[0].period === period &&
                    ["met", "missed", "partially"].includes(p.verdict),
                ),
              )
              .slice(0, 4)
              .reverse()
              .map((period) => {
                const value = credibility(
                  promises
                    .filter((p) => p.sources[0].period === period)
                    .map((p) => p.verdict),
                );
                return (
                  <div key={period}>
                    <i style={{ height: `${value ?? 0}%` }} />
                    <b>{value ?? "—"}</b>
                    <small>{period.split(" Transcript")[0]}</small>
                  </div>
                );
              })}
          </div>
          <div className="evidence-note">
            Verdicts compare the same metric and currency basis across completed
            periods. Pending targets are excluded from the score; every
            comparison opens both passages.
          </div>
          {promises.length ? (
            promises.map((p, i) => (
              <motion.article
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="promise-card"
                key={i}
              >
                {(i === 0 ||
                  promises[i - 1].sources[0].period !==
                    p.sources[0].period) && (
                  <div className="quarter-label">
                    {p.sources[0].period.split(" Transcript")[0]}
                  </div>
                )}
                <div className="card-meta">
                  <span className="category">{p.metric}</span>
                  <span className="muted">
                    {p.sources[0].period.split(" Transcript")[0]}
                  </span>
                  <span className={`verdict verdict-${p.verdict}`}>
                    {label(p.verdict)}
                  </span>
                </div>
                <h3>{p.statement}</h3>
                <div className="promise-compare">
                  <div>
                    <small>MANAGEMENT SAID</small>
                    <b>{p.target || "See statement"}</b>
                  </div>
                  <div>
                    <small>COMPARABLE ACTUAL</small>
                    <b
                      className={p.delivered === "not_disclosed" ? "muted" : ""}
                    >
                      {p.delivered}
                    </b>
                  </div>
                </div>
                <Gap target={p.target || ""} delivered={p.delivered} />
                <button
                  className="source-button"
                  onClick={() => showSources(p.sources)}
                >
                  Read exact passage · p.{p.sources[0].page} ↗
                </button>
              </motion.article>
            ))
          ) : (
            <div className="empty">
              <h2>No explicit numeric forward statements found.</h2>
              <p>
                not_disclosed · Available documents did not yield a qualifying
                statement. Financial tables remain available.
              </p>
            </div>
          )}
          <section className="panel">
            <div className="eyebrow">
              THE LATEST NUMBERS / SEPARATE FROM PROMISES
            </div>
            {results(r)}
          </section>
        </>
      )}
      {module === "Financial snapshot" && (
        <section className="panel">
          <div className="section-label">
            <span>QUARTERLY PERFORMANCE</span>
            <span>CONSOLIDATED IF AVAILABLE</span>
          </div>
          {results(r)}
          <div className="small-multiples">
            {financial.slice(0, 4).map((row) => (
              <button key={row.name} onClick={() => showSources([row.source])}>
                <small>{row.name}</small>
                <b>{fmt(row.current)}</b>
                <Spark values={row.values.slice(-8)} />
                <span className={(row.yoy ?? 0) >= 0 ? "positive" : "negative"}>
                  {signed(row.yoy)} YoY ↗
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      {module === "Guidance" && (
        <section className="panel">
          <div className="section-label">
            <span>EXPLICIT MANAGEMENT OUTLOOK</span>
            <span>{g.length} passages</span>
          </div>
          {g.length ? (
            g.map((x, i) => (
              <article className="guidance-row" key={i}>
                <span className="eyebrow">
                  {x.source.period.split(" Transcript")[0]}
                </span>
                <h3>{x.s}</h3>
                <button
                  className="source-button"
                  onClick={() => showSources([x.source])}
                >
                  Source · page {x.source.page} ↗
                </button>
              </article>
            ))
          ) : (
            <p>
              not_disclosed · No qualifying numeric guidance in the saved
              transcripts.
            </p>
          )}
          <p className="footnote">
            Revisions require metric and period alignment. No revision is
            inferred from unmatched statements.
          </p>
        </section>
      )}
      {module === "Cash quality" && (
        <section className="panel">
          <div className="section-label">
            <span>CASH FROM OPERATIONS VS PROFIT</span>
            <span>₹ CRORE</span>
          </div>
          {cash.length ? (
            <>
              <div className="cash-chart">
                {cash.map((x) => (
                  <div key={x.period}>
                    <div className="cash-bars">
                      <i
                        style={{
                          height: Math.max(
                            4,
                            (Math.abs(x.cfo) /
                              Math.max(
                                ...cash.map((y) =>
                                  Math.max(
                                    Math.abs(y.cfo),
                                    Math.abs(y.pat ?? 0),
                                  ),
                                ),
                              )) *
                              140,
                          ),
                        }}
                      />
                      <i
                        style={{
                          height: Math.max(
                            4,
                            (Math.abs(x.pat ?? 0) /
                              Math.max(
                                ...cash.map((y) =>
                                  Math.max(
                                    Math.abs(y.cfo),
                                    Math.abs(y.pat ?? 0),
                                  ),
                                ),
                              )) *
                              140,
                          ),
                        }}
                      />
                    </div>
                    <small>{x.period}</small>
                  </div>
                ))}
              </div>
              <p className="legend">
                <i /> Cash from operations <i /> Profit after tax
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>CFO</th>
                    <th>PAT</th>
                    <th>CFO / PAT</th>
                  </tr>
                </thead>
                <tbody>
                  {cash.map((x) => (
                    <tr key={x.period}>
                      <td>{x.period}</td>
                      <td>{fmt(x.cfo)}</td>
                      <td>{x.pat === null ? "—" : fmt(x.pat)}</td>
                      <td>
                        {x.pat ? `${((x.cfo / x.pat) * 100).toFixed(0)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                className="source-button"
                onClick={() =>
                  showSources([
                    {
                      doc_id: `${r.ticker}-screener`,
                      period: "Annual cash flow and profit and loss",
                      page: 0,
                      url: r.source_url ?? "",
                      text: JSON.stringify(
                        {
                          "cash-flow": r.tables["cash-flow"],
                          "profit-loss": r.tables["profit-loss"],
                        },
                        null,
                        2,
                      ),
                    },
                  ])
                }
              >
                Inspect source tables ↗
              </button>
              <p className="footnote">
                Annual periods aligned by year; negative flows retain their sign
                in the table. FCF is not inferred without cash capex.
              </p>
            </>
          ) : (
            <p>not_disclosed · Annual cash-flow table unavailable.</p>
          )}
        </section>
      )}
    </div>
  );
}
function ManagementCard({
  passages,
  showSources,
}: {
  passages: Citation[];
  showSources: (s: Citation[]) => void;
}) {
  const text = passages.map((x) => x.text).join(" ");
  const name = text.match(
    /(?:Mr\.|Ms\.|Shri)\s+([A-Z][\p{L}’' -]{3,50}?)\s+(?:has|was|is|will)/u,
  )?.[1];
  const role = text.match(
    /(?:ceased to be the|appointed as(?: the)?)\s+(.{5,150}?)(?:\.| and a Senior)/i,
  )?.[1];
  const date = text.match(
    /(?:on|from)\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2})/,
  )?.[1];
  return (
    <section className="management">
      <div className="eyebrow">FROM THE FILING</div>
      <div className="profile-initials" aria-hidden="true">
        {name
          ? name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
          : "—"}
      </div>
      <h3>{name || "Management disclosure"}</h3>
      {role && <p>{role}</p>}
      <div className="management-facts">
        <span>
          {/superannuated|retir/i.test(text)
            ? "Retirement"
            : /resign/i.test(text)
              ? "Resignation"
              : "Role change"}
        </span>
        {date && <span>{date}</span>}
      </div>
      <button className="source-button" onClick={() => showSources(passages)}>
        Read disclosure · primary source ↗
      </button>
    </section>
  );
}
