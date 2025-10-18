import { useMemo, useState } from "react";
import { Chess, Move } from "chess.js";
import type { Square as Sq } from "chess.js";

export function useChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Sq | null>(null);

  const board = useMemo(() => game.board(), [game]);
  const turn = game.turn();

  function reset() {
    setGame(new Chess());
    setSelected(null);
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

  function tryMove(from: Sq, to: Sq) {
    const m = game.move({ from, to, promotion: "q" });
    if (m) setGame(new Chess(game.fen()));
    return Boolean(m);
  }

  return {
    game,
    board,
    turn,
    selected,
    setSelected,
    reset,
    select,
    legalTargets,
    tryMove,
  };
}
