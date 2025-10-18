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
  const start = "b1" as Coord,
    target = "c5" as Coord;
  return { start, target, shortest: bfsShortestKnightPath(start, target) };
}

export default function KnightRoutes() {
  const [flipped, setFlipped] = useState(false);
  const { pieceSet } = useAppearance();
  const { displayFiles, displayRanks, toCoord } = useBoardOrientation(flipped);

  const [task, setTask] = useState(() => makeRandomTask(2));
  const [path, setPath] = useState<Coord[]>([task.start]);
  const current = path[path.length - 1];

  const shortest = useMemo(
    () => bfsShortestKnightPath(task.start, task.target),
    [task]
  );
  const legalNext = useMemo(() => new Set(knightMoves(current)), [current]);

  const startTs = useRef<number | null>(null);
  const [userRtMs, setUserRtMs] = useState<number | null>(null);
  const [solved, setSolved] = useState(0);

  useEffect(() => {
    setPath([task.start]);
    setUserRtMs(null);
    startTs.current = null;
  }, [task]);

  function onSquareClick(coord: Coord) {
    if (startTs.current == null && coord !== task.start)
      startTs.current = performance.now();
    if (coord === current) return;
    if (!legalNext.has(coord)) return;

    const nextPath = [...path, coord];
    setPath(nextPath);

    if (coord === task.target) {
      if (startTs.current != null)
        setUserRtMs(
          Math.round((performance.now() - startTs.current) * 1000) / 1000
        );
      setSolved((s) => s + 1);
    }
  }

  const onReset = () => {
    setPath([task.start]);
    setUserRtMs(null);
    startTs.current = null;
  };
  const onNewTask = () => setTask(makeRandomTask(2));

  const isDone = current === task.target;
  const moveCount = path.length - 1;
  const isOptimal = isDone && moveCount === shortest.dist;

  return (
    <div className="cb">
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
        </div>
        <div className="cb-center">
          <span className="cb-center-label">Aufgabe</span>
          <div className="cb-center-task">
            Springer von <b>{task.start}</b> nach <b>{task.target}</b> in
            minimalen Zügen
          </div>
        </div>
        <div className="cb-right">
          <span className="pill ghost">Min: {shortest.dist}</span>
          <span className="pill ghost">Gelöst: {solved}</span>
        </div>
      </div>

      <div className="cb-main">
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

                const isOnPath = path.includes(coord);
                const isCurrent = coord === current;
                const isStart = coord === task.start;
                const isTarget = coord === task.target;
                const target = legalNext.has(coord) ? "ring" : undefined;

                const badge = isStart ? "S" : isTarget ? "T" : undefined;
                const stepIndex = isOnPath ? path.indexOf(coord) : -1;

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
                  >
                    {isCurrent && (
                      <img
                        className="piece"
                        alt="wN"
                        src={pieceSrc(pieceSet, "w", "n")}
                      />
                    )}
                    {(badge || stepIndex >= 0) && (
                      <span
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          fontSize: 12,
                          background: "rgba(0,0,0,0.4)",
                          color: "#fff",
                          padding: "2px 4px",
                          borderRadius: 4,
                        }}
                      >
                        {badge ? badge : stepIndex}
                      </span>
                    )}
                  </Square>
                );
              }}
            />
          </BoardFrame>
        </div>

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
              <span className="v">{userRtMs ?? "—"}</span>
              <span className="l">User rt_ms</span>
            </div>
            <div className="stat">
              <span className="k">⭐</span>
              <span className="v">
                {isOptimal ? "optimal" : isDone ? "suboptimal" : "—"}
              </span>
              <span className="l">Pfadgüte</span>
            </div>
          </div>

          {isDone && (
            <div style={{ marginTop: 8 }}>
              <button className="pill main" onClick={onNewTask}>
                ➡️ Weiter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
