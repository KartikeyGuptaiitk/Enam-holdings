"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { createPortal } from "react-dom";
import { spring } from "../../lib/motion";
export function Sheet({
  title,
  children,
  close,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLElement>(null),
    callback = useRef(close),
    owner = useRef("");
  const reduced = useReducedMotion();
  const [snap, setSnap] = useState("half");
  useEffect(() => {
    callback.current = close;
  }, [close]);
  const dismiss = useCallback(() => {
    if (history.state?.finnSheet === owner.current) history.back();
    else callback.current();
  }, []);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    owner.current = crypto.randomUUID();
    history.pushState({ ...history.state, finnSheet: owner.current }, "");
    ref.current?.focus();
    const pop = (event: PopStateEvent) => {
      if (event.state?.finnSheet !== owner.current) callback.current();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),input,select,a[href],[tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("popstate", pop);
    document.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("popstate", pop);
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      if (history.state?.finnSheet === owner.current) history.back();
      prior?.focus();
    };
  }, [dismiss]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="sheet-backdrop" onClick={dismiss}>
      <motion.section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`sheet terminal-sheet sheet-${snap}`}
        initial={{ y: reduced ? 0 : 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
        drag={reduced ? false : "y"}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.12}
        onDragEnd={(_, info) => {
          if (info.velocity.y > 700 || info.offset.y > 180) dismiss();
          else if (info.offset.y > 60)
            setSnap(snap === "full" ? "half" : "peek");
          else if (info.offset.y < -50)
            setSnap(snap === "peek" ? "half" : "full");
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>{title}</h2>
          <button aria-label="Close dialog" onClick={dismiss}>
            ×
          </button>
        </div>
        <div className="sheet-snaps" aria-label="Sheet height">
          {["peek", "half", "full"].map((s) => (
            <button
              key={s}
              aria-pressed={s === snap}
              onClick={() => setSnap(s)}
            >
              {s}
            </button>
          ))}
        </div>
        {children}
      </motion.section>
    </div>,
    document.body,
  );
}
