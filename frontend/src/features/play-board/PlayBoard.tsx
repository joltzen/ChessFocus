import { useMemo, useRef, useState } from "react";
import type { Square as Sq } from "chess.js";
import { useBoardOrientation } from "../../hooks/useBoardOrientation";
import { useChessGame } from "../../hooks/useChessGame";
import { isLightSquare } from "../../lib/chess/helpers";
import { BoardFrame } from "../../components/board/BoardFrame";
import { BoardGrid } from "../../components/board/BoardGrid";
import Square from "../../components/board/Square";
import { useAppearance } from "../../context/AppearanceContext";
import { useAudioPool } from "../../hooks/useAudioPool";
import { useDragGhost } from "../../hooks/useDragGhost";
import { PieceImage } from "../../components/board/PieceImage";

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

  // Targets
  const [targets, setTargets] = useState<{ quiet: Sq[]; capture: Sq[] }>({
    quiet: [],
    capture: [],
  });

  // Shared hooks
  const { play } = useAudioPool(true);
  const dragFrom = useRef<Sq | null>(null);
  const {
    ghost,
    begin: beginGhost,
    move: moveGhost,
    end: endGhost,
  } = useDragGhost();

  // Selection helpers
  function selectWithTargets(coord: Sq | null) {
    if (!coord) {
      setSelected(null);
      setTargets({ quiet: [], capture: [] });
      return false;
    }
    const t = legalTargets(coord);
    const has = t.quiet.length > 0 || t.capture.length > 0;
    if (!has) {
      setSelected(null);
      setTargets({ quiet: [], capture: [] });
      return false;
    }
    setSelected(coord);
    setTargets(t);
    return true;
  }

  function onSquareClick(coord: Sq) {
    if (coord === selected) {
      selectWithTargets(null);
      return;
    }
    if (select(coord)) {
      if (!selectWithTargets(coord)) selectWithTargets(null);
      return;
    }
    if (selected) {
      const result = tryMove(selected, coord);
      if (result.ok) {
        if (result.promoted) play("promote");
        else if (result.flags?.includes("k") || result.flags?.includes("q"))
          play("castle");
        else if (result.captured) play("capture");
        else if (result.isCheck) play("check");
        else play("move");
      }
      selectWithTargets(null);
      return;
    }
    selectWithTargets(null);
  }

  function canDragFrom(coord: Sq): boolean {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = game.get(coord as any);
    if (!p) return false;
    if (p.color !== turn) return false;
    const t = legalTargets(coord);
    return t.quiet.length > 0 || t.capture.length > 0;
  }

  function onDragStart(e: React.DragEvent<HTMLImageElement>, from: Sq) {
    if (!canDragFrom(from)) {
      e.preventDefault();
      return;
    }
    dragFrom.current = from;
    e.dataTransfer.setData("text/plain", from);
    e.dataTransfer.effectAllowed = "move";
    select(from);
    selectWithTargets(from);
    beginGhost(e);
  }
  function onPieceDrag(e: React.DragEvent<HTMLImageElement>) {
    moveGhost(e.clientX, e.clientY);
  }

  function onDragOverSquare(e: React.DragEvent<HTMLDivElement>, over: Sq) {
    const from = dragFrom.current;
    if (!from) return;
    moveGhost(e.clientX, e.clientY);
    const legal =
      targets.quiet.includes(over) ||
      targets.capture.includes(over) ||
      over === from;
    if (legal) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    }
  }

  function onDropOnSquare(e: React.DragEvent<HTMLDivElement>, to: Sq) {
    e.preventDefault();
    const from =
      (e.dataTransfer.getData("text/plain") as Sq) || dragFrom.current;
    dragFrom.current = null;
    endGhost();
    if (!from) return;
    if (!canDragFrom(from)) {
      selectWithTargets(null);
      return;
    }
    if (from === to) {
      selectWithTargets(from);
      return;
    }

    const result = tryMove(from, to);
    if (result.ok) {
      if (result.promoted) play("promote");
      else if (result.flags?.includes("k") || result.flags?.includes("q"))
        play("castle");
      else if (result.captured) play("capture");
      else if (result.isCheck) play("check");
      else play("move");
      selectWithTargets(null);
      return;
    }
    if (select(to)) {
      if (!selectWithTargets(to)) selectWithTargets(null);
    } else {
      selectWithTargets(null);
    }
  }
  function onDragEnd() {
    dragFrom.current = null;
    endGhost();
  }
  function onUndo() {
    undoLastMove();
    selectWithTargets(null);
  }

  const pairedMoves = useMemo(() => {
    const history = game.history();
    const pairs = [];
    for (let i = 0; i < history.length; i += 2)
      pairs.push({ num: i / 2 + 1, white: history[i], black: history[i + 1] });
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
              const canDrag = canDragFrom(coord);

              const isLastFrom = lastMove?.from === coord;
              const isLastTo = lastMove?.to === coord;

              const target = targets.capture.includes(coord)
                ? "ring"
                : targets.quiet.includes(coord)
                ? "dot"
                : undefined;

              const isCheckedKing =
                !!sq && sq.type === "k" && sq.color === turn && game.isCheck();
              const dangerClass = isCheckedKing
                ? game.isCheckmate()
                  ? "king-mate"
                  : "king-danger"
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
                  onDragOver={(e) => onDragOverSquare(e, coord)}
                  onDrop={(e) => onDropOnSquare(e, coord)}
                  className={dangerClass}
                >
                  {sq && (
                    <PieceImage
                      pieceSet={pieceSet}
                      color={sq.color}
                      type={sq.type}
                      className="piece piece-draggable"
                      draggable={canDrag}
                      onDragStart={(e) => onDragStart(e, coord)}
                      onDrag={onPieceDrag}
                      onDragEnd={onDragEnd}
                    />
                  )}
                </Square>
              );
            }}
          />
        </BoardFrame>

        {ghost.visible && ghost.src && (
          <img
            src={ghost.src}
            alt=""
            style={{
              position: "fixed",
              left: ghost.x,
              top: ghost.y,
              width: ghost.w,
              height: ghost.h,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              userSelect: "none",
              zIndex: 9999,
              opacity: 1,
            }}
          />
        )}

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
