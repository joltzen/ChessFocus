export type Coord = `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8}`;

export function coordToIdx(c: Coord) {
  const f = c.charCodeAt(0) - 97; // 'a' -> 0
  const r = Number(c[1]) - 1; // '1' -> 0
  return { f, r };
}

export function idxToCoord(f: number, r: number): Coord {
  return `${String.fromCharCode(97 + f)}${r + 1}` as Coord;
}

export function insideBoard(f: number, r: number) {
  return f >= 0 && f < 8 && r >= 0 && r < 8;
}
