import { text } from "@/i18n";
import {
  deleteRemoteMedia,
  downloadMedia,
  fetchState,
  uploadMedia,
  type PublicUser,
} from "@/lib/api";
import { beginCloud, endCloud, flushCloudNow, type CloudBag } from "@/lib/cloud";
import { EMPTY_FINANCE_DATA } from "@/lib/finances";
import { listLocalMedia, setRemoteMedia } from "@/lib/media";
import {
  clearLocalUserData,
  loadFinances,
  loadItems,
  loadKb,
  loadNotes,
} from "@/lib/storage";
import { useFinancesStore } from "@/store/useFinancesStore";
import { useItemsStore } from "@/store/useItemsStore";
import { useKbStore } from "@/store/useKbStore";
import { useNotesStore } from "@/store/useNotesStore";
import type { FinanceData, LifelyItem, LifelyKbNode, LifelyNote } from "@/types";
import { create } from "zustand";

const MIGRATED_KEY = "lifely-migrated-user";

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

export function resetHydration(): void {
  inflight = null;
  useBootStore.setState({ ready: false });
}

export function hydrateApp(
  user: PublicUser,
  onProgress: (message: string) => void,
): Promise<void> {
  if (useBootStore.getState().ready) return Promise.resolve();
  if (inflight) return inflight;

  inflight = run(user, onProgress).catch((error: unknown) => {
    endCloud();
    setRemoteMedia(null);
    inflight = null;
    useBootStore.setState({ ready: false });
    throw error;
  });
  return inflight;
}

async function run(user: PublicUser, onProgress: (message: string) => void): Promise<void> {
  onProgress(text("boot.loading"));
  const remoteState = await fetchState();
  const remote = toBag(remoteState);
  let current = remote;
  const shouldMigrate =
    user.username === "nikola" && localStorage.getItem(MIGRATED_KEY) !== user.id;
  let media: { id: string; blob: Blob }[] = [];
  const hadLocalUserData =
    shouldMigrate &&
    Boolean(
      localStorage.getItem("lifely-items") ||
        localStorage.getItem("lifely-notes") ||
        localStorage.getItem("lifely-kb") ||
        localStorage.getItem("lifely-finances"),
    );
  if (hadLocalUserData) {
    onProgress(text("boot.migrate"));
    const local: CloudBag = {
      items: loadItems(),
      notes: loadNotes(),
      nodes: loadKb(),
      finances: loadFinances(),
    };
    if (hasSubstance(local)) {
      current = {
        items: preferLocal(remote.items, local.items),
        notes: preferLocal(remote.notes, local.notes),
        nodes: preferLocal(remote.nodes, local.nodes),
        finances: pickFinances(remote.finances, local.finances),
      };
      media = await listLocalMedia();
    }
  }

  setRemoteMedia({
    save: uploadMedia,
    load: downloadMedia,
    remove: deleteRemoteMedia,
  });
  beginCloud(remote, current);
  onProgress(text("boot.saving"));
  await flushCloudNow();

  if (shouldMigrate && media.length > 0) {
    const have = new Set(remoteState.mediaIds);
    let index = 0;
    for (const entry of media) {
      index += 1;
      onProgress(text("boot.files", { index, total: media.length }));
      if (have.has(entry.id)) continue;
      await uploadMedia(entry.id, entry.blob);
    }
  }
  if (shouldMigrate) {
    localStorage.setItem(MIGRATED_KEY, user.id);
    if (hadLocalUserData) clearLocalUserData();
  }

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
  await flushCloudNow();
  useBootStore.setState({ ready: true });
}

function toBag(state: {
  items: unknown[];
  notes: unknown[];
  nodes: unknown[];
  finances: unknown | null;
}): CloudBag {
  return {
    items: state.items as LifelyItem[],
    notes: state.notes as LifelyNote[],
    nodes: state.nodes as LifelyKbNode[],
    finances: (state.finances as FinanceData | null) ?? EMPTY_FINANCE_DATA,
  };
}

function hasSubstance(bag: CloudBag): boolean {
  return (
    bag.items.length > 0 ||
    bag.notes.length > 0 ||
    bag.nodes.length > 0 ||
    bag.finances.salaries.length > 0 ||
    bag.finances.expenses.length > 0 ||
    bag.finances.bonuses.length > 0 ||
    bag.finances.savings.length > 0
  );
}

function preferLocal<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const map = new Map(remote.map((row) => [row.id, row]));
  for (const row of local) map.set(row.id, row);
  return [...map.values()];
}

function pickFinances(remote: FinanceData, local: FinanceData): FinanceData {
  const remoteMoney =
    remote.salaries.length + remote.expenses.length + remote.bonuses.length + remote.savings.length;
  const localMoney =
    local.salaries.length + local.expenses.length + local.bonuses.length + local.savings.length;
  if (remoteMoney === 0 && localMoney > 0) return local;
  return remote;
}
