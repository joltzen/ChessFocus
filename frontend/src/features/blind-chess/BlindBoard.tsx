// features/blind-chess/BlindBoard.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Square as Sq } from "chess.js";
import { useBoardOrientation } from "../../hooks/useBoardOrientation";
import { useChessGame } from "../../hooks/useChessGame";
import { BoardFrame } from "../../components/board/BoardFrame";
import { BoardGrid } from "../../components/board/BoardGrid";
import Square from "../../components/board/Square";
import { isLightSquare } from "../../lib/chess/helpers";
import { useAudioPool } from "../../hooks/useAudioPool";

type Props = {
  showAxes?: boolean;
  showTargets?: boolean; // default false
  enableClicks?: boolean; // default true
  onMove?: (args: { san: string; from: Sq; to: Sq }) => void;
  className?: string;
};

export default function BlindBoard({
  showAxes = true,
  showTargets = false,
  enableClicks = true,
  onMove,
  className,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const [moveText, setMoveText] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { displayFiles, displayRanks, mapIdx, toCoord } =
    useBoardOrientation(flipped);
  const { play } = useAudioPool(true);

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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const [targets, setTargets] = useState<{ quiet: Sq[]; capture: Sq[] }>({
    quiet: [],
    capture: [],
  });

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleSounds(result: any) {
    if (result.promoted) play("promote");
    else if (result.flags?.includes("k") || result.flags?.includes("q"))
      play("castle");
    else if (result.captured) play("capture");
    else if (result.isCheck) play("check");
    else play("move");
  }

  function tryMoveAndNotify(from: Sq, to: Sq) {
    const result = tryMove(from, to);
    if (result?.ok) {
      handleSounds(result);
      const san = game.history().slice(-1)[0]!;
      onMove?.({ san, from, to });
      return true;
    }
    return false;
  }

  function onSquareClick(coord: Sq) {
    if (!enableClicks) return;
    if (coord === selected) return void selectWithTargets(null);

    if (select(coord)) {
      if (!selectWithTargets(coord)) selectWithTargets(null);
      return;
    }
    if (selected) {
      tryMoveAndNotify(selected, coord);
      return void selectWithTargets(null);
    }
    selectWithTargets(null);
  }

  function onUndo() {
    undoLastMove();
    selectWithTargets(null);
  }

  // Robust text input: e2e4 / e2-e4 / e2 e4 / e7e8q
  function submitTextMove() {
    setInputError(null);
    const raw = moveText.trim().toLowerCase().replace(/\s+/g, "");
    const m = raw.match(/^([a-h][1-8])[- ]?([a-h][1-8])([qrbn])?$/);
    if (!m) {
      setInputError("Format: e2e4 oder e7e8q (Promotion).");
      return;
    }
    const [, from, to] = m as unknown as [string, Sq, Sq];

    // some implementations expect from to be selected
    const okSelect = select(from);
    if (okSelect) selectWithTargets(from);

    const ok = tryMoveAndNotify(from, to);
    selectWithTargets(null);

    if (!ok) {
      setInputError("Illegaler Zug / falsche Quelle/Ziel oder nicht am Zug.");
      return;
    }

    setMoveText("");
  }

  const pairedMoves = useMemo(() => {
    const history = game.history();
    const out = [];
    for (let i = 0; i < history.length; i += 2)
      out.push({ n: i / 2 + 1, w: history[i], b: history[i + 1] });
    return out;
  }, [game]);

  const lastMoveText = lastMove ? `${lastMove.from} → ${lastMove.to}` : "—";

  return (
    <div
      className={["blind-board", className].filter(Boolean).join(" ")}
      style={{ position: "relative" }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <button onClick={reset}>♻️ Reset</button>
        <button onClick={onUndo}>↩️ Undo</button>
        <button onClick={() => setFlipped((v) => !v)}>🔄 Flip</button>
        <span style={{ marginLeft: "auto", opacity: 0.8 }}>
          Turn: {turn === "w" ? "White" : "Black"}
        </span>
      </div>

      <div
        style={{
          margin: "8px 0",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <input
          ref={inputRef}
          value={moveText}
          onChange={(e) => setMoveText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitTextMove();
          }}
          placeholder="e2e4, g1f3, e7e8q"
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #374151",
            background: "#0f172a",
            color: "#e5e7eb",
            width: 220,
          }}
          aria-label="Enter coordinate chess move"
        />
        <button onClick={submitTextMove}>Make Move</button>
      </div>
      {inputError && (
        <div style={{ fontSize: 12, color: "#fca5a5", marginBottom: 8 }}>
          {inputError}
        </div>
      )}

      <div
        style={{ display: "grid", gridTemplateColumns: "auto auto", gap: 16 }}
      >
        <BoardFrame
          showAxes={showAxes}
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
              const isLastFrom = lastMove?.from === coord;
              const isLastTo = lastMove?.to === coord;

              const target = showTargets
                ? targets.capture.includes(coord)
                  ? "ring"
                  : targets.quiet.includes(coord)
                  ? "dot"
                  : undefined
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
                  className={dangerClass}
                >
                  {/* no PieceImage — blind board */}
                </Square>
              );
            }}
          />
        </BoardFrame>

        <div style={{ minWidth: 220 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Moves (blind)</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2.2rem 1fr 1fr",
              gap: 4,
            }}
          >
            <div style={{ opacity: 0.7, display: "contents" }}>
              <span>#</span>
              <span>White</span>
              <span>Black</span>
            </div>
            {pairedMoves.map(({ n, w, b }) => (
              <div key={n} style={{ display: "contents" }}>
                <span>{n}.</span>
                <span>{w || ""}</span>
                <span>{b || ""}</span>
              </div>
            ))}
          </div>
          <div
            aria-live="polite"
            style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}
          >
            Last move: {lastMoveText}
          </div>
        </div>
      </div>
    </div>
  );
}
