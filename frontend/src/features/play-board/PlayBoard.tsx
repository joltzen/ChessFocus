import React, { useMemo, useState } from "react";
import { Chess, Move } from "chess.js";
import type { Square as Sq } from "chess.js";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

function isLightSquare(fileIndex: number, rankIndex: number) {
  return (fileIndex + rankIndex) % 2 === 0;
}

function pieceSrc(color: "w" | "b", type: string) {
  return `/pieces/${color}${type.toUpperCase()}.svg`;
}

const PlayBoard: React.FC = () => {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Sq | null>(null);
  const [moveTargets, setMoveTargets] = useState<{
    quiet: Sq[];
    capture: Sq[];
  }>({
    quiet: [],
    capture: [],
  });
  const [flipped, setFlipped] = useState(false);

  const board = useMemo(() => game.board(), [game]);
  const turn = game.turn();

  const displayFiles = flipped ? [...FILES].reverse() : FILES;
  const displayRanks = flipped ? [...RANKS].reverse() : RANKS;

  function internalIndex(rIdx: number, fIdx: number) {
    const ri = flipped ? 7 - rIdx : rIdx;
    const fi = flipped ? 7 - fIdx : fIdx;
    return { ri, fi };
  }
  function toCoord(rIdx: number, fIdx: number): Sq {
    const file = displayFiles[fIdx];
    const rank = displayRanks[rIdx];
    return `${file}${rank}` as Sq;
  }

  function handleSquareClick(target: Sq) {
    if (!selected) {
      const piece = game.get(target);
      if (piece && piece.color === turn) {
        setSelected(target);
        const moves = game.moves({ square: target, verbose: true }) as Move[];
        setMoveTargets({
          quiet: moves.filter((m) => !m.captured).map((m) => m.to as Sq),
          capture: moves.filter((m) => m.captured).map((m) => m.to as Sq),
        });
      } else {
        setSelected(null);
        setMoveTargets({ quiet: [], capture: [] });
      }
      return;
    }

    if (selected === target) {
      setSelected(null);
      setMoveTargets({ quiet: [], capture: [] });
      return;
    }

    const move = game.move({ from: selected, to: target, promotion: "q" });
    if (move) {
      setGame(new Chess(game.fen()));
      setSelected(null);
      setMoveTargets({ quiet: [], capture: [] });
    } else {
      const piece = game.get(target);
      if (piece && piece.color === turn) {
        setSelected(target);
        const moves = game.moves({ square: target, verbose: true }) as Move[];
        setMoveTargets({
          quiet: moves.filter((m) => !m.captured).map((m) => m.to as Sq),
          capture: moves.filter((m) => m.captured).map((m) => m.to as Sq),
        });
      } else {
        setSelected(null);
        setMoveTargets({ quiet: [], capture: [] });
      }
    }
  }

  function reset() {
    setGame(new Chess());
    setSelected(null);
    setMoveTargets({ quiet: [], capture: [] });
  }
  function flipBoard() {
    setFlipped((v) => !v);
  }

  return (
    <div>
      <div className="toolbar">
        <button onClick={reset}>♻️ Neu starten</button>
        <button onClick={flipBoard}>🔄 Brett drehen</button>
        <div className="coords">
          Am Zug: {turn === "w" ? "Weiß" : "Schwarz"}
          {game.isCheck() ? " (Schach!)" : ""}
          {game.isGameOver() ? " • Partie beendet" : ""}
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
        {displayRanks.map((r, i) => (
          <div
            key={`l-${r}`}
            className="axis"
            style={{ gridColumn: 1, gridRow: i + 2 }}
          >
            {r}
          </div>
        ))}
        {displayRanks.map((r, i) => (
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
              const { ri, fi } = internalIndex(rIdx, fIdx);
              const coord = toCoord(rIdx, fIdx);
              const sq = board[ri][fi];
              const img = sq ? (
                <img
                  className="piece"
                  alt={`${sq.color}${sq.type}`}
                  src={pieceSrc(sq.color, sq.type)}
                />
              ) : null;

              const isSelected = selected === coord;
              const isQuietTarget = moveTargets.quiet.includes(coord);
              const isCaptureTarget = moveTargets.capture.includes(coord);

              return (
                <div
                  key={coord}
                  className={`square ${
                    isLightSquare(fi, ri) ? "light" : "dark"
                  } ${isSelected ? "selected" : ""} ${
                    isQuietTarget ? "target-dot" : ""
                  } ${isCaptureTarget ? "target-circle" : ""}`}
                  onClick={() => handleSquareClick(coord)}
                >
                  {img}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayBoard;
