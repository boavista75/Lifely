import {
  FREESTYLE_RACES_2627,
  type FreestyleCat,
  type FreestyleDisc,
  type FreestyleGender,
  type FreestylePlace,
  type FreestyleRaceRow,
} from "@/data/freestyleSeason2627";
import { KB_TEXT_SCALE_DEFAULT } from "@/lib/kb";
import type { LifelyItem, LifelyKbNode } from "@/types";

export const FREESTYLE_ITEM_PREFIX = "item-fs-2627-";
export const FREESTYLE_KB_PREFIX = "kb-fs-2627";

const FOLDER_ROOT = "kb-fs-2627";
const FOLDER_WC = "kb-fs-2627-wc";
const FOLDER_WC_MO = "kb-fs-2627-wc-mo";
const FOLDER_WC_PP = "kb-fs-2627-wc-pp";
const FOLDER_WC_SX = "kb-fs-2627-wc-sx";
const FOLDER_WCH = "kb-fs-2627-wch";
const PAGE_INDEX = "kb-fs-2627-index";

type DiscGroup = "mo" | "pp" | "sx";

const PLACES: Record<FreestylePlace, { name: string; nation: string }> = {
  innsbruck: { name: "Innsbruck", nation: "Austrija" },
  beijing: { name: "Peking", nation: "Kina" },
  valthorens: { name: "Val Thorens", nation: "Francuska" },
  secretgarden: { name: "Secret Garden", nation: "Kina" },
  breckenridge: { name: "Breckenridge", nation: "SAD" },
  ruka: { name: "Ruka", nation: "Finska" },
  arosa: { name: "Arosa", nation: "Švajcarska" },
  innichen: { name: "Innichen", nation: "Italija" },
  copper: { name: "Copper Mountain", nation: "SAD" },
  kreischberg: { name: "Kreischberg", nation: "Austrija" },
  lacbeauport: { name: "Lac-Beauport", nation: "Kanada" },
  laax: { name: "Laax", nation: "Švajcarska" },
  reiteralm: { name: "Reiteralm", nation: "Austrija" },
  valstcome: { name: "Val St-Côme", nation: "Kanada" },
  lakeplacid: { name: "Lake Placid", nation: "SAD" },
  tignes: { name: "Tignes", nation: "Francuska" },
  fassa: { name: "Val di Fassa", nation: "Italija" },
  waterville: { name: "Waterville Valley", nation: "SAD" },
  deervalley: { name: "Deer Valley", nation: "SAD" },
  veysonnaz: { name: "Veysonnaz", nation: "Švajcarska" },
  sarajevo: { name: "Sarajevo", nation: "Bosna i Hercegovina" },
  calgary: { name: "Calgary", nation: "Kanada" },
  almaty: { name: "Almaty", nation: "Kazahstan" },
  kopaonik: { name: "Kopaonik", nation: "Srbija" },
  aspen: { name: "Aspen", nation: "SAD" },
  gallivare: { name: "Gällivare", nation: "Švedska" },
  shahdag: { name: "Shahdag", nation: "Azerbejdžan" },
  craigleith: { name: "Craigleith", nation: "Kanada" },
  silvaplana: { name: "Silvaplana", nation: "Švajcarska" },
  montafon: { name: "Montafon", nation: "Austrija" },
};

const DISCS: Record<FreestyleDisc, string> = {
  MO: "Grbine",
  DM: "Parne grbine",
  AE: "Skokovi",
  AET: "Timski skokovi",
  DMT: "Timske parne grbine",
  SX: "Ski kros",
  SXT: "Timski ski kros",
  HP: "Halfpipe",
  SS: "Slopestyle",
  BA: "Big Air",
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

function genderLabel(gender: FreestyleGender): string {
  if (gender === "M") return "Muškarci";
  if (gender === "A") return "Mešovito";
  return "Žene";
}

function catLabel(cat: FreestyleCat): { short: string; full: string } {
  if (cat === "WSC") {
    return { short: "SP", full: "Svetsko prvenstvo" };
  }
  return { short: "SK", full: "Svetski kup" };
}

function discGroup(disc: FreestyleDisc): DiscGroup {
  if (disc === "SX" || disc === "SXT") return "sx";
  if (disc === "HP" || disc === "SS" || disc === "BA") return "pp";
  return "mo";
}

function wcFolderId(disc: FreestyleDisc): string {
  const group = discGroup(disc);
  if (group === "sx") return FOLDER_WC_SX;
  if (group === "pp") return FOLDER_WC_PP;
  return FOLDER_WC_MO;
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

function raceTitle(row: FreestyleRaceRow): string {
  const [, , , place, gender, disc, cat] = row;
  const { short } = catLabel(cat);
  return `${short} · ${genderLabel(gender)} · ${DISCS[disc]} · ${PLACES[place].name}`;
}

function itemId(raceId: number): string {
  return `${FREESTYLE_ITEM_PREFIX}r-${raceId}`;
}

function pageId(raceId: number): string {
  return `${FREESTYLE_KB_PREFIX}-r-${raceId}`;
}

function racePageContent(row: FreestyleRaceRow): string {
  const [date, raceId, eventId, place, gender, disc, cat] = row;
  const loc = PLACES[place];
  const { full } = catLabel(cat);
  const fis = `https://www.fis-ski.com/DB/general/results.html?sectorcode=FS&raceid=${raceId}`;
  const event = `https://www.fis-ski.com/DB/general/event-details.html?sectorcode=FS&eventid=${eventId}&seasoncode=2027`;
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

function indexLine(row: FreestyleRaceRow): string {
  const id = pageId(row[1]);
  return `<li>${escapeHtml(srDate(row[0]))} — <a href="kb://${id}">${escapeHtml(raceTitle(row))}</a></li>`;
}

export function freestyleSeasonItems(now: string): LifelyItem[] {
  return FREESTYLE_RACES_2627.map((row) => {
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

export function freestyleSeasonKb(now: string): LifelyKbNode[] {
  const folders: LifelyKbNode[] = [
    {
      id: FOLDER_ROOT,
      kind: "folder",
      parentId: null,
      title: "Freestyle skijanje 26/27",
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
      id: FOLDER_WC_MO,
      kind: "folder",
      parentId: FOLDER_WC,
      title: "Grbine i skokovi",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: FOLDER_WC_PP,
      kind: "folder",
      parentId: FOLDER_WC,
      title: "Park & Pipe",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: FOLDER_WC_SX,
      kind: "folder",
      parentId: FOLDER_WC,
      title: "Ski kros",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: FOLDER_WCH,
      kind: "folder",
      parentId: FOLDER_ROOT,
      title: "Svetsko prvenstvo Montafon",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const moLines: string[] = [];
  const ppLines: string[] = [];
  const sxLines: string[] = [];
  const wchLines: string[] = [];
  const pages: LifelyKbNode[] = FREESTYLE_RACES_2627.map((row) => {
    const [, raceId, , , , disc, cat] = row;
    const title = raceTitle(row);
    const id = pageId(raceId);
    const line = indexLine(row);
    if (cat === "WSC") wchLines.push(line);
    else if (discGroup(disc) === "sx") sxLines.push(line);
    else if (discGroup(disc) === "pp") ppLines.push(line);
    else moLines.push(line);
    return {
      id,
      kind: "page" as const,
      parentId: cat === "WSC" ? FOLDER_WCH : wcFolderId(disc),
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
      `<p>Moguls, aerials, ski kros i freeski park & pipe. Na svakom datumu u kalendaru je lokacija i disciplina; ikonica Knowledge vodi na pregled učesnika.</p>` +
      `<h3>Grbine i skokovi</h3>` +
      `<ul>${moLines.join("")}</ul>` +
      `<h3>Park & Pipe</h3>` +
      `<ul>${ppLines.join("")}</ul>` +
      `<h3>Ski kros</h3>` +
      `<ul>${sxLines.join("")}</ul>` +
      `<h2>Svetsko prvenstvo · mart 2027 · Montafon</h2>` +
      `<p>Medalje od 9. do 20. marta 2027. (grbine, skokovi, ski kros i park & pipe). Kvalifikacije nisu u kalendaru.</p>` +
      `<ul>${wchLines.join("")}</ul>`,
    textScale: KB_TEXT_SCALE_DEFAULT,
    createdAt: now,
    updatedAt: now,
  };

  return [...folders, index, ...pages];
}

export function mergeFreestyleSeasonItems(items: LifelyItem[]): {
  items: LifelyItem[];
  added: number;
} {
  const ids = new Set(items.map((item) => item.id));
  const extra = freestyleSeasonItems(new Date().toISOString()).filter(
    (item) => !ids.has(item.id),
  );
  if (extra.length === 0) return { items, added: 0 };
  return { items: [...items, ...extra], added: extra.length };
}

export function mergeFreestyleSeasonKb(nodes: LifelyKbNode[]): {
  nodes: LifelyKbNode[];
  added: number;
} {
  const ids = new Set(nodes.map((node) => node.id));
  const extra = freestyleSeasonKb(new Date().toISOString()).filter(
    (node) => !ids.has(node.id),
  );
  if (extra.length === 0) return { nodes, added: 0 };
  return { nodes: [...nodes, ...extra], added: extra.length };
}
