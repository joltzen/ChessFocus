import { useState } from "react";
import BlindBoard from "./BlindBoard";

export default function BlindChessPage() {
  const [showAxes, setShowAxes] = useState(true);
  const [showTargets, setShowTargets] = useState(false);
  const [enableClicks, setEnableClicks] = useState(true);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>🕶 Blind Chess</h2>

      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showAxes}
            onChange={(e) => setShowAxes(e.target.checked)}
          />
          Show axes
        </label>
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={showTargets}
            onChange={(e) => setShowTargets(e.target.checked)}
          />
          Show targets
        </label>
        <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={enableClicks}
            onChange={(e) => setEnableClicks(e.target.checked)}
          />
          Enable clicks
        </label>
      </div>

      <BlindBoard
        showAxes={showAxes}
        showTargets={showTargets}
        enableClicks={enableClicks}
        // initialFen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        onMove={({ san, from, to }) => {
          // hook for telemetry / training later
          console.log("Move:", san, from, "->", to);
        }}
      />
    </div>
  );
}
