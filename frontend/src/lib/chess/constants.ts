export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS_TOPDOWN = [8, 7, 6, 5, 4, 3, 2, 1] as const;

export type File = (typeof FILES)[number];
export type Rank = (typeof RANKS_TOPDOWN)[number];
export type Coord = `${File}${Rank}`;
