import { useFinancesStore } from "@/store/useFinancesStore";
import { useItemsStore } from "@/store/useItemsStore";
import { useKbStore } from "@/store/useKbStore";
import { useNotesStore } from "@/store/useNotesStore";
import { create } from "zustand";

type BootState = {
  ready: boolean;
};

export const useBootStore = create<BootState>(() => ({
  ready: false,
}));

let inflight: Promise<void> | null = null;

function afterPaint(): Promise<void> {
  return new Promise((resolve) => {
    const done = () => window.setTimeout(resolve, 0);
    if (typeof requestAnimationFrame !== "function") {
      done();
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(done));
  });
}

export function hydrateApp(): Promise<void> {
  if (useBootStore.getState().ready) return Promise.resolve();
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      await afterPaint();
      useItemsStore.getState().hydrate();
      await afterPaint();
      useNotesStore.getState().hydrate();
      await afterPaint();
      useKbStore.getState().hydrate();
      await afterPaint();
      useFinancesStore.getState().hydrate();
      useItemsStore.getState().ensureAlpineSeason();
      useItemsStore.getState().ensureFreestyleSeason();
      useItemsStore.getState().ensureNbaSeason();
      useKbStore.getState().ensureAlpineSeason();
      useKbStore.getState().ensureFreestyleSeason();
    } finally {
      useBootStore.setState({ ready: true });
    }
  })();

  return inflight;
}
