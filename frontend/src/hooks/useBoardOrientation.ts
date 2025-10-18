import { useMemo } from "react";
import { FILES, RANKS_TOPDOWN } from "../lib/chess/constants";
import type { Coord } from "../lib/chess/constants";

export function useBoardOrientation(flipped: boolean) {
  const displayFiles = useMemo(
    () => (flipped ? [...FILES].reverse() : FILES),
    [flipped]
  );
  const displayRanks = useMemo(
    () => (flipped ? [...RANKS_TOPDOWN].reverse() : RANKS_TOPDOWN),
    [flipped]
  );

  function mapIdx(rankIdx: number, fileIdx: number) {
    const ri = flipped ? 7 - rankIdx : rankIdx;
    const fi = flipped ? 7 - fileIdx : fileIdx;
    return { ri, fi };
  }

  function toCoord(fileIdx: number, rankIdx: number): Coord {
    return `${displayFiles[fileIdx]}${displayRanks[rankIdx]}` as Coord;
  }

  return { displayFiles, displayRanks, mapIdx, toCoord };
}
