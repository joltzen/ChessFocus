export const isLightSquare = (fileIdx: number, rankIdx: number) =>
  (fileIdx + rankIdx) % 2 === 0;

export function pieceSrc(pieceSet: string, color: "w" | "b", type: string) {
  return `/pieces/${pieceSet}/${color}${type.toUpperCase()}.svg`;
}

