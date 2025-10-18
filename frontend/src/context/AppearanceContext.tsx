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
  mono: { light: "#ffffff", dark: "#646464ff" },
  custom: { light: DEFAULT_STATE.customLight, dark: DEFAULT_STATE.customDark },
};

function applyCssVariables(light: string, dark: string) {
  const root = document.documentElement;
  root.style.setProperty("--light", light);
  root.style.setProperty("--dark", dark);
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
