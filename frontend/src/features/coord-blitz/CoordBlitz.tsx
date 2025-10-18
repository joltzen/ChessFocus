import { useEffect, useMemo, useRef, useState } from "react";
import { useBoardOrientation } from "../../hooks/useBoardOrientation";
import { FILES } from "../../lib/chess/constants";
import type { Coord } from "../../lib/chess/constants";
import { isLightSquare } from "../../lib/chess/helpers";
import { BoardFrame } from "../../components/board/BoardFrame";
import { BoardGrid } from "../../components/board/BoardGrid";

/** feste Ränge für Ziele (1..8) */
const RANKS_FOR_TARGET = [1, 2, 3, 4, 5, 6, 7, 8] as const;

type Mode = "time" | "items";
const DURATION_SEC = 60;
const ITEMS_TARGET = 20;

function randomTarget(): Coord {
  const f = FILES[Math.floor(Math.random() * 8)];
  const r = RANKS_FOR_TARGET[Math.floor(Math.random() * 8)];
  return `${f}${r}` as Coord;
}

type Trial = { coord: Coord; rt: number }; // korrekte Klicks mit Reaktionszeit

export default function CoordBlitz() {
  /** Board-Ansicht */
  const [flipped, setFlipped] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const [showHeat, setShowHeat] = useState(false);

  /** Session-Steuerung */
  const [mode, setMode] = useState<Mode>("time");
  const [active, setActive] = useState(false);

  /** Ziele & Metriken */
  const [target, setTarget] = useState<Coord>("e4");
  const targetSince = useRef<number | null>(null);

  const [tries, setTries] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Coord, number>>>({});
  const [flash, setFlash] = useState<Record<string, "ok" | "err">>({});

  /** Mode-Tracking */
  const [timeLeft, setTimeLeft] = useState(DURATION_SEC);
  const [itemsLeft, setItemsLeft] = useState(ITEMS_TARGET);

  /** Orientierung + Koordinaten */
  const { displayFiles, displayRanks, toCoord } = useBoardOrientation(flipped);

  /** Berechnete Kennzahlen */
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

  /** Reset für neue Session */
  function resetSessionState() {
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
  }

  function start() {
    resetSessionState();
    setActive(true);
  }

  function stop() {
    setActive(false);
  }

  /** Timer für Zeitmodus */
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

  /** Kurzes Aufblitzen für Feedback */
  function doFlash(c: Coord, kind: "ok" | "err", d = 200) {
    setFlash((f) => ({ ...f, [c]: kind }));
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      setFlash(({ [c]: _, ...rest }) => rest);
    }, d);
  }

  /** Klick-Logik */
  function onClick(coord: Coord) {
    if (!active) return;
    setTries((t) => t + 1);

    if (coord === target) {
      const now = performance.now();
      const rt = Math.round(now - (targetSince.current ?? now));
      setCorrect((c) => c + 1);
      setTrials((ts) => [...ts, { coord, rt }]);
      doFlash(coord, "ok");

      // Items-Mode runterzählen
      if (mode === "items") {
        setItemsLeft((n) => {
          const next = Math.max(0, n - 1);
          if (next === 0) setActive(false);
          return next;
        });
      }

      // neues Ziel
      const nxt = randomTarget();
      setTarget(nxt);
      targetSince.current = performance.now();
    } else {
      // Fehler-Heatmap
      setErrors((prev) => ({ ...prev, [coord]: (prev[coord] ?? 0) + 1 }));
      doFlash(coord, "err");
    }
  }

  /** Tastatursteuerung */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (active) stop();
        else start();
      }
      if (e.key.toLowerCase() === "f") setFlipped((v) => !v);
      if (e.key.toLowerCase() === "a") setShowAxes((v) => !v);
      if (e.key.toLowerCase() === "h") setShowHeat((v) => !v);
      if (e.key.toLowerCase() === "t") setMode("time");
      if (e.key.toLowerCase() === "i") setMode("items");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  /** Heatmap-Farben */
  const maxErr = useMemo(() => Math.max(0, ...Object.values(errors)), [errors]);
  function heatStyle(coord: Coord): React.CSSProperties | undefined {
    if (!showHeat) return undefined;
    const n = errors[coord] ?? 0;
    if (!n || !maxErr) return undefined;
    const alpha = Math.min(0.6, 0.2 + 0.4 * (n / maxErr));
    return { boxShadow: `inset 0 0 0 9999px rgba(239,68,68,${alpha})` };
  }

  /** UI-Helfer */
  const taskText = `Klicke Feld ${target}`;
  const progressPct =
    mode === "time"
      ? 100 - Math.min(100, Math.round((timeLeft / 60) * 100))
      : Math.round(((ITEMS_TARGET - itemsLeft) / ITEMS_TARGET) * 100);

  /** --- UI --- */
  return (
    <div className="cb">
      {/* Header */}
      <div className="cb-header">
        <div className="cb-controls">
          <div className="cb-group">
            <button className="pill" onClick={active ? stop : start}>
              {active ? "⏸︎ Stopp" : "▶︎ Start"}
            </button>
            <button className="pill" onClick={() => setFlipped((v) => !v)}>
              🔄 Flip
            </button>
            <button className="pill" onClick={() => setShowAxes((v) => !v)}>
              {showAxes ? "🙈 Koordinaten aus" : "🧭 Koordinaten an"}
            </button>
            <button
              className={`pill ${showHeat ? "on" : ""}`}
              onClick={() => setShowHeat((v) => !v)}
            >
              🔥 Heatmap
            </button>
          </div>

          <div className="cb-group">
            <button
              className={`pill ${mode === "time" ? "active" : ""}`}
              onClick={() => setMode("time")}
              disabled={active}
            >
              ⏱︎ 60s
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

        {/* Zielanzeige direkt über dem Brett */}
        <div className="cb-banner-centered">
          <span className="cb-label">Ziel</span>
          <strong className="cb-task">{taskText}</strong>
        </div>

        {/* Fortschritt */}
        <div className="cb-progress" aria-label="progress">
          <div className="bar" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Statistiken */}
      <div className="cb-stats">
        <div className="chip">✔︎ {correct}</div>
        <div className="chip">🖱︎ {tries}</div>
        <div className="chip">🎯 {accuracy}%</div>
        <div className="chip">avg {avg ?? "–"} ms</div>
        <div className="chip">best {best ?? "–"} ms</div>
        <div className="chip">worst {worst ?? "–"} ms</div>
      </div>

      {/* Board-Karte */}
      <div className="cb-card">
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

      {/* Session-Ergebnis */}
      {!active && tries > 0 && (
        <p className="cb-summary">
          Session beendet — Treffer: <strong>{correct}</strong> / {tries}
          {" • "}Accuracy: <strong>{accuracy}%</strong>
          {" • "}avg RT: <strong>{avg ?? "–"} ms</strong>
          {" • "}best: <strong>{best ?? "–"} ms</strong>
        </p>
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
