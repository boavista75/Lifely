export const PALETTES = [
  {
    id: "grove",
    name: "Gaj",
    // https://coolors.co/011638-364156-cdcdcd-dff8eb-214e34
    swatches: ["#011638", "#364156", "#cdcdcd", "#dff8eb", "#214e34"],
    navy: "#011638",
    slate: "#364156",
    silver: "#cdcdcd",
    mint: "#dff8eb",
    forest: "#214e34",
  },
  {
    id: "harbor",
    name: "Luka",
    // https://coolors.co/0d1b2a-1b263b-415a77-778da9-e0e1dd
    swatches: ["#0d1b2a", "#1b263b", "#415a77", "#778da9", "#e0e1dd"],
    navy: "#0d1b2a",
    slate: "#1b263b",
    silver: "#778da9",
    mint: "#e0e1dd",
    forest: "#415a77",
  },
  {
    id: "moss",
    name: "Mahovina",
    // https://coolors.co/2f3e46-354f52-52796f-84a98c-cad2c5
    swatches: ["#2f3e46", "#354f52", "#52796f", "#84a98c", "#cad2c5"],
    navy: "#2f3e46",
    slate: "#354f52",
    silver: "#84a98c",
    mint: "#cad2c5",
    forest: "#52796f",
  },
  {
    id: "dusk",
    name: "Sumrak",
    // https://coolors.co/22223b-4a4e69-9a8c98-c9ada7-f2e9e4
    swatches: ["#22223b", "#4a4e69", "#9a8c98", "#c9ada7", "#f2e9e4"],
    navy: "#22223b",
    slate: "#4a4e69",
    silver: "#c9ada7",
    mint: "#f2e9e4",
    forest: "#9a8c98",
  },
  {
    id: "clay",
    name: "Glina",
    // https://coolors.co/1c1412-3d2b2a-c0897e-d7ccc8-f5ebe0
    swatches: ["#1c1412", "#3d2b2a", "#c0897e", "#d7ccc8", "#f5ebe0"],
    navy: "#1c1412",
    slate: "#3d2b2a",
    silver: "#d7ccc8",
    mint: "#f5ebe0",
    forest: "#c0897e",
  },
] as const;

export type Palette = (typeof PALETTES)[number];
export type PaletteId = Palette["id"];

export const DEFAULT_PALETTE_ID: PaletteId = "grove";

export function isPaletteId(value: unknown): value is PaletteId {
  return PALETTES.some((palette) => palette.id === value);
}

export function getPalette(id: string | null | undefined): Palette {
  return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
}

export const PALETTE_VARS = [
  "navy",
  "slate",
  "silver",
  "mint",
  "forest",
] as const;

export function applyPaletteVars(
  root: HTMLElement,
  palette: Palette,
): void {
  root.dataset.palette = palette.id;
  for (const key of PALETTE_VARS) {
    root.style.setProperty(`--${key}`, palette[key]);
  }
}
