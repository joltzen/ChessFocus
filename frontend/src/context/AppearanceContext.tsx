import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemeKey =
  | "classic"
  | "glas"
  | "blue"
  | "brown"
  | "lightBlue"
  | "mono"
  | "custom";

// keep pieceSet open so any folder name under /public/pieces works
type AppearanceState = {
  pieceSet: string; // e.g. "cburnett", "merida", "alpha", "kosal", ...
  theme: ThemeKey;
  customLight: string; // used if theme === "custom"
  customDark: string; // used if theme === "custom"
};

type AppearanceContextValue = AppearanceState & {
  setPieceSet: (v: string) => void;
  setTheme: (k: ThemeKey) => void;
  setCustomLight: (hex: string) => void;
  setCustomDark: (hex: string) => void;
};

const STORAGE_KEY = "chess.appearance.v1";

const DEFAULT_STATE: AppearanceState = {
  pieceSet: "cburnett",
  theme: "classic",
  customLight: "#f0d9b5",
  customDark: "#b58863",
};

const THEME_COLORS: Record<ThemeKey, { light: string; dark: string }> = {
  classic: { light: "#ebecd0", dark: "#739552" },
  glas: { light: "#697181", dark: "#2d313f" },
  blue: { light: "#f2f6fa", dark: "#5596f2" },
  brown: { light: "#edd6b0", dark: "#b88762" },
  lightBlue: { light: "#f0f1f0", dark: "#c4d8e4" },
  mono: { light: "#ffffff", dark: "#646464" },
  custom: { light: DEFAULT_STATE.customLight, dark: DEFAULT_STATE.customDark },
};

/* ---------- tiny color helpers ---------- */
function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbaString(hex: string, a = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(a)})`;
}
function mix(hexA: string, hexB: string, t: number) {
  t = clamp01(t);
  const A = hexToRgb(hexA),
    B = hexToRgb(hexB);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const b = Math.round(A.b + (B.b - A.b) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function applyCssVariables(light: string, dark: string) {
  // Derived UI colors from theme
  const selBg = mix(light, dark, 0.35); // selected square
  const lastMoveBg = mix(light, dark, 0.25); // last move squares
  const ringColor = rgbaString(dark, 0.65); // move ring stroke
  const moveDot = rgbaString(dark, 0.3); // quiet move dot
  const danger = "#ef4444"; // red
  const dangerGlow = "rgba(239, 68, 68, 0.55)";

  const root = document.documentElement;
  root.style.setProperty("--light", light);
  root.style.setProperty("--dark", dark);

  // NEW: theme-driven UI accents
  root.style.setProperty("--sel-bg", selBg);
  root.style.setProperty("--lastmove-bg", lastMoveBg);
  root.style.setProperty("--ring-color", ringColor);
  root.style.setProperty("--move-dot", moveDot);

  // King in check / mate glow
  root.style.setProperty("--king-danger", danger);
  root.style.setProperty("--king-danger-glow", dangerGlow);
}

const Ctx = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AppearanceState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  });

  const colors = useMemo(() => {
    if (state.theme === "custom")
      return { light: state.customLight, dark: state.customDark };
    return THEME_COLORS[state.theme];
  }, [state.theme, state.customLight, state.customDark]);

  useEffect(() => {
    applyCssVariables(colors.light, colors.dark);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [colors.light, colors.dark, state]);

  const value: AppearanceContextValue = {
    ...state,
    setPieceSet: (v) => setState((s) => ({ ...s, pieceSet: v })),
    setTheme: (k) => setState((s) => ({ ...s, theme: k })),
    setCustomLight: (hex) =>
      setState((s) => ({ ...s, customLight: hex, theme: "custom" })),
    setCustomDark: (hex) =>
      setState((s) => ({ ...s, customDark: hex, theme: "custom" })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppearance() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}
