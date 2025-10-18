import { useMemo, useRef, useState, useEffect } from "react";
import type { Coord } from "../../lib/chess/constants";
import { FILES, RANKS_TOPDOWN } from "../../lib/chess/constants";
import { useBoardOrientation } from "../../hooks/useBoardOrientation";
import { isLightSquare, pieceSrc } from "../../lib/chess/helpers";
import { BoardFrame } from "../../components/board/BoardFrame";
import { BoardGrid } from "../../components/board/BoardGrid";
import Square from "../../components/board/Square";
import { useAppearance } from "../../context/AppearanceContext";
import { idxToCoord } from "../../lib/chess/coord";
import { bfsShortestKnightPath, knightMoves } from "../../lib/chess/knight";

type KnightRoutesProps = {
  scale?: number;
  square?: number;
  compact?: boolean;
};

/* ---------------- helpers ---------------- */
function randomCoord(): Coord {
  const f = Math.floor(Math.random() * 8);
  const r = Math.floor(Math.random() * 8);
  return idxToCoord(f, r) as Coord;
}

function makeRandomTask(minDist = 2, maxTries = 200) {
  for (let i = 0; i < maxTries; i++) {
    const start = randomCoord();
    const target = randomCoord();
    if (target === start) continue;
    const shortest = bfsShortestKnightPath(start, target);
    if (shortest.dist !== Infinity && shortest.dist >= minDist) {
      return { start, target, shortest };
    }
  }
  const fallback = { start: "b1" as Coord, target: "c5" as Coord };
  return {
    ...fallback,
    shortest: bfsShortestKnightPath(fallback.start, fallback.target),
  };
}

/* --------------- component ---------------- */
export default function KnightRoutes({
  scale = 1,
  square,
  compact = false,
}: KnightRoutesProps) {
  const [flipped, setFlipped] = useState(false);
  const { pieceSet } = useAppearance();
  const { displayFiles, displayRanks, toCoord } = useBoardOrientation(flipped);

  /* difficulty (minimum distance) */
  const [minDist, setMinDist] = useState<number>(2);

  /* task + path */
  const [task, setTask] = useState(() => makeRandomTask(minDist));
  const [path, setPath] = useState<Coord[]>([task.start]);
  const current = path[path.length - 1];

    const shortest = useMemo(
    () => bfsShortestKnightPath(task.start, task.target),
    [task]
  );

  const legalNext = useMemo(() => {
    if (current === task.target) return new Set<Coord>();
    return new Set(knightMoves(current));
  }, [current, task.target]);

  /* timer */
  const startTs = useRef<number | null>(null);
  const [userRtMs, setUserRtMs] = useState<number | null>(null);
  const [liveMs, setLiveMs] = useState<number>(0);

  /* solved counter */
  const [solved, setSolved] = useState(0);

  /* hints */
  const [hintIndex, setHintIndex] = useState<number>(0);
  const [reveal, setReveal] = useState<boolean>(false);

  /* reset when task changes */
  useEffect(() => {
    setPath([task.start]);
    setUserRtMs(null);
    setLiveMs(0);
    startTs.current = null;
    setHintIndex(0);
    setReveal(false);
  }, [task]);

  /* live timer while active */
  useEffect(() => {
    if (startTs.current == null || current === task.target) return;
    let raf = 0;
    const tick = () => {
      setLiveMs(Math.round(performance.now() - (startTs.current as number)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, task.target]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "r") onReset();
      if (k === "n") onNewTask();
      if (k === "f") setFlipped((v) => !v);
      if (k === "h") oneHint();
      if (k === "u" || k === "backspace") undoLast();
      if (k === "enter" && current === task.target) onNewTask();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, task]);

  /* interactions */
  function onSquareClick(coord: Coord) {
    if (current === task.target) return;

    if (startTs.current == null && coord !== task.start) {
      startTs.current = performance.now();
    }

    if (path.length >= 2 && coord === path[path.length - 2]) {
      undoLast();
      return;
    }

    if (coord === current) return;
    if (!legalNext.has(coord)) return;

    const nextPath = [...path, coord];
    setPath(nextPath);

    if (coord === task.target) {
      if (startTs.current != null) {
        const ms = performance.now() - startTs.current;
        setUserRtMs(Math.round(ms) / 1000);
      }
      setSolved((s) => s + 1);
    }
  }

  function undoLast() {
    if (path.length > 1 && current !== task.target) {
      setPath((p) => p.slice(0, -1));
    }
  }

  function onReset() {
    setPath([task.start]);
    setUserRtMs(null);
    setLiveMs(0);
    startTs.current = null;
    setHintIndex(0);
    setReveal(false);
  }

  function onNewTask() {
    setTask(makeRandomTask(minDist));
  }

  function oneHint() {
    if (reveal) return;
    const opt = shortest.path;
    const nextIdx = Math.min(opt.length - 1, path.length);
    setHintIndex((i) => Math.max(i, nextIdx));
  }

  const isDone = current === task.target;
  const moveCount = path.length - 1;
  const isOptimal = isDone && moveCount === shortest.dist;
  const progressPct = Math.min(
    100,
    Math.round((moveCount / Math.max(1, shortest.dist)) * 100)
  );

  const inlineVars = useMemo<React.CSSProperties>(() => {
    const vars: Record<string, string> = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ["--ui-scale" as any]: String(scale),
    };
    if (square) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vars["--square-size" as any] = `${square}px`;
    }
    return vars as React.CSSProperties;
  }, [scale, square]);

  return (
    <div className="cb" style={inlineVars}>
      {/* Toolbar */}
      <div className="cb-toolbar">
        <div className="cb-left">
          <button className="pill main" onClick={onReset}>
            ♻️ Reset
          </button>
          <button className="pill" onClick={() => setFlipped((v) => !v)}>
            🔄 Brett drehen
          </button>
          <button className="pill" onClick={onNewTask}>
            🎲 Neue Aufgabe
          </button>

          {!compact && (
            <div
              className="pill"
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <span style={{ opacity: 0.8, fontSize: 12 }}>Min-Züge</span>
              <select
                value={minDist}
                onChange={(e) => setMinDist(Number(e.target.value))}
                style={{
                  background: "transparent",
                  color: "inherit",
                  border: "none",
                  outline: "none",
                }}
                aria-label="minimal distance"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </div>
          )}
        </div>

        <div className="cb-center">
          <span className="cb-center-label">Aufgabe</span>
          <div className="cb-center-task">
            Springer von <b>{task.start}</b> nach <b>{task.target}</b> in
            minimalen Zügen
          </div>
        </div>

        {!compact && (
          <div
            className="cb-right"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <span className="pill ghost">Min: {shortest.dist}</span>
            <span className="pill ghost">Gelöst: {solved}</span>
            <span className="pill ghost">
              ⏱{" "}
              {isDone
                ? userRtMs ?? "—"
                : startTs.current
                ? `${(liveMs / 1000).toFixed(3)}s`
                : "—"}
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="cb-progress-bar" aria-label="progress">
          <div className="fill" style={{ width: `${progressPct}%` }} />
          <div className="legend">
            {moveCount}/{shortest.dist}
          </div>
        </div>
      )}

      <div
        className="cb-main"
        style={compact ? { gridTemplateColumns: "1fr" } : undefined}
      >
        <div className="cb-card cb-board-card">
          <BoardFrame
            showAxes
            displayFiles={displayFiles}
            displayRanks={displayRanks}
          >
            <BoardGrid
              displayFiles={displayFiles}
              displayRanks={displayRanks}
              renderCell={(rIdx, fIdx) => {
                const coord = toCoord(fIdx, rIdx) as Coord;

                const fileIdx = FILES.indexOf(
                  displayFiles[fIdx] as (typeof FILES)[number]
                );
                const rankIdxTopDown = RANKS_TOPDOWN.indexOf(
                  displayRanks[rIdx] as (typeof RANKS_TOPDOWN)[number]
                );
                const ri = 7 - rankIdxTopDown;
                const light = isLightSquare(fileIdx, ri);

                const isCurrent = coord === current;
                const isStart = coord === task.start;
                const isTarget = coord === task.target;

                const target = undefined;

                const optimalIndex = shortest.path.indexOf(coord);
                const showHintRing = reveal
                  ? optimalIndex >= 0
                  : hintIndex > 0 && optimalIndex === hintIndex;

                return (
                  <Square
                    key={coord}
                    coord={coord}
                    light={light}
                    selected={isCurrent}
                    target={target}
                    lastFrom={isStart}
                    lastTo={isTarget}
                    onClick={() => onSquareClick(coord)}
                    className={showHintRing ? "target-circle" : undefined}
                  >
                    {isCurrent && (
                      <img
                        className="piece"
                        alt="wN"
                        src={pieceSrc(pieceSet, "w", "n")}
                      />
                    )}

                    {reveal && optimalIndex >= 0 && (
                      <span
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(59,130,246,0.14)",
                          pointerEvents: "none",
                        }}
                      />
                    )}
                  </Square>
                );
              }}
            />
          </BoardFrame>
        </div>

        {!compact && (
          <div className="cb-card cb-stats-card">
            <h3>Messung</h3>
            <div className="cb-stats-grid">
              <div className="stat">
                <span className="k">✅</span>
                <span className="v">{isDone ? "ja" : "nein"}</span>
                <span className="l">correct</span>
              </div>
              <div className="stat">
                <span className="k">🔢</span>
                <span className="v">{moveCount}</span>
                <span className="l">Züge</span>
              </div>
              <div className="stat">
                <span className="k">🎯</span>
                <span className="v">{shortest.dist}</span>
                <span className="l">Minimalzugzahl</span>
              </div>
              <div className="stat">
                <span className="k">⏱️</span>
                <span className="v">{shortest.rt_ms} ms</span>
                <span className="l">BFS rt_ms</span>
              </div>
              <div className="stat">
                <span className="k">🕒</span>
                <span className="v">
                  {isDone
                    ? userRtMs ?? "—"
                    : startTs.current
                    ? `${(liveMs / 1000).toFixed(3)}s`
                    : "—"}
                </span>
                <span className="l">User time</span>
              </div>
              <div className="stat">
                <span className="k">⭐</span>
                <span className="v">
                  {isOptimal ? "optimal" : isDone ? "suboptimal" : "—"}
                </span>
                <span className="l">Pfadgüte</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                className="pill"
                onClick={undoLast}
                disabled={path.length <= 1 || isDone}
              >
                ↩️ Undo
              </button>
              <button
                className="pill"
                onClick={oneHint}
                disabled={isDone || reveal}
              >
                💡 Hint
              </button>
              <button
                className="pill"
                onClick={() => setReveal(true)}
                disabled={isDone && reveal}
              >
                👀 Reveal
              </button>
              {isDone && (
                <button className="pill main" onClick={onNewTask}>
                  ➡️ Weiter
                </button>
              )}
            </div>

            <div className="cb-help" style={{ marginTop: 8 }}>
              Shortcuts:{" "}
              <span className="keys">
                <span>R</span> Reset
              </span>{" "}
              •{" "}
              <span className="keys">
                <span>F</span> Flip
              </span>{" "}
              •{" "}
              <span className="keys">
                <span>N</span> Neue Aufgabe
              </span>{" "}
              •{" "}
              <span className="keys">
                <span>U/Backspace</span> Undo
              </span>{" "}
              •{" "}
              <span className="keys">
                <span>H</span> Hint
              </span>{" "}
              •{" "}
              <span className="keys">
                <span>Enter</span> Weiter
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
