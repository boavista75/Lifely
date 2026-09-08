import {
  ALPINE_RACES_2627,
  type AlpineCat,
  type AlpineDisc,
  type AlpineGender,
  type AlpinePlace,
  type AlpineRaceRow,
} from "@/data/alpineSeason2627";
import { KB_TEXT_SCALE_DEFAULT } from "@/lib/kb";
import type { LifelyItem, LifelyKbNode } from "@/types";

export const ALPINE_ITEM_PREFIX = "item-ski-2627-";
export const ALPINE_KB_PREFIX = "kb-ski-2627";

const FOLDER_ROOT = "kb-ski-2627";
const FOLDER_WC = "kb-ski-2627-wc";
const FOLDER_WCH = "kb-ski-2627-wch";
const PAGE_INDEX = "kb-ski-2627-index";

const PLACES: Record<AlpinePlace, { name: string; nation: string }> = {
  solden: { name: "Sölden", nation: "Austrija" },
  levi: { name: "Levi", nation: "Finska" },
  gurgl: { name: "Gurgl", nation: "Austrija" },
  killington: { name: "Killington", nation: "SAD" },
  copper: { name: "Copper Mountain", nation: "SAD" },
  beaver: { name: "Beaver Creek", nation: "SAD" },
  tremblant: { name: "Tremblant", nation: "Kanada" },
  valdisere: { name: "Val d'Isère", nation: "Francuska" },
  gardena: { name: "Val Gardena / Gröden", nation: "Italija" },
  stmoritz: { name: "St. Moritz", nation: "Švajcarska" },
  altabadia: { name: "Alta Badia", nation: "Italija" },
  courchevel: { name: "Courchevel", nation: "Francuska" },
  madonna: { name: "Madonna di Campiglio", nation: "Italija" },
  bormio: { name: "Bormio", nation: "Italija" },
  gosau: { name: "Gosau", nation: "Austrija" },
  kranjska: { name: "Kranjska Gora", nation: "Slovenija" },
  flachau: { name: "Flachau", nation: "Austrija" },
  fassa: { name: "Val di Fassa", nation: "Italija" },
  adelboden: { name: "Adelboden", nation: "Švajcarska" },
  wengen: { name: "Wengen", nation: "Švajcarska" },
  cortina: { name: "Cortina d'Ampezzo", nation: "Italija" },
  kronplatz: { name: "Kronplatz", nation: "Italija" },
  kitz: { name: "Kitzbühel", nation: "Austrija" },
  jasna: { name: "Jasná", nation: "Slovačka" },
  schladming: { name: "Schladming", nation: "Austrija" },
  chamonix: { name: "Chamonix", nation: "Francuska" },
  garmisch: { name: "Garmisch-Partenkirchen", nation: "Nemačka" },
  lenzerheide: { name: "Lenzerheide", nation: "Švajcarska" },
  saalbach: { name: "Saalbach", nation: "Austrija" },
  kvitfjell: { name: "Kvitfjell", nation: "Norveška" },
  soldeu: { name: "Soldeu", nation: "Andora" },
  narvik: { name: "Narvik", nation: "Norveška" },
  are: { name: "Åre", nation: "Švedska" },
  sunvalley: { name: "Sun Valley", nation: "SAD" },
  crans: { name: "Crans-Montana", nation: "Švajcarska" },
};

const DISCS: Record<AlpineDisc, string> = {
  DH: "Spust",
  SG: "Super-G",
  GS: "Veleslalom",
  SL: "Slalom",
  TP: "Timski paralel",
  TC: "Timska kombinacija",
};

const MONTHS = [
  "",
  "januar",
  "februar",
  "mart",
  "april",
  "maj",
  "jun",
  "jul",
  "avgust",
  "septembar",
  "oktobar",
  "novembar",
  "decembar",
];

function genderLabel(gender: AlpineGender): string {
  if (gender === "M") return "Muškarci";
  if (gender === "A") return "Mešovito";
  return "Žene";
}

function catLabel(cat: AlpineCat): { short: string; full: string } {
  if (cat === "WSC") {
    return { short: "SP", full: "Svetsko prvenstvo" };
  }
  return { short: "SK", full: "Svetski kup" };
}

function srDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day}. ${MONTHS[month]} ${year}.`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function raceTitle(row: AlpineRaceRow): string {
  const [, , , place, gender, disc, cat] = row;
  const { short } = catLabel(cat);
  return `${short} · ${genderLabel(gender)} · ${DISCS[disc]} · ${PLACES[place].name}`;
}

function itemId(raceId: number): string {
  return `${ALPINE_ITEM_PREFIX}r-${raceId}`;
}

function pageId(raceId: number): string {
  return `${ALPINE_KB_PREFIX}-r-${raceId}`;
}

function racePageContent(row: AlpineRaceRow): string {
  const [date, raceId, eventId, place, gender, disc, cat] = row;
  const loc = PLACES[place];
  const { full } = catLabel(cat);
  const fis = `https://www.fis-ski.com/DB/general/results.html?sectorcode=AL&raceid=${raceId}`;
  const event = `https://www.fis-ski.com/DB/general/event-details.html?sectorcode=AL&eventid=${eventId}&seasoncode=2027`;
  return (
    `<h2>${escapeHtml(genderLabel(gender))} · ${escapeHtml(DISCS[disc])}</h2>` +
    `<p><strong>Datum:</strong> ${escapeHtml(srDate(date))}</p>` +
    `<p><strong>Lokacija:</strong> ${escapeHtml(`${loc.name}, ${loc.nation}`)}</p>` +
    `<p><strong>Disciplina:</strong> ${escapeHtml(DISCS[disc])}</p>` +
    `<p><strong>Kategorija:</strong> ${escapeHtml(full)}</p>` +
    `<h2>Učesnici</h2>` +
    `<p>Zvaničan pregled svih takmičara na ovoj trci (FIS start lista / rezultati):</p>` +
    `<p><a href="${escapeHtml(fis)}" target="_blank" rel="noopener noreferrer">Pregled svih učesnika na FIS-u</a></p>` +
    `<p>FIS start listu obično objavi 1–2 dana pred trku. Do tada otvori isti link — tu će se pojaviti kompletan spisak učesnika.</p>` +
    `<p><a href="${escapeHtml(event)}" target="_blank" rel="noopener noreferrer">FIS stranica vikenda / događaja</a></p>`
  );
}

export function alpineSeasonItems(now: string): LifelyItem[] {
  return ALPINE_RACES_2627.map((row) => {
    const [date, raceId] = row;
    return {
      id: itemId(raceId),
      title: raceTitle(row),
      date,
      timeMode: "none" as const,
      startTime: null,
      endTime: null,
      completed: false,
      noteId: null,
      kbPageId: pageId(raceId),
      sport: true,
      createdAt: now,
      updatedAt: now,
    };
  });
}

export function alpineSeasonKb(now: string): LifelyKbNode[] {
  const folders: LifelyKbNode[] = [
    {
      id: FOLDER_ROOT,
      kind: "folder",
      parentId: null,
      title: "Alpsko skijanje 26/27",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: FOLDER_WC,
      kind: "folder",
      parentId: FOLDER_ROOT,
      title: "Svetski kup",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: FOLDER_WCH,
      kind: "folder",
      parentId: FOLDER_ROOT,
      title: "Svetsko prvenstvo Crans-Montana",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const wcLines: string[] = [];
  const wchLines: string[] = [];
  const pages: LifelyKbNode[] = ALPINE_RACES_2627.map((row) => {
    const [, raceId, , , , , cat] = row;
    const title = raceTitle(row);
    const id = pageId(raceId);
    const line =
      `<li>${escapeHtml(srDate(row[0]))} — <a href="kb://${id}">${escapeHtml(title)}</a></li>`;
    if (cat === "WSC") wchLines.push(line);
    else wcLines.push(line);
    return {
      id,
      kind: "page" as const,
      parentId: cat === "WSC" ? FOLDER_WCH : FOLDER_WC,
      title,
      content: racePageContent(row),
      textScale: KB_TEXT_SCALE_DEFAULT,
      createdAt: now,
      updatedAt: now,
    };
  });

  const index: LifelyKbNode = {
    id: PAGE_INDEX,
    kind: "page",
    parentId: FOLDER_ROOT,
    title: "Pregled sezone 26/27",
    content:
      `<h2>Svetski kup 2026/27</h2>` +
      `<p>43 muške i 40 ženskih trka. Na svakom datumu u kalendaru je lokacija i disciplina; ikonica Knowledge vodi na pregled učesnika.</p>` +
      `<ul>${wcLines.join("")}</ul>` +
      `<h2>Svetsko prvenstvo · februar 2027 · Crans-Montana</h2>` +
      `<p>11 medalja od 1. do 14. februara 2027.</p>` +
      `<ul>${wchLines.join("")}</ul>`,
    textScale: KB_TEXT_SCALE_DEFAULT,
    createdAt: now,
    updatedAt: now,
  };

  return [...folders, index, ...pages];
}

export function mergeAlpineSeasonItems(items: LifelyItem[]): {
  items: LifelyItem[];
  added: number;
} {
  const ids = new Set(items.map((item) => item.id));
  const extra = alpineSeasonItems(new Date().toISOString()).filter(
    (item) => !ids.has(item.id),
  );
  if (extra.length === 0) return { items, added: 0 };
  return { items: [...items, ...extra], added: extra.length };
}

export function mergeAlpineSeasonKb(nodes: LifelyKbNode[]): {
  nodes: LifelyKbNode[];
  added: number;
} {
  const ids = new Set(nodes.map((node) => node.id));
  const extra = alpineSeasonKb(new Date().toISOString()).filter(
    (node) => !ids.has(node.id),
  );
  if (extra.length === 0) return { nodes, added: 0 };
  return { nodes: [...nodes, ...extra], added: extra.length };
}
