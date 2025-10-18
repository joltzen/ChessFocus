type GridProps = {
  displayFiles: readonly string[];
  displayRanks: readonly number[];
  renderCell: (rIdx: number, fIdx: number) => React.ReactNode;
};

export function BoardGrid({
  displayFiles,
  displayRanks,
  renderCell,
}: GridProps) {
  return (
    <div className="board">
      {displayRanks.map((_, rIdx) =>
        displayFiles.map((_, fIdx) => renderCell(rIdx, fIdx))
      )}
    </div>
  );
}
