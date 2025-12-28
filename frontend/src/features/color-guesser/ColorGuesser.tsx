import { useEffect, useMemo, useRef, useState } from "react";
import type { Coord } from "../../lib/chess/constants";

/* ====== config ====== */
const DURATION_SEC = 60;

/* ====== helpers ====== */
const FILES = "abcdefgh".split("");
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function randomCoord(): Coord {
  const f = FILES[Math.floor(Math.random() * 8)];
  const r = RANKS[Math.floor(Math.random() * 8)];
  return `${f}${r}` as Coord;
}

function isLightCoord(c: Coord) {
  const fileIdx = c.charCodeAt(0) - 97; // a=0..h=7
  const rankIdx = Number(c[1]) - 1; // '1' -> 0
  // a1 (0+0=0) is DARK → light when sum is ODD
  return (fileIdx + rankIdx) % 2 === 1;
}

type Flash = "ok" | "err" | null;

export default function ColorGuesser() {
  // session state
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DURATION_SEC);
  const [tries, setTries] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);

  // current task
  const [coord, setCoord] = useState<Coord>(() => randomCoord());
  const [flash, setFlash] = useState<Flash>(null);

  // timers
  const timerStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const accuracy = useMemo(
    () => (tries ? Math.round((correct / tries) * 100) : 0),
    [tries, correct]
  );

  function resetAll() {
    setActive(false);
    setTimeLeft(DURATION_SEC);
    setTries(0);
    setCorrect(0);
    setStreak(0);
    setCoord(randomCoord());
    setFlash(null);
    timerStartRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function start() {
    setActive(true);
    setFlash(null);
    setTimeLeft(DURATION_SEC);
    timerStartRef.current = performance.now();
    const tick = () => {
      if (!timerStartRef.current) return;
      const elapsed = (performance.now() - timerStartRef.current) / 1000;
      const left = Math.max(0, DURATION_SEC - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        setActive(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function stop() {
    setActive(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  // keyboard: Space start/stop, W/B answers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " ") {
        e.preventDefault();
        active ? stop() : start();
      }
      if (!active) return;
      if (k === "w") onAnswer("w");
      if (k === "b") onAnswer("b");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, coord]);

  function nextTask() {
    setCoord(randomCoord());
  }

  function onAnswer(btn: "w" | "b") {
    if (!active) return;
    const isLight = isLightCoord(coord);
    const answeredLight = btn === "w";

    setTries((t) => t + 1);
    const ok = isLight === answeredLight;

    if (ok) {
      setCorrect((c) => c + 1);
      setStreak((s) => s + 1);
      setFlash("ok");
    } else {
      setStreak(0);
      setFlash("err");
    }

    // brief flash + move on (slightly longer for clearer feedback)
    setTimeout(() => {
      setFlash(null);
      nextTask();
    }, 400);
  }

  const progressPct =
    100 - Math.min(100, Math.round((timeLeft / DURATION_SEC) * 100));
  const big = coord.toUpperCase();

  return (
    <div className="cb">
      <div className="cb-toolbar">
        <div className="cb-left">
          <button className="pill main" onClick={active ? stop : start}>
            {active ? "⏸ Stop" : "▶ Start"}
          </button>
          {!active && (
            <button className="pill ghost" onClick={resetAll}>
              ↺ Reset
            </button>
          )}
        </div>

        <div className="cb-center">
          <span className="cb-center-label">Field</span>
          <span
            className="cb-center-task"
            style={{
              fontSize: "42px",
              lineHeight: 1,
              letterSpacing: "1px",
              padding: "2px 10px",
              borderRadius: 10,
              border: "1px solid #1f2a44",
              // No per-answer flash here; background stays neutral
              background: "#0e1a2e",
            }}
            aria-live="polite"
          >
            {big}
          </span>
        </div>

        <div className="cb-right">
          <span className="pill ghost">⏱ 60s</span>
          <span className="pill ghost">🔥 Streak: {streak}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="cb-progress-bar" aria-label="progress">
        <div className="fill" style={{ width: `${progressPct}%` }} />
        <div className="legend">{Math.ceil(timeLeft)}s</div>
      </div>

      {/* Main */}
      <div className="cb-main" style={{ gridTemplateColumns: "1fr 280px" }}>
        <div
          className="cb-card cb-board-card"
          style={{ gap: 16, display: "grid" }}
        >
          {/* Color button zone (with flash background) */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 40,
              marginTop: 40,
              padding: 40,
              borderRadius: "16px",
              transition: "background-color 0.25s ease",
              backgroundColor:
                flash === "ok"
                  ? "rgba(34,197,94,0.15)" // soft green
                  : flash === "err"
                  ? "rgba(239,68,68,0.15)" // soft red
                  : "rgba(255,255,255,0.02)", // neutral dark tone
            }}
          >
            {/* White button */}
            <button
              onClick={() => onAnswer("w")}
              disabled={!active}
              aria-label="White square"
              title="Key: W"
              style={{
                width: "150px",
                height: "150px",
                backgroundColor: "#ffffff",
                border: active ? "4px solid #ddd" : "2px solid #444",
                borderRadius: "8px",
                cursor: active ? "pointer" : "not-allowed",
                boxShadow: active
                  ? "0 0 15px rgba(255,255,255,0.5)"
                  : "0 0 6px rgba(0,0,0,0.2)",
                transition: "transform 0.1s ease, box-shadow 0.2s ease",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.95)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />

            {/* Black button */}
            <button
              onClick={() => onAnswer("b")}
              disabled={!active}
              aria-label="Black square"
              title="Key: B"
              style={{
                width: "150px",
                height: "150px",
                backgroundColor: "#000000",
                border: active ? "4px solid #222" : "2px solid #666",
                borderRadius: "8px",
                cursor: active ? "pointer" : "not-allowed",
                boxShadow: active
                  ? "0 0 15px rgba(0,0,0,0.6)"
                  : "0 0 6px rgba(0,0,0,0.2)",
                transition: "transform 0.1s ease, box-shadow 0.2s ease",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.95)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />
          </div>

          <div style={{ opacity: 0.8, fontSize: 13 }}>
            <span className="keys">
              <span>Space</span> Start/Stop
            </span>{" "}
            •{" "}
            <span className="keys">
              <span>W</span> White
            </span>{" "}
            •{" "}
            <span className="keys">
              <span>B</span> Black
            </span>
          </div>
        </div>

        <aside className="cb-card cb-stats-card">
          <h3>Stats</h3>
          <div className="cb-stats-grid">
            <div className="stat">
              <span className="k">✔︎</span>
              <span className="v">{correct}</span>
              <span className="l">Correct</span>
            </div>
            <div className="stat">
              <span className="k">🖱︎</span>
              <span className="v">{tries}</span>
              <span className="l">Total</span>
            </div>
            <div className="stat">
              <span className="k">🎯</span>
              <span className="v">{accuracy}%</span>
              <span className="l">Accuracy</span>
            </div>
            <div className="stat">
              <span className="k">🔥</span>
              <span className="v">{streak}</span>
              <span className="l">Streak</span>
            </div>
          </div>

          {!active && tries > 0 && (
            <div className="cb-help" style={{ marginTop: 8 }}>
              Session ended • Score: <b>{correct}</b> / {tries} ({accuracy}%)
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
