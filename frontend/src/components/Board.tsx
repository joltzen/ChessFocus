import React, { useMemo, useState } from "react";
import Square from "./Square";
import { Chess, Move } from "chess.js";
import type { Square as Sq } from "chess.js";
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const PIECE_TO_UNICODE: Record<string, string> = {
  // Weiß
  P: "♙",
  N: "♘",
  B: "♗",
  R: "♖",
  Q: "♕",
  K: "♔",
  // Schwarz
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
  k: "♚",
};

function toCoord(fileIndex: number, rankIndex: number): Sq {
  return `${FILES[fileIndex]}${RANKS[rankIndex]}` as Sq;
}

function isLightSquare(fileIndex: number, rankIndex: number) {
  return (fileIndex + rankIndex) % 2 === 0;
}

const Board: React.FC = () => {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Sq | null>(null);
  const [moveTargets, setMoveTargets] = useState<Sq[]>([]);

  const board = useMemo(() => game.board(), [game]);
  const turn = game.turn(); // 'w' | 'b'

  function handleSquareClick(target: Sq) {
    if (!selected) {
      const piece = game.get(target);
      if (piece && piece.color === turn) {
        setSelected(target);
        const moves = game.moves({ square: target, verbose: true }) as Move[];
        setMoveTargets(moves.map((m) => m.to as Sq));
      } else {
        setSelected(null);
        setMoveTargets([]);
      }
      return;
    }

    if (selected === target) {
      setSelected(null);
      setMoveTargets([]);
      return;
    }

    const move = game.move({ from: selected, to: target, promotion: "q" });
    if (move) {
      setGame(new Chess(game.fen()));
      setSelected(null);
      setMoveTargets([]);
    } else {
      const piece = game.get(target);
      if (piece && piece.color === turn) {
        setSelected(target);
        const moves = game.moves({ square: target, verbose: true }) as Move[];
        setMoveTargets(moves.map((m) => m.to as Sq));
      } else {
        setSelected(null);
        setMoveTargets([]);
      }
    }
  }

  function reset() {
    const fresh = new Chess();
    setGame(fresh);
    setSelected(null);
    setMoveTargets([]);
  }

  return (
    <div>
      <div className="toolbar">
        <button onClick={reset}>♻️ Neu starten</button>
        <div className="coords">
          Am Zug: {turn === "w" ? "Weiß" : "Schwarz"}
          {game.isCheck() ? " (Schach!)" : ""}
          {game.isGameOver() ? " • Partie beendet" : ""}
        </div>
      </div>

      <div className="board">
        {RANKS.map((_, rIdx) =>
          FILES.map((_, fIdx) => {
            const coord = toCoord(fIdx, rIdx);
            const sq = board[rIdx][fIdx];
            const pieceChar = sq
              ? PIECE_TO_UNICODE[
                  sq.color === "w" ? sq.type.toUpperCase() : sq.type
                ]
              : undefined;

            return (
              <Square
                key={coord}
                coord={coord}
                isLight={isLightSquare(fIdx, rIdx)}
                isSelected={selected === coord}
                isMoveTarget={moveTargets.includes(coord)}
                onClick={() => handleSquareClick(coord)}
              >
                {pieceChar}
              </Square>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Board;
