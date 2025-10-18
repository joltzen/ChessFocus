import React from "react";

type Props = {
  pieceSet: string;
  color: "w" | "b";
  type: "p" | "n" | "b" | "r" | "q" | "k";
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLImageElement>) => void;
  onDrag?: (e: React.DragEvent<HTMLImageElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLImageElement>) => void;
  className?: string;
};

export function PieceImage({
  pieceSet,
  color,
  type,
  draggable,
  onDragStart,
  onDrag,
  onDragEnd,
  className,
}: Props) {
  return (
    <img
      className={className ?? "piece"}
      alt={`${color}${type}`}
      src={`/pieces/${pieceSet}/${color}${type.toUpperCase()}.svg`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
    />
  );
}
