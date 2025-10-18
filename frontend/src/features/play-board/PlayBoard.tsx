import { useMemo, useRef, useState } from "react";
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

  type SoundKey = "move" | "capture" | "castle" | "check" | "promote";
  const sounds = useRef<
    Record<SoundKey, [HTMLAudioElement | null, HTMLAudioElement | null]>
  >({
    move: [null, null],
    capture: [null, null],
    castle: [null, null],
    check: [null, null],
    promote: [null, null],
  });
  const soundIdx = useRef<Record<SoundKey, 0 | 1>>({
    move: 0,
    capture: 0,
    castle: 0,
    check: 0,
    promote: 0,
  });

  if (typeof window !== "undefined" && !sounds.current.move[0]) {
    const mk = (src: string) => {
      const a1 = new Audio(src);
      a1.preload = "auto";
      const a2 = new Audio(src);
      a2.preload = "auto";
      return [a1, a2] as [HTMLAudioElement, HTMLAudioElement];
    };
    sounds.current.move = mk("/sounds/move.mp3");
    sounds.current.capture = mk("/sounds/capture.mp3");
    sounds.current.castle = mk("/sounds/castle.mp3");
    sounds.current.check = mk("/sounds/check.mp3");
    sounds.current.promote = mk("/sounds/promote.mp3");
  }

  function play(kind: SoundKey) {
    const pair = sounds.current[kind];
    if (!pair) return;
    const idx = soundIdx.current[kind] === 0 ? 1 : 0;
    soundIdx.current[kind] = idx;
    const a = pair[idx];
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
      void a.play();
    } catch {}
  }

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
        selectWithTargets(null);
      } else {
        selectWithTargets(null);
      }
      return;
    }
    selectWithTargets(null);
  }

  function canDragFrom(coord: Sq): boolean {
    const p = game.get(coord as any);
    if (!p) return false;
    if (p.color !== turn) return false;
    const t = legalTargets(coord);
    return t.quiet.length > 0 || t.capture.length > 0;
  }

  const dragFrom = useRef<Sq | null>(null);
  const [ghost, setGhost] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    src: string | null;
    visible: boolean;
  }>({ x: 0, y: 0, w: 0, h: 0, src: null, visible: false });
  function updateGhost(e: { clientX: number; clientY: number }) {
    setGhost((g) => (g.visible ? { ...g, x: e.clientX, y: e.clientY } : g));
  }

  const transparentShim = useRef<HTMLImageElement | null>(null);
  if (!transparentShim.current && typeof Image !== "undefined") {
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    transparentShim.current = img;
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

    if (transparentShim.current) {
      e.dataTransfer.setDragImage(transparentShim.current, 0, 0);
    }

    const el = e.currentTarget as HTMLImageElement;
    const rect = el.getBoundingClientRect();
    setGhost({
      x: e.clientX,
      y: e.clientY,
      w: rect.width,
      h: rect.height,
      src: el.src,
      visible: true,
    });
  }

  function onPieceDrag(e: React.DragEvent<HTMLImageElement>) {
    updateGhost(e);
  }

  function onDragOverSquare(e: React.DragEvent<HTMLDivElement>, over: Sq) {
    const from = dragFrom.current;
    if (!from) return;

    updateGhost(e);

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

    setGhost((g) => ({ ...g, visible: false, src: null }));

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
    setGhost((g) => ({ ...g, visible: false, src: null }));
  }

  function onUndo() {
    undoLastMove();
    selectWithTargets(null);
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

              const canDrag = canDragFrom(coord);

              const img = sq ? (
                <img
                  className="piece piece-draggable"
                  alt={`${sq.color}${sq.type}`}
                  src={`/pieces/${pieceSet}/${
                    sq.color
                  }${sq.type.toUpperCase()}.svg`}
                  draggable={canDrag}
                  onDragStart={(e) => onDragStart(e, coord)}
                  onDrag={(e) => onPieceDrag(e)}
                  onDragEnd={onDragEnd}
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
                  onDragOver={(e) => onDragOverSquare(e, coord)}
                  onDrop={(e) => onDropOnSquare(e, coord)}
                >
                  {img}
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
