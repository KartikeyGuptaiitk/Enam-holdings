"use client";
import { useState, useEffect, useCallback } from "react";
import { matches } from "../../lib/view/search";
import { Sheet } from "./sheet";
export function TerminalTools({
  companies,
  select,
  filings = [],
}: {
  companies: { ticker: string; name: string }[];
  select: (ticker: string) => void;
  filings?: { ticker: string; headline: string; id: string }[];
}) {
  const [panel, setPanel] = useState(""),
    [query, setQuery] = useState(""),
    [theme, setTheme] = useState("system"),
    [density, setDensity] = useState("comfortable"),
    [haptics, setHaptics] = useState(false),
    [intro, setIntro] = useState(0),
    [defaultWindow, setDefaultWindow] = useState("1"),
    [recents, setRecents] = useState<string[]>([]);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const close = useCallback(() => {
    setPanel("");
    try {
      localStorage.setItem("finn-intro", "seen");
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("finn-prefs") || "{}");
      setTheme(p.theme || "system");
      setDensity(p.density || "comfortable");
      setHaptics(!!p.haptics);
      setDefaultWindow(p.defaultWindow || "1");
      setRecents(JSON.parse(localStorage.getItem("finn-recents") || "[]"));
      if (!localStorage.getItem("finn-intro")) setPanel("intro");
    } catch {}
    setPrefsLoaded(true);
    const key = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" &&
          !/INPUT|TEXTAREA/.test((e.target as HTMLElement).tagName))
      ) {
        e.preventDefault();
        setPanel("search");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!prefsLoaded) return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = density;
    try {
      localStorage.setItem(
        "finn-prefs",
        JSON.stringify({ theme, density, haptics, defaultWindow }),
      );
    } catch {}
  }, [theme, density, haptics, defaultWindow, prefsLoaded]);
  useEffect(() => {
    if (!haptics) return;
    const tick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) navigator.vibrate?.(10);
    };
    document.addEventListener("click", tick);
    return () => document.removeEventListener("click", tick);
  }, [haptics]);
  return (
    <>
      <div className="terminal-tools">
        <button aria-label="Search desk" onClick={() => setPanel("search")}>
          <svg
            viewBox="0 0 24 24"
            width="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="10" cy="10" r="6" />
            <path d="m15 15 6 6" />
          </svg>
          <span>
            Search <kbd>/</kbd>
          </span>
        </button>
        <button aria-label="Desk settings" onClick={() => setPanel("settings")}>
          ☷
        </button>
      </div>
      {panel && (
        <Sheet
          title={
            panel === "search"
              ? "Find your next question."
              : panel === "intro"
                ? "A quieter daily ritual."
                : "Your desk."
          }
          close={close}
        >
          {panel === "search" ? (
            <>
              <input
                className="command-input"
                autoFocus
                aria-label="Search companies"
                placeholder="Company or NSE ticker"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="suggestions">
                {!query &&
                  recents.map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        select(t);
                        close();
                      }}
                    >
                      {t}
                    </button>
                  ))}
              </div>
              <div className="command-results">
                {companies
                  .filter((c) => matches(query, c.ticker + " " + c.name))
                  .slice(0, 12)
                  .map((c) => (
                    <button
                      key={c.ticker}
                      onClick={() => {
                        const next = [
                          c.ticker,
                          ...recents.filter((t) => t !== c.ticker),
                        ].slice(0, 6);
                        setRecents(next);
                        try {
                          localStorage.setItem(
                            "finn-recents",
                            JSON.stringify(next),
                          );
                        } catch {}
                        select(c.ticker);
                        close();
                      }}
                    >
                      <b>{c.ticker}</b>
                      <span>{c.name}</span>
                      <span>↗</span>
                    </button>
                  ))}
                {query &&
                  filings
                    .filter((f) => matches(query, f.ticker + " " + f.headline))
                    .slice(0, 6)
                    .map((f, i) => (
                      <button
                        key={f.id + String(i)}
                        onClick={() => {
                          select(f.ticker);
                          close();
                        }}
                      >
                        <b>{f.ticker}</b>
                        <span>{f.headline}</span>
                      </button>
                    ))}
                <button
                  onClick={() => {
                    select(query.toUpperCase().split(" ")[0] || "INFY");
                    close();
                  }}
                >
                  Research {query || "a company"} ↗
                </button>
              </div>
            </>
          ) : panel === "intro" ? (
            <>
              <button className="text-button" onClick={close}>
                Skip introduction
              </button>
              <div className="intro-number">0{intro + 1} / 03</div>
              <h3>
                {
                  [
                    "Swipe to keep. Swipe to quiet.",
                    "Choose the time that matters.",
                    "Put the claim beside the evidence.",
                  ][intro]
                }
              </h3>
              <p>
                {
                  [
                    "Right pins a filing; left mutes its category. Expanded actions work with a keyboard too.",
                    "24 hours for the daily ritual. Thirty days when you need the longer view.",
                    "Ask compares saved disclosures. Tap a source to read the exact passage.",
                  ][intro]
                }
              </p>
              <button
                className="primary full"
                onClick={() => (intro < 2 ? setIntro(intro + 1) : close())}
              >
                {intro < 2 ? "Next" : "Back to the desk"}
              </button>
            </>
          ) : (
            <>
              <label className="field">
                Appearance
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                >
                  <option value="system">System</option>
                  <option value="ink">Ink</option>
                  <option value="paper">Paper</option>
                </select>
              </label>
              <label className="field">
                Default digest window
                <select
                  value={defaultWindow}
                  onChange={(e) => setDefaultWindow(e.target.value)}
                >
                  {[1, 3, 7, 30].map((d) => (
                    <option key={d} value={d}>
                      {d === 1 ? "24 hours" : `${d} days`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Density
                <select
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                >
                  <option>comfortable</option>
                  <option>compact</option>
                </select>
              </label>
              <label className="field">
                Haptics
                <input
                  type="checkbox"
                  checked={haptics}
                  onChange={(e) => {
                    setHaptics(e.target.checked);
                    if (e.target.checked) navigator.vibrate?.(12);
                  }}
                />
              </label>
              <button
                className="routine-toggle"
                onClick={() => {
                  setIntro(0);
                  setPanel("intro");
                }}
              >
                How to use the desk ↗
              </button>
              <button
                className="text-button"
                onClick={() => {
                  localStorage.removeItem("finn-state");
                  location.reload();
                }}
              >
                Reset saved demo rules and inbox
              </button>
              <p className="footnote">
                Saved disclosures stay on this device. Live sources require a
                connection.
              </p>
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
