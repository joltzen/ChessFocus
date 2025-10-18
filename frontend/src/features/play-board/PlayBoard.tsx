// src/features/play-board/PlayBoard.tsx
import { useState } from "react";
import type { Square as Sq } from "chess.js";
import { useBoardOrientation } from "../../hooks/useBoardOrientation";
import { useChessGame } from "../../hooks/useChessGame";
import { isLightSquare, pieceSrc } from "../../lib/chess/helpers";
import { BoardFrame } from "../../components/board/BoardFrame";
import { BoardGrid } from "../../components/board/BoardGrid";
import Square from "../../components/board/Square";

export default function PlayBoard() {
  const [flipped, setFlipped] = useState(false);
  const { displayFiles, displayRanks, mapIdx, toCoord } =
    useBoardOrientation(flipped);
  const {
    board,
    turn,
    selected,
    setSelected,
    reset,
    select,
    legalTargets,
    tryMove,
  } = useChessGame();
  const [targets, setTargets] = useState<{ quiet: Sq[]; capture: Sq[] }>({
    quiet: [],
    capture: [],
  });

  function onSquareClick(coord: Sq) {
    if (!selected) {
      if (select(coord)) setTargets(legalTargets(coord));
      else setTargets({ quiet: [], capture: [] });
      return;
    }
    if (coord === selected) {
      setSelected(null);
      setTargets({ quiet: [], capture: [] });
      return;
    }
    if (tryMove(selected, coord)) {
      setSelected(null);
      setTargets({ quiet: [], capture: [] });
      return;
    }

    // ggf. Auswahl wechseln
    if (select(coord)) setTargets(legalTargets(coord));
    else {
      setSelected(null);
      setTargets({ quiet: [], capture: [] });
    }
  }

  return (
    <div>
      <div className="toolbar">
        <button onClick={reset}>♻️ Neu starten</button>
        <button onClick={() => setFlipped((v) => !v)}>🔄 Brett drehen</button>
        <div className="coords">
          Am Zug: {turn === "w" ? "Weiß" : "Schwarz"}
        </div>
      </div>

      <BoardFrame
        showAxes
        displayFiles={displayFiles}
        displayRanks={displayRanks}
      >
        <BoardGrid
          displayFiles={displayFiles}
          displayRanks={displayRanks}
          renderCell={(rIdx, fIdx) => {
            const { ri, fi } = mapIdx(rIdx, fIdx);
            const coord = toCoord(fIdx, rIdx) as Sq;
            const sq = board[ri][fi];
            const img = sq ? (
              <img
                className="piece"
                alt={`${sq.color}${sq.type}`}
                src={pieceSrc(sq.color, sq.type)}
              />
            ) : null;

            const target = targets.capture.includes(coord)
              ? "ring"
              : targets.quiet.includes(coord)
              ? "dot"
              : undefined;

            return (
              <Square
                key={coord}
                coord={coord}
                light={isLightSquare(fi, ri)}
                selected={selected === coord}
                target={target}
                onClick={() => onSquareClick(coord)}
              >
                {img}
              </Square>
            );
          }}
        />
      </BoardFrame>
    </div>
  );
}
