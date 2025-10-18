import { coordToIdx, idxToCoord, insideBoard, type Coord } from "./coord";

const KNIGHT_DELTAS = [
  { df: 1, dr: 2 },
  { df: 2, dr: 1 },
  { df: 2, dr: -1 },
  { df: 1, dr: -2 },
  { df: -1, dr: -2 },
  { df: -2, dr: -1 },
  { df: -2, dr: 1 },
  { df: -1, dr: 2 },
] as const;

export function knightMoves(from: Coord): Coord[] {
  const { f, r } = coordToIdx(from);
  const res: Coord[] = [];
  for (const d of KNIGHT_DELTAS) {
    const nf = f + d.df,
      nr = r + d.dr;
    if (insideBoard(nf, nr)) res.push(idxToCoord(nf, nr));
  }
  return res;
}

export function bfsShortestKnightPath(from: Coord, to: Coord) {
  const t0 = performance.now();
  const q: Coord[] = [from];
  const prev = new Map<Coord, Coord | null>();
  prev.set(from, null);

  while (q.length) {
    const cur = q.shift()!;
    if (cur === to) break;
    for (const nxt of knightMoves(cur)) {
      if (!prev.has(nxt)) {
        prev.set(nxt, cur);
        q.push(nxt);
      }
    }
  }

  const path: Coord[] = [];
  if (prev.has(to)) {
    let c: Coord | null = to;
    while (c) {
      path.push(c);
      c = prev.get(c) ?? null;
    }
    path.reverse();
  }
  const t1 = performance.now();
  return {
    path,
    dist: path.length ? path.length - 1 : Infinity,
    rt_ms: Math.round((t1 - t0) * 1000) / 1000,
  };
}
