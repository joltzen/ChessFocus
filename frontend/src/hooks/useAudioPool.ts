import { useEffect, useMemo, useRef } from "react";

type SoundKey = "move" | "capture" | "castle" | "check" | "promote";
type Pool = Record<
  SoundKey,
  [HTMLAudioElement | null, HTMLAudioElement | null]
>;

const SOURCES: Record<SoundKey, string> = {
  move: "/sounds/move.mp3",
  capture: "/sounds/capture.mp3",
  castle: "/sounds/castle.mp3",
  check: "/sounds/check.mp3",
  promote: "/sounds/promote.mp3",
};

export function useAudioPool(enabled = true) {
  const poolRef = useRef<Pool>({
    move: [null, null],
    capture: [null, null],
    castle: [null, null],
    check: [null, null],
    promote: [null, null],
  });

  const idxRef = useRef<Record<SoundKey, 0 | 1>>({
    move: 0,
    capture: 0,
    castle: 0,
    check: 0,
    promote: 0,
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const mk = (src: string) => {
      const a1 = new Audio(src);
      a1.preload = "auto";
      const a2 = new Audio(src);
      a2.preload = "auto";
      a1.muted = true;
      a1.play().finally(() => {
        a1.pause();
        a1.currentTime = 0;
        a1.muted = false;
      });
      a2.muted = true;
      a2.play().finally(() => {
        a2.pause();
        a2.currentTime = 0;
        a2.muted = false;
      });
      return [a1, a2] as [HTMLAudioElement, HTMLAudioElement];
    };
    (Object.keys(SOURCES) as SoundKey[]).forEach((k) => {
      if (!poolRef.current[k][0]) poolRef.current[k] = mk(SOURCES[k]);
    });
  }, [enabled]);

  const play = useMemo(() => {
    return (key: SoundKey) => {
      if (!enabled) return;
      const pair = poolRef.current[key];
      const idx = idxRef.current[key] === 0 ? 1 : 0;
      idxRef.current[key] = idx;
      const a = pair[idx];
      if (!a) return;
      try {
        a.pause();
        a.currentTime = 0;
        void a.play();
      } catch {
        // nothing
      }
    };
  }, [enabled]);

  return { play };
}
