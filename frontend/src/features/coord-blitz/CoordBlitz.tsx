import { useEffect, useRef, useState } from "react";
import { useBoardOrientation } from "../../hooks/useBoardOrientation";
import { FILES } from "../../lib/chess/constants";
import { isLightSquare } from "../../lib/chess/helpers";
import { BoardFrame } from "../../components/board/BoardFrame";
import { BoardGrid } from "../../components/board/BoardGrid";
import type { Coord } from "../../lib/chess/constants";

const RANKS_FOR_TARGET = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function randomTarget(): Coord {
  const f = FILES[Math.floor(Math.random() * 8)];
  const r = RANKS_FOR_TARGET[Math.floor(Math.random() * 8)];
  return `${f}${r}` as Coord;
}

export default function CoordBlitz() {
  const [active, setActive] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const { displayFiles, displayRanks, toCoord } = useBoardOrientation(flipped);
  const [target, setTarget] = useState<Coord>("e4");
  const [score, setScore] = useState(0);
  const [tries, setTries] = useState(0);
  const [flash, setFlash] = useState<Record<string, "ok" | "err">>({});
  const startedAt = useRef<number | null>(null);

  function start() {
    setScore(0);
    setTries(0);
    setTarget(randomTarget());
    setActive(true);
    startedAt.current = performance.now();
  }
  function stop() {
    setActive(false);
  }
  function doFlash(c: Coord, k: "ok" | "err", d = 250) {
    setFlash((f) => ({ ...f, [c]: k }));
    setTimeout(
      () =>
        setFlash((f) => {
          const { [c]: _, ...r } = f;
          return r;
        }),
      d
    );
  }

  function onClick(coord: Coord) {
    if (!active) return;
    setTries((t) => t + 1);
    if (coord === target) {
      setScore((s) => s + 1);
      doFlash(coord, "ok");
      setTimeout(() => setTarget(randomTarget()), 160);
    } else {
      doFlash(coord, "err");
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        active ? stop() : start();
      }
      if (e.key.toLowerCase() === "f") setFlipped((v) => !v);
      if (e.key.toLowerCase() === "a") setShowAxes((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <div>
      <div className="toolbar">
        <button onClick={active ? stop : start}>
          {active ? "⏸️ Stopp" : "▶️ Start"}
        </button>
        <button onClick={() => setFlipped((v) => !v)}>🔄 Brett drehen</button>
        <button onClick={() => setShowAxes((v) => !v)}>
          {showAxes ? "🙈 Koordinaten aus" : "🧭 Koordinaten an"}
        </button>
        <div className="coords">
          Ziel: <strong>{target}</strong> • Treffer: <strong>{score}</strong> /{" "}
          {tries}
        </div>
      </div>

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
            const flashCls = fb ? (fb === "ok" ? "flash-ok" : "flash-err") : "";
            return (
              <div
                key={coord}
                className={`square ${
                  isLightSquare(fIdx, rIdx) ? "light" : "dark"
                } ${flashCls}`}
                onClick={() => onClick(coord)}
              />
            );
          }}
        />
      </BoardFrame>
    </div>
  );
}
