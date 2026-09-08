import { NBA_GAMES_2627, type NbaGameRow, type NbaTeam } from "@/data/nbaSeason2627";
import type { LifelyItem } from "@/types";

export const NBA_ITEM_PREFIX = "item-nba-2627-";

const TEAMS: Record<NbaTeam, string> = {
  ATL: "Hawks",
  BOS: "Celtics",
  BKN: "Nets",
  CHA: "Hornets",
  CHI: "Bulls",
  CLE: "Cavaliers",
  DAL: "Mavericks",
  DEN: "Nuggets",
  DET: "Pistons",
  GSW: "Warriors",
  HOU: "Rockets",
  IND: "Pacers",
  LAC: "Clippers",
  LAL: "Lakers",
  MEM: "Grizzlies",
  MIA: "Heat",
  MIL: "Bucks",
  MIN: "Timberwolves",
  NOP: "Pelicans",
  NYK: "Knicks",
  OKC: "Thunder",
  ORL: "Magic",
  PHI: "76ers",
  PHX: "Suns",
  POR: "Trail Blazers",
  SAC: "Kings",
  SAS: "Spurs",
  TOR: "Raptors",
  UTA: "Jazz",
  WAS: "Wizards",
};

function gameTitle(row: NbaGameRow): string {
  const [, , , away, home, neutral] = row;
  const sep = neutral === 1 ? "vs" : "@";
  return `NBA · ${TEAMS[away]} ${sep} ${TEAMS[home]}`;
}

function itemId(gameId: number): string {
  return `${NBA_ITEM_PREFIX}g-${gameId}`;
}

export function nbaSeasonItems(now: string): LifelyItem[] {
  return NBA_GAMES_2627.map((row) => {
    const [date, time, gameId] = row;
    return {
      id: itemId(gameId),
      title: gameTitle(row),
      date,
      timeMode: "start" as const,
      startTime: time,
      endTime: null,
      completed: false,
      noteId: null,
      kbPageId: null,
      sport: true,
      createdAt: now,
      updatedAt: now,
    };
  });
}

export function mergeNbaSeasonItems(items: LifelyItem[]): {
  items: LifelyItem[];
  added: number;
  removed: number;
} {
  const seeded = nbaSeasonItems(new Date().toISOString());
  const keepIds = new Set(seeded.map((item) => item.id));
  const kept = items.filter(
    (item) => !item.id.startsWith(NBA_ITEM_PREFIX) || keepIds.has(item.id),
  );
  const ids = new Set(kept.map((item) => item.id));
  const extra = seeded.filter((item) => !ids.has(item.id));
  const removed = items.length - kept.length;
  if (extra.length === 0 && removed === 0) {
    return { items, added: 0, removed: 0 };
  }
  return { items: [...kept, ...extra], added: extra.length, removed };
}
