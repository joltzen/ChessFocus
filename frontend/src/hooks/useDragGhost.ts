import { useCallback, useRef, useState } from "react";

type Ghost = {
  x: number;
  y: number;
  w: number;
  h: number;
  src: string | null;
  visible: boolean;
};

export function useDragGhost() {
  const [ghost, setGhost] = useState<Ghost>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    src: null,
    visible: false,
  });
  const shimRef = useRef<HTMLImageElement | null>(null);

  if (!shimRef.current && typeof Image !== "undefined") {
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    shimRef.current = img;
  }

  const begin = useCallback((ev: React.DragEvent<HTMLImageElement>) => {
    if (shimRef.current) ev.dataTransfer.setDragImage(shimRef.current, 0, 0);
    const el = ev.currentTarget;
    const rect = el.getBoundingClientRect();
    setGhost({
      x: ev.clientX,
      y: ev.clientY,
      w: rect.width,
      h: rect.height,
      src: el.src,
      visible: true,
    });
  }, []);

  const move = useCallback((clientX: number, clientY: number) => {
    setGhost((g) => (g.visible ? { ...g, x: clientX, y: clientY } : g));
  }, []);

  const end = useCallback(() => {
    setGhost((g) => ({ ...g, visible: false, src: null }));
  }, []);

  return { ghost, begin, move, end };
}
