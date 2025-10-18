import { useEffect, useMemo, useRef, useState } from "react";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8];

type Coord = `${string}${number}`;

function randomTarget(): Coord {
  const f = FILES[Math.floor(Math.random() * 8)];
  const r = RANKS[Math.floor(Math.random() * 8)];
  return `${f}${r}` as Coord;
}

export default function CoordBlitz() {
  const [active, setActive] = useState(false);
  const [target, setTarget] = useState<Coord>("e4");
  const [score, setScore] = useState(0);
  const [tries, setTries] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const startedAt = useRef<number | null>(null);

  const displayFiles = useMemo(
    () => (flipped ? [...FILES].reverse() : FILES),
    [flipped]
  );
  const displayRanks = useMemo(
    () => (flipped ? [...RANKS].reverse() : RANKS),
    [flipped]
  );

  function toCoord(fIdx: number, rIdx: number): Coord {
    return `${displayFiles[fIdx]}${displayRanks[rIdx]}` as Coord;
  }
  function isLightSquare(fileIndex: number, rankIndex: number) {
    return (fileIndex + rankIndex) % 2 === 0;
  }

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

  function handleSquareClick(c: Coord) {
    if (!active) return;
    setTries((t) => t + 1);
    if (c === target) {
      setScore((s) => s + 1);
      setTarget(randomTarget());
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        active ? stop() : start();
      }
      if (e.key.toLowerCase() === "f") {
        setFlipped((v) => !v);
      }
    }
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
        <div className="coords">
          Ziel: <strong>{target}</strong> • Treffer: <strong>{score}</strong> /{" "}
          {tries}
        </div>
      </div>

      <div className="board-wrap">
        {displayFiles.map((f, i) => (
          <div
            key={`t-${f}`}
            className="axis"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {f}
          </div>
        ))}
        {displayFiles.map((f, i) => (
          <div
            key={`b-${f}`}
            className="axis"
            style={{ gridColumn: i + 2, gridRow: 10 }}
          >
            {f}
          </div>
        ))}
        {[...displayRanks]
          .slice()
          .reverse()
          .map((r, i) => (
            <div
              key={`l-${r}`}
              className="axis"
              style={{ gridColumn: 1, gridRow: i + 2 }}
            >
              {r}
            </div>
          ))}
        {[...displayRanks]
          .slice()
          .reverse()
          .map((r, i) => (
            <div
              key={`r-${r}`}
              className="axis"
              style={{ gridColumn: 10, gridRow: i + 2 }}
            >
              {r}
            </div>
          ))}

        <div className="board">
          {displayRanks.map((_, rIdx) =>
            displayFiles.map((_, fIdx) => {
              const coord = toCoord(fIdx, rIdx);
              const isTarget = active && coord === target;
              return (
                <div
                  key={coord}
                  className={`square ${
                    isLightSquare(fIdx, rIdx) ? "light" : "dark"
                  }`}
                  onClick={() => handleSquareClick(coord)}
                  title={coord}
                  style={
                    isTarget
                      ? {
                          boxShadow: "inset 0 0 0 4px #22c55e",
                          outline: "4px solid #22c55e",
                          outlineOffset: "-4px",
                        }
                      : undefined
                  }
                />
              );
            })
          )}
        </div>
      </div>

      <p className="coords" style={{ marginTop: 12, opacity: 0.75 }}>
        Tipp: <kbd>Leertaste</kbd> Start/Stop • <kbd>F</kbd> Flip
      </p>
    </div>
  );
}
