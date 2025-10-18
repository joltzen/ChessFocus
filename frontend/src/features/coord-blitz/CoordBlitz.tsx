import { useEffect, useMemo, useRef, useState } from "react";
import { useBoardOrientation } from "../../hooks/useBoardOrientation";
import { FILES } from "../../lib/chess/constants";
import type { Coord } from "../../lib/chess/constants";
import { isLightSquare } from "../../lib/chess/helpers";
import { BoardFrame } from "../../components/board/BoardFrame";
import { BoardGrid } from "../../components/board/BoardGrid";

const RANKS_FOR_TARGET = [1, 2, 3, 4, 5, 6, 7, 8] as const;
type Mode = "time" | "items";
const DURATION_SEC = 60;
const ITEMS_TARGET = 20;

const randomTarget = (): Coord => {
  const f = FILES[Math.floor(Math.random() * 8)];
  const r = RANKS_FOR_TARGET[Math.floor(Math.random() * 8)];
  return `${f}${r}` as Coord;
};

type Trial = { coord: Coord; rt: number };

export default function CoordBlitz() {
  // View / Toggles
  const [flipped, setFlipped] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const [showHeat, setShowHeat] = useState(false);

  // Mode / Session state
  const [mode, setMode] = useState<Mode>("time");
  const [active, setActive] = useState(false);

  // Task + metrics
  const [target, setTarget] = useState<Coord>("e4");
  const targetSince = useRef<number | null>(null);

  const [tries, setTries] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Coord, number>>>({});
  const [flash, setFlash] = useState<Record<string, "ok" | "err">>({});

  const [timeLeft, setTimeLeft] = useState(DURATION_SEC);
  const [itemsLeft, setItemsLeft] = useState(ITEMS_TARGET);

  const { displayFiles, displayRanks, toCoord } = useBoardOrientation(flipped);

  // Derived
  const accuracy = useMemo(
    () => (tries ? Math.round((correct / tries) * 100) : 0),
    [tries, correct]
  );
  const best = useMemo(
    () => (trials.length ? Math.min(...trials.map((t) => t.rt)) : null),
    [trials]
  );
  const worst = useMemo(
    () => (trials.length ? Math.max(...trials.map((t) => t.rt)) : null),
    [trials]
  );
  const avg = useMemo(
    () =>
      trials.length
        ? Math.round(trials.reduce((s, t) => s + t.rt, 0) / trials.length)
        : null,
    [trials]
  );

  // Session helpers
  const resetSessionState = () => {
    setTries(0);
    setCorrect(0);
    setTrials([]);
    setErrors({});
    setFlash({});
    setTimeLeft(DURATION_SEC);
    setItemsLeft(ITEMS_TARGET);
    const nxt = randomTarget();
    setTarget(nxt);
    targetSince.current = performance.now();
  };
  const start = () => {
    resetSessionState();
    setActive(true);
  };
  const stop = () => setActive(false);

  // Timer
  useEffect(() => {
    if (!active || mode !== "time") return;
    const startTs = performance.now();
    let rafId = 0;
    const tick = () => {
      const elapsed = (performance.now() - startTs) / 1000;
      const left = Math.max(0, DURATION_SEC - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        setActive(false);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, mode]);

  // Feedback flash
  const doFlash = (c: Coord, kind: "ok" | "err", d = 180) => {
    setFlash((f) => ({ ...f, [c]: kind }));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setTimeout(() => setFlash(({ [c]: _, ...rest }) => rest), d);
  };

  // Clicks
  const onClick = (coord: Coord) => {
    if (!active) return;
    setTries((t) => t + 1);

    if (coord === target) {
      const now = performance.now();
      const rt = Math.round(now - (targetSince.current ?? now));
      setCorrect((c) => c + 1);
      setTrials((ts) => [...ts, { coord, rt }]);
      doFlash(coord, "ok");

      if (mode === "items") {
        setItemsLeft((n) => {
          const next = Math.max(0, n - 1);
          if (next === 0) setActive(false);
          return next;
        });
      }
      const nxt = randomTarget();
      setTarget(nxt);
      targetSince.current = performance.now();
    } else {
      setErrors((prev) => ({ ...prev, [coord]: (prev[coord] ?? 0) + 1 }));
      doFlash(coord, "err");
    }
  };

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        active ? stop() : start();
      }
      if (e.key.toLowerCase() === "f") setFlipped((v) => !v);
      if (e.key.toLowerCase() === "a") setShowAxes((v) => !v);
      if (e.key.toLowerCase() === "h") setShowHeat((v) => !v);
      if (e.key.toLowerCase() === "t" && !active) setMode("time");
      if (e.key.toLowerCase() === "i" && !active) setMode("items");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Heat style
  const maxErr = useMemo(() => Math.max(0, ...Object.values(errors)), [errors]);
  const heatStyle = (coord: Coord): React.CSSProperties | undefined => {
    if (!showHeat) return;
    const n = errors[coord] ?? 0;
    if (!n || !maxErr) return;
    const alpha = Math.min(0.6, 0.2 + 0.4 * (n / maxErr));
    return { boxShadow: `inset 0 0 0 9999px rgba(239,68,68,${alpha})` };
  };

  const taskText = target.toUpperCase();
  const progressPct =
    mode === "time"
      ? 100 - Math.min(100, Math.round((timeLeft / 60) * 100))
      : Math.round(((ITEMS_TARGET - itemsLeft) / ITEMS_TARGET) * 100);

  return (
    <div className="cb">
      {/* Toolbar */}
      <div className="cb-toolbar">
        <div className="cb-left">
          <button className="pill main" onClick={active ? stop : start}>
            {active ? "⏸ Stop" : "▶ Start"}
          </button>
          <button className="pill" onClick={() => setFlipped((v) => !v)}>
            🔄 Flip
          </button>
          <button
            className={`pill ${showAxes ? "on" : ""}`}
            onClick={() => setShowAxes((v) => !v)}
          >
            🧭 Axes
          </button>
          <button
            className={`pill ${showHeat ? "on" : ""}`}
            onClick={() => setShowHeat((v) => !v)}
          >
            🔥 Heat
          </button>
        </div>

        <div className="cb-center">
          <span className="cb-center-label">Ziel</span>
          <span className="cb-center-task">{taskText}</span>
        </div>

        <div className="cb-right">
          <button
            className={`pill ${mode === "time" ? "active" : ""}`}
            onClick={() => setMode("time")}
            disabled={active}
          >
            ⏱ 60s
          </button>
          <button
            className={`pill ${mode === "items" ? "active" : ""}`}
            onClick={() => setMode("items")}
            disabled={active}
          >
            🎯 20
          </button>
          {!active && (
            <button className="pill ghost" onClick={resetSessionState}>
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="cb-progress-bar" aria-label="progress">
        <div className="fill" style={{ width: `${progressPct}%` }} />
        <div className="legend">
          {mode === "time"
            ? `${Math.ceil(timeLeft)}s`
            : `${ITEMS_TARGET - itemsLeft}/${ITEMS_TARGET}`}
        </div>
      </div>

      {/* Main */}
      <div className="cb-main">
        <div className="cb-card cb-board-card">
          <BoardFrame
            showAxes={showAxes}
            displayFiles={displayFiles}
            displayRanks={displayRanks}
          >
            <BoardGrid
              displayFiles={displayFiles}
              displayRanks={displayRanks}
              renderCell={(rIdx, fIdx) => {
                const coord = toCoord(fIdx, rIdx) as Coord;
                const fb = flash[coord];
                const flashCls = fb
                  ? fb === "ok"
                    ? "flash-ok"
                    : "flash-err"
                  : "";
                return (
                  <div
                    key={coord}
                    className={`square ${
                      isLightSquare(fIdx, rIdx) ? "light" : "dark"
                    } ${flashCls}`}
                    onClick={() => onClick(coord)}
                    style={heatStyle(coord)}
                    title={showAxes ? coord : undefined}
                  />
                );
              }}
            />
          </BoardFrame>
        </div>

        <aside className="cb-card cb-stats-card">
          <h3>Stats</h3>
          <div className="cb-stats-grid">
            <div className="stat">
              <span className="k">✔︎</span>
              <span className="v">{correct}</span>
              <span className="l">Treffer</span>
            </div>
            <div className="stat">
              <span className="k">🖱︎</span>
              <span className="v">{tries}</span>
              <span className="l">Klicks</span>
            </div>
            <div className="stat">
              <span className="k">🎯</span>
              <span className="v">{accuracy}%</span>
              <span className="l">Accuracy</span>
            </div>
            <div className="stat">
              <span className="k">⚡</span>
              <span className="v">{avg ?? "–"} ms</span>
              <span className="l">avg</span>
            </div>
            <div className="stat">
              <span className="k">🏁</span>
              <span className="v">{best ?? "–"} ms</span>
              <span className="l">best</span>
            </div>
            <div className="stat">
              <span className="k">🐢</span>
              <span className="v">{worst ?? "–"} ms</span>
              <span className="l">worst</span>
            </div>
          </div>
          <div className="cb-help">
            <div className="keys">
              <span>Space</span> Start/Stop • <span>F</span> Flip •{" "}
              <span>A</span> Axes • <span>H</span> Heat • <span>T</span> 60s •{" "}
              <span>I</span> 20 Ziele
            </div>
          </div>
        </aside>
      </div>

      {/* Session result */}
      {!active && tries > 0 && (
        <div className="cb-summary-card">
          <h4>Session beendet</h4>
          <p>
            Treffer: <strong>{correct}</strong> / {tries} • Accuracy:{" "}
            <strong>{accuracy}%</strong>
          </p>
          <p>
            ⏱ avg: <strong>{avg ?? "–"} ms</strong> • best:{" "}
            <strong>{best ?? "–"} ms</strong> • worst:{" "}
            <strong>{worst ?? "–"} ms</strong>
          </p>
        </div>
      )}

      {showHeat && (
        <p className="cb-hint">
          🔥 Fehler-Heatmap: dunkler = mehr Fehlklicks (nur während aktiver
          Session gezählt)
        </p>
      )}
    </div>
  );
}
