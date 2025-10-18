type FrameProps = {
  showAxes?: boolean;
  displayFiles: readonly string[];
  displayRanks: readonly number[];
  children: React.ReactNode;
};

export function BoardFrame({
  showAxes = true,
  displayFiles,
  displayRanks,
  children,
}: FrameProps) {
  return (
    <div className="board-wrap">
      {showAxes &&
        displayFiles.map((f, i) => (
          <div
            key={`t-${f}`}
            className="axis"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {f}
          </div>
        ))}
      {showAxes &&
        displayFiles.map((f, i) => (
          <div
            key={`b-${f}`}
            className="axis"
            style={{ gridColumn: i + 2, gridRow: 10 }}
          >
            {f}
          </div>
        ))}
      {showAxes &&
        displayRanks.map((r, i) => (
          <div
            key={`l-${r}`}
            className="axis"
            style={{ gridColumn: 1, gridRow: i + 2 }}
          >
            {r}
          </div>
        ))}
      {showAxes &&
        displayRanks.map((r, i) => (
          <div
            key={`r-${r}`}
            className="axis"
            style={{ gridColumn: 10, gridRow: i + 2 }}
          >
            {r}
          </div>
        ))}
      {children}
    </div>
  );
}
