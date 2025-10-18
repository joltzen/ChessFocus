export const PIECE_SETS = [
  "alpha",
  "anarcandy",
  "caliente",
  "california",
  "cardinal",
  "cburnett",
  "celtic",
  "chess7",
  "chessnut",
  "companion",
  "cooke",
  "fantasy",
  "firi",
  "fresca",
  "gioco",
  "governor",
  "horsey",
  "icpieces",
  "kiwen-suwi",
  "kosal",
  "leipzig",
  "letter",
  "maestro",
  "merida",
  "monarchy",
  "mpchess",
  "pirouetti",
  "pixel",
  "reillycraig",
  "rhosgfx",
  "riohacha",
  "shapes",
  "spatial",
  "staunty",
  "tatiana",
  "xkcd",
].sort((a, b) => a.localeCompare(b));

export type ThemeKey =
  | "classic"
  | "glas"
  | "blue"
  | "brown"
  | "lightBlue"
  | "mono"
  | "custom";

export const THEMES: { id: ThemeKey; name: string }[] = [
  { id: "classic", name: "Classic" },
  { id: "glas", name: "Glas" },
  { id: "blue", name: "Blue" },
  { id: "brown", name: "Brown" },
  { id: "lightBlue", name: "Light Blue" },
  { id: "mono", name: "Mono" },
  { id: "custom", name: "Custom" },
];

export function getThemeColor(
  theme: ThemeKey,
  tone: "light" | "dark",
  customHex: string
) {
  const map: Record<ThemeKey, { light: string; dark: string }> = {
    classic: { light: "#ebecd0", dark: "#739552" },
    glas: { light: "#697181", dark: "#2d313f" },
    blue: { light: "#f2f6fa", dark: "#5596f2" },
    brown: { light: "#edd6b0", dark: "#b88762" },
    lightBlue: { light: "#f0f1f0", dark: "#c4d8e4" },
    mono: { light: "#ffffff", dark: "#646464ff" },
    custom: { light: customHex, dark: customHex },
  };
  return map[theme][tone];
}
