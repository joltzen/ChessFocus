export const isLightSquare = (fileIdx: number, rankIdx: number) =>
  (fileIdx + rankIdx) % 2 === 0;

export function pieceSrc(color: "w" | "b", type: string) {
  return `/pieces/${color}${type.toUpperCase()}.svg`;
}
