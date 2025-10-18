import { useAppearance } from "../../context/AppearanceContext";
import {
  PIECE_SETS,
  THEMES,
  getThemeColor,
  type ThemeKey,
} from "../../lib/ui/appearance";

function PiecesPreview({ set }: { set: string }) {
  const codes = ["wK", "wQ", "wR", "wB", "wN", "wP"];
  return (
    <div className="preview-row" style={{ marginTop: 16 }}>
      {codes.map((c) => (
        <img
          key={c}
          className="preview-piece"
          src={`/pieces/${set}/${c}.svg`}
          alt={`${set}-${c}`}
          style={{
            width: 64,
            height: 64,
            objectFit: "contain",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,.3))",
          }}
        />
      ))}
    </div>
  );
}

export default function Appearance() {
  const {
    pieceSet,
    setPieceSet,
    theme,
    setTheme,
    customLight,
    customDark,
    setCustomLight,
    setCustomDark,
  } = useAppearance();
  const lightColor = getThemeColor(theme as ThemeKey, "light", customLight);
  const darkColor = getThemeColor(theme as ThemeKey, "dark", customDark);

  return (
    <div
      style={{
        display: "grid",
        gap: 32,
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 12px",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "2.4rem", textAlign: "center" }}>
        🎨 Appearance
      </h1>

      <section className="card" style={{ padding: "24px 28px" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 16 }}>Piece Set</h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <select
            value={pieceSet}
            onChange={(e) => setPieceSet(e.target.value)}
            style={{
              flex: "1 1 260px",
              fontSize: "1.1rem",
              padding: "12px 14px",
              borderRadius: 12,
              background: "#0f172a",
              color: "#e5e7eb",
              border: "2px solid #24324a",
              outline: "none",
            }}
          >
            {PIECE_SETS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div style={{ flex: "1 1 320px", textAlign: "center" }}>
            <PiecesPreview set={pieceSet} />
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: "24px 28px" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: 16 }}>Board Theme</h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeKey)}
            style={{
              flex: "1 1 260px",
              fontSize: "1.1rem",
              padding: "12px 14px",
              borderRadius: 12,
              background: "#0f172a",
              color: "#e5e7eb",
              border: "2px solid #24324a",
              outline: "none",
            }}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div
            style={{
              flex: "1 1 200px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 48,
                height: 48,
                background: lightColor,
                border: "2px solid #1f2a44",
                borderRadius: 8,
              }}
            />
            <span
              style={{
                width: 48,
                height: 48,
                background: darkColor,
                border: "2px solid #1f2a44",
                borderRadius: 8,
              }}
            />
          </div>
        </div>

        {theme === "custom" && (
          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 24,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                fontSize: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              Light Color
              <input
                type="color"
                value={customLight}
                onChange={(e) => setCustomLight(e.target.value)}
                style={{
                  width: 70,
                  height: 50,
                  borderRadius: 8,
                  border: "none",
                }}
              />
            </label>
            <label
              style={{
                fontSize: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              Dark Color
              <input
                type="color"
                value={customDark}
                onChange={(e) => setCustomDark(e.target.value)}
                style={{
                  width: 70,
                  height: 50,
                  borderRadius: 8,
                  border: "none",
                }}
              />
            </label>
          </div>
        )}
      </section>

      <p
        style={{
          textAlign: "center",
          opacity: 0.8,
          fontSize: "1rem",
          marginTop: 8,
        }}
      >
        Your selections are saved automatically and applied instantly.
      </p>
    </div>
  );
}
