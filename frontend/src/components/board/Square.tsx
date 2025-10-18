import { type ReactNode } from "react";

type SquareProps = {
  coord: string;
  light: boolean;
  selected?: boolean;
  target?: "dot" | "ring";
  onClick?: () => void;
  children?: ReactNode;
};

export default function Square({
  coord,
  light,
  selected,
  target,
  onClick,
  children,
}: SquareProps) {
  const cls = [
    "square",
    light ? "light" : "dark",
    selected ? "selected" : "",
    target === "dot" ? "target-dot" : "",
    target === "ring" ? "target-circle" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div aria-label={coord} className={cls} onClick={onClick}>
      {children}
    </div>
  );
}
