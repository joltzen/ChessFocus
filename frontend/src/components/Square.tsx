import React from "react";

type Props = {
  coord: string;
  isLight: boolean;
  isSelected?: boolean;
  isMoveTarget?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
};

const Square: React.FC<Props> = ({
  coord,
  isLight,
  isSelected,
  isMoveTarget,
  onClick,
  children,
}) => {
  const cls = [
    "square",
    isLight ? "light" : "dark",
    isSelected ? "selected" : "",
    isMoveTarget ? "highlight" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div aria-label={coord} className={cls} onClick={onClick}>
      {children}
    </div>
  );
};

export default Square;
