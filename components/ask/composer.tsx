"use client";
import { useEffect, useState } from "react";
type Recognition = {
  lang: string;
  onresult:
    | ((event: {
        results: { [key: number]: { [key: number]: { transcript: string } } };
      }) => void)
    | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
export function Composer({
  value,
  change,
  send,
}: {
  value: string;
  change: (s: string) => void;
  send: () => void;
}) {
  const [supported, setSupported] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    setSupported(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    );
  }, []);
  return (
    <form
      className="followup"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <div className="suggestions">
        {["Show the guidance history", "Why did margin fall?"].map((q) => (
          <button type="button" key={q} onClick={() => change(q)}>
            {q}
          </button>
        ))}
      </div>
      <div className="ask-form">
        <input
          aria-label="Follow-up question"
          placeholder="Ask the evidence a better question…"
          value={value}
          onChange={(e) => change(e.target.value)}
        />
        {supported && (
          <button
            type="button"
            aria-label="Dictate follow-up"
            onClick={() => {
              const w = window as unknown as {
                SpeechRecognition?: new () => Recognition;
                webkitSpeechRecognition?: new () => Recognition;
              };
              const C = w.SpeechRecognition || w.webkitSpeechRecognition;
              if (!C) return;
              const r = new C();
              r.lang = "en-IN";
              r.onresult = (e) => {
                change(e.results[0][0].transcript);
                setMessage("Dictation ready. Review before sending.");
              };
              r.onerror = () =>
                setMessage("Dictation unavailable. Type your question.");
              try {
                r.start();
                setMessage("Listening…");
              } catch {
                setMessage("Microphone unavailable. Type your question.");
              }
            }}
          >
            Mic
          </button>
        )}
        <button className="primary">Send ↗</button>
      </div>
      <span role="status">{message}</span>
    </form>
  );
}
