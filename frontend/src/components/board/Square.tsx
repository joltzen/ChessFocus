import type { ReactNode } from "react";

type SquareProps = {
  coord: string;
  light: boolean;
  selected?: boolean;
  lastFrom?: boolean;
  lastTo?: boolean;
  target?: "dot" | "ring";
  children?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export default function Square({
  light,
  selected,
  lastFrom,
  lastTo,
  target,
  children,
  className,
  ...rest
}: SquareProps) {
  const cls = [
    "square",
    light ? "light" : "dark",
    selected ? "selected" : "",
    lastFrom ? "last-from" : "",
    lastTo ? "last-to" : "",
    target === "dot" ? "target-dot" : "",
    target === "ring" ? "target-circle" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
