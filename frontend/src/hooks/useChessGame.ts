import { useMemo, useState } from "react";
import { Chess, Move } from "chess.js";
import type { Square as Sq } from "chess.js";

type TryMoveResult = {
  ok: boolean;
  captured: boolean;
  flags?: string;
  promoted?: boolean;
  isCheck?: boolean;
};

export function useChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Sq | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Sq; to: Sq } | null>(null);

  const board = useMemo(() => game.board(), [game]);
  const turn = game.turn();

  function snapshotFromCurrent(): Chess {
    const ng = new Chess();
    ng.loadPgn(game.pgn());
    return ng;
  }

  function reset() {
    setGame(new Chess());
    setSelected(null);
    setLastMove(null);
  }

  function undoLastMove() {
    const undone = game.undo();
    if (undone) {
      setGame(snapshotFromCurrent());
      setLastMove(null);
      setSelected(null);
    }
  }

  function select(square: Sq) {
    const piece = game.get(square);
    if (piece && piece.color === turn) {
      setSelected(square);
      return true;
    }
    setSelected(null);
    return false;
  }

  function legalTargets(square: Sq) {
    const moves = game.moves({ square, verbose: true }) as Move[];
    return {
      quiet: moves.filter((m) => !m.captured).map((m) => m.to as Sq),
      capture: moves.filter((m) => m.captured).map((m) => m.to as Sq),
    };
  }

  function tryMove(from: Sq, to: Sq): TryMoveResult {
    const m = game.move({ from, to, promotion: "q" });
    if (!m) return { ok: false, captured: false };

    const isCheck = game.isCheck();
    const res: TryMoveResult = {
      ok: true,
      captured: Boolean(m.captured),
      flags: m.flags,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      promoted: Boolean((m as any).promotion),
      isCheck,
    };

    setGame(snapshotFromCurrent());
    setLastMove({ from, to });

    return res;
  }

  return {
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
  };
}
