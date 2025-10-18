type SquareProps = {
  coord: string;
  light: boolean;
  selected?: boolean;
  target?: "dot" | "ring";
  lastFrom?: boolean;
  lastTo?: boolean;
  capturedFx?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
};

export default function Square({
  coord,
  light,
  selected,
  target,
  lastFrom,
  lastTo,
  capturedFx,
  onClick,
  children,
}: SquareProps) {
  const cls = [
    "square",
    light ? "light" : "dark",
    selected ? "selected" : "",
    target === "dot" ? "target-dot" : "",
    target === "ring" ? "target-circle" : "",
    lastFrom ? "last-from" : "",
    lastTo ? "last-to" : "",
    capturedFx ? "captured" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div aria-label={coord} className={cls} onClick={onClick}>
      {children}
    </div>
  );
}
