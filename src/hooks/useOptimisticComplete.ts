import { useState } from "react";

export function useOptimisticComplete(
  completed: boolean,
  commit: () => void,
): [boolean, () => void] {
  const [pending, setPending] = useState(false);
  const visual = completed || pending;

  function toggle() {
    if (completed) {
      commit();
      return;
    }
    if (pending) return;
    setPending(true);
    window.setTimeout(() => {
      commit();
      setPending(false);
    }, 420);
  }

  return [visual, toggle];
}
