import type { LifelyItem, TimeMode } from "@/types";

const MODE_RANK: Record<TimeMode, number> = {
  range: 0,
  start: 1,
  none: 2,
};

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function normalizeTime(time: string): string {
  const [hours = "00", minutes = "00"] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function addHour(time: string): string {
  const minutes = timeToMinutes(time) + 60;
  const wrapped = Math.min(minutes, 23 * 60 + 59);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatItemTime(item: LifelyItem): string | null {
  if (item.timeMode === "none" || !item.startTime) return null;
  if (item.timeMode === "start") return item.startTime;
  if (item.endTime) return `${item.startTime} – ${item.endTime}`;
  return item.startTime;
}

export function compareDayItems(a: LifelyItem, b: LifelyItem): number {
  const rank = MODE_RANK[a.timeMode] - MODE_RANK[b.timeMode];
  if (rank !== 0) return rank;
  if (a.startTime && b.startTime && a.startTime !== b.startTime) {
    return a.startTime.localeCompare(b.startTime);
  }
  return a.createdAt.localeCompare(b.createdAt);
}

export function sortDayItems(items: LifelyItem[]): LifelyItem[] {
  const active = items.filter((item) => !item.completed).sort(compareDayItems);
  const done = items.filter((item) => item.completed).sort(compareDayItems);
  return [...active, ...done];
}

export function itemsOnDate(
  items: LifelyItem[],
  dateKey: string,
): LifelyItem[] {
  return sortDayItems(items.filter((item) => item.date === dateKey));
}

export function isValidRange(start: string, end: string): boolean {
  return timeToMinutes(end) > timeToMinutes(start);
}
