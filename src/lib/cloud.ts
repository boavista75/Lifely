import { text } from "@/i18n";
import { syncState } from "@/lib/api";
import { EMPTY_FINANCE_DATA } from "@/lib/finances";
import type { FinanceData, LifelyItem, LifelyKbNode, LifelyNote } from "@/types";
import { create } from "zustand";

export type CloudBag = {
  items: LifelyItem[];
  notes: LifelyNote[];
  nodes: LifelyKbNode[];
  finances: FinanceData;
};

type CloudUi = {
  status: "idle" | "saving" | "error";
  message: string;
};

export const useCloudStore = create<CloudUi>(() => ({
  status: "idle",
  message: "",
}));

let active = false;
let epoch = 0;
let desired: CloudBag | null = null;
let acked: CloudBag | null = null;
let dirty = false;
let chain: Promise<void> = Promise.resolve();
let retryTimer: number | null = null;
let pushTimer: number | null = null;

export function cloudActive(): boolean {
  return active;
}

export function readCloud(): CloudBag {
  if (!desired) return { items: [], notes: [], nodes: [], finances: EMPTY_FINANCE_DATA };
  return desired;
}

export function beginCloud(remote: CloudBag, current: CloudBag): void {
  active = true;
  acked = structuredClone(remote);
  desired = structuredClone(current);
  dirty = JSON.stringify(acked) !== JSON.stringify(desired);
}

export function endCloud(): void {
  epoch += 1;
  active = false;
  desired = null;
  acked = null;
  dirty = false;
  if (retryTimer !== null) {
    window.clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (pushTimer !== null) {
    window.clearTimeout(pushTimer);
    pushTimer = null;
  }
  useCloudStore.setState({ status: "idle", message: "" });
}

export function writeCloudItems(items: LifelyItem[]): void {
  write("items", items);
}

export function writeCloudNotes(notes: LifelyNote[]): void {
  write("notes", notes);
}

export function writeCloudNodes(nodes: LifelyKbNode[]): void {
  write("nodes", nodes);
}

export function writeCloudFinances(finances: FinanceData): void {
  write("finances", finances);
}

function write<K extends keyof CloudBag>(key: K, value: CloudBag[K]): void {
  if (!desired) return;
  desired[key] = value;
  dirty = true;
  schedule();
}

function schedule(): void {
  if (pushTimer !== null) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = null;
    void flushCloudNow().catch(() => undefined);
  }, 400);
}

export function flushCloudNow(): Promise<void> {
  const run = chain.then(() => push());
  chain = run.catch(() => undefined);
  return run;
}

async function push(): Promise<void> {
  const token = epoch;
  while (active && dirty && desired && acked && token === epoch) {
    dirty = false;
    const snapshot = structuredClone(desired);
    const patch = {
      items: diffRecords(acked.items, snapshot.items),
      notes: diffRecords(acked.notes, snapshot.notes),
      nodes: diffRecords(acked.nodes, snapshot.nodes),
      finances:
        JSON.stringify(acked.finances) === JSON.stringify(snapshot.finances)
          ? null
          : snapshot.finances,
    };
    if (!patchHasChanges(patch)) {
      acked = snapshot;
      continue;
    }
    useCloudStore.setState({ status: "saving", message: "" });
    try {
      await syncState(patch);
    } catch (error) {
      dirty = true;
      const message = error instanceof Error ? error.message : text("boot.saveFailed");
      useCloudStore.setState({ status: "error", message });
      if (retryTimer === null && active) {
        retryTimer = window.setTimeout(() => {
          retryTimer = null;
          void flushCloudNow().catch(() => undefined);
        }, 8000);
      }
      throw error;
    }
    if (token !== epoch) return;
    acked = snapshot;
  }
  if (active && token === epoch) useCloudStore.setState({ status: "idle", message: "" });
}

function diffRecords<T extends { id: string }>(
  prev: T[],
  next: T[],
): { upsert: T[]; deleteIds: string[] } {
  const prevJson = new Map(prev.map((row) => [row.id, JSON.stringify(row)]));
  const nextIds = new Set<string>();
  const upsert: T[] = [];
  for (const row of next) {
    nextIds.add(row.id);
    if (prevJson.get(row.id) !== JSON.stringify(row)) upsert.push(row);
  }
  return {
    upsert,
    deleteIds: [...prevJson.keys()].filter((id) => !nextIds.has(id)),
  };
}

function patchHasChanges(patch: {
  items: { upsert: unknown[]; deleteIds: string[] };
  notes: { upsert: unknown[]; deleteIds: string[] };
  nodes: { upsert: unknown[]; deleteIds: string[] };
  finances: FinanceData | null;
}): boolean {
  return (
    patch.items.upsert.length > 0 ||
    patch.items.deleteIds.length > 0 ||
    patch.notes.upsert.length > 0 ||
    patch.notes.deleteIds.length > 0 ||
    patch.nodes.upsert.length > 0 ||
    patch.nodes.deleteIds.length > 0 ||
    patch.finances !== null
  );
}
