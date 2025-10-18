import { useEffect, useMemo, useRef, useState } from "react";
import type { Square as Sq } from "chess.js";
import { useBoardOrientation } from "../../hooks/useBoardOrientation";
import { useChessGame } from "../../hooks/useChessGame";
import { isLightSquare } from "../../lib/chess/helpers";
import { BoardFrame } from "../../components/board/BoardFrame";
import { BoardGrid } from "../../components/board/BoardGrid";
import Square from "../../components/board/Square";
import { useAppearance } from "../../context/AppearanceContext";

export default function PlayBoard() {
  const [flipped, setFlipped] = useState(false);
  const { pieceSet } = useAppearance();

  const { displayFiles, displayRanks, mapIdx, toCoord } =
    useBoardOrientation(flipped);
  const {
    game,
    board,
    turn,
    selected,
    lastMove,
    setSelected,
    reset,
    undoLastMove,
    select,
    legalTargets,
    tryMove,
  } = useChessGame();

  const [targets, setTargets] = useState<{ quiet: Sq[]; capture: Sq[] }>({
    quiet: [],
    capture: [],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audio = useRef<Record<string, HTMLAudioElement>>({} as any);
  useEffect(() => {
    audio.current = {
      move: new Audio("/sounds/move.mp3"),
      capture: new Audio("/sounds/capture.mp3"),
      castle: new Audio("/sounds/castle.mp3"),
      check: new Audio("/sounds/check.mp3"),
      promote: new Audio("/sounds/promote.mp3"),
    };
    Object.values(audio.current).forEach((a) => (a.preload = "auto"));
  }, []);

  function playSound(
    kind: "move" | "capture" | "castle" | "check" | "promote"
  ) {
    const a = audio.current[kind];
    if (!a) return;
    try {
      a.currentTime = 0;
      a.play();
    } catch {
      /* ignore autoplay restrictions */
    }
  }

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

    const result = tryMove(selected, coord);
    if (result.ok) {
      setSelected(null);
      setTargets({ quiet: [], capture: [] });

      if (result.promoted) playSound("promote");
      else if (result.flags?.includes("k") || result.flags?.includes("q"))
        playSound("castle");
      else if (result.captured) playSound("capture");
      else if (result.isCheck) playSound("check");
      else playSound("move");
      return;
    }

    if (select(coord)) setTargets(legalTargets(coord));
    else {
      setSelected(null);
      setTargets({ quiet: [], capture: [] });
    }
  }

  function onUndo() {
    undoLastMove();
    setSelected(null);
    setTargets({ quiet: [], capture: [] });
  }

  const pairedMoves = useMemo(() => {
    const history = game.history();
    const pairs = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({ num: i / 2 + 1, white: history[i], black: history[i + 1] });
    }
    return pairs;
  }, [game]);

  return (
    <div style={{ position: "relative" }}>
      <div className="toolbar">
        <button onClick={reset}>♻️ Neu starten</button>
        <button onClick={onUndo}>↩️ Rückgängig</button>
        <button onClick={() => setFlipped((v) => !v)}>🔄 Brett drehen</button>
      </div>

      <div className="board-area">
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
                  src={`/pieces/${pieceSet}/${
                    sq.color
                  }${sq.type.toUpperCase()}.svg`}
                />
              ) : null;

              const isLastFrom = lastMove?.from === coord;
              const isLastTo = lastMove?.to === coord;

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
                  lastFrom={isLastFrom}
                  lastTo={isLastTo}
                  target={target}
                  onClick={() => onSquareClick(coord)}
                >
                  {img}
                </Square>
              );
            }}
          />
        </BoardFrame>

        <div className="move-list">
          <div className="move-list-title">Moves</div>
          <div className="move-table">
            <div className="move-header">
              <span>#</span>
              <span>White</span>
              <span>Black</span>
            </div>
            {pairedMoves.map(({ num, white, black }) => (
              <div key={num} className="move-row">
                <span className="num">{num}.</span>
                <span>{white || ""}</span>
                <span>{black || ""}</span>
              </div>
            ))}
          </div>
          <div className="coords">
            Am Zug: {turn === "w" ? "Weiß" : "Schwarz"}
            {game.isCheck() ? " (Schach!)" : ""}
            {game.isGameOver() ? " • Partie beendet" : ""}
          </div>
        </div>
      </div>

      {game.isGameOver() && (
        <div className="overlay">
          <div className="modal">
            <h3>Game Over</h3>
            {game.isCheckmate() ? <p>Checkmate!</p> : <p>Draw!</p>}
            <div style={{ marginTop: 12 }}>
              <button onClick={reset}>Play Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
