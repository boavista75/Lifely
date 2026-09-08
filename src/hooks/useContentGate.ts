import { useEffect, useState } from "react";

export function useContentGate<T>(key: T, enabled: boolean) {
  const [mounted, setMounted] = useState<T | null>(null);

  useEffect(() => {
    if (!enabled) {
      setMounted(null);
      return;
    }

    let nextFrame = 0;
    const frame = requestAnimationFrame(() => {
      nextFrame = requestAnimationFrame(() => setMounted(key));
    });

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
    };
  }, [enabled, key]);

  return enabled && mounted === key;
}
