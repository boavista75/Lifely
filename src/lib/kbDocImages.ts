import type { ImageAsset, MsDocParseResult } from "@file-viewer/doc";

type Raster = { mime: string; bytes: Uint8Array };

const RASTER_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/bmp",
  "image/webp",
]);

export async function repairMsDocImages(
  parsed: MsDocParseResult,
  source: ArrayBuffer,
): Promise<void> {
  const bytes = new Uint8Array(source);
  const used = new Set<string>();
  for (const asset of parsed.assets) {
    if (asset.type !== "image") continue;
    if (!isUsableRaster(asset)) continue;
    used.add(fingerprint(asset.bytes));
  }

  const pool = uniqueRasters([
    ...extractRasters(bytes, false),
    ...(await extractOfficeArtRasters(bytes)),
  ]).filter((raster) => !used.has(fingerprint(raster.bytes)));
  let next = 0;

  for (const asset of parsed.assets) {
    if (asset.type !== "image") continue;
    if (isUsableRaster(asset)) continue;
    const recovered =
      extractRasters(asset.bytes, true)[0] ??
      (await extractOfficeArtRasters(asset.bytes))[0] ??
      pool[next++];
    if (!recovered) continue;
    applyRaster(asset, recovered);
  }
}

function uniqueRasters(rasters: Raster[]): Raster[] {
  const seen = new Set<string>();
  const out: Raster[] = [];
  for (const raster of rasters) {
    const key = fingerprint(raster.bytes);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(raster);
  }
  return out;
}

async function extractOfficeArtRasters(bytes: Uint8Array): Promise<Raster[]> {
  const found: Raster[] = [];
  for (let i = 0; i + 8 < bytes.length; i += 1) {
    const recType = u16(bytes, i + 2);
    if (
      recType !== 0xf01a &&
      recType !== 0xf01b &&
      recType !== 0xf01d &&
      recType !== 0xf01e &&
      recType !== 0xf01f &&
      recType !== 0xf02a
    ) {
      continue;
    }
    const recLen = u32(bytes, i + 4);
    if (recLen < 16 || recLen > 16 * 1024 * 1024) continue;
    if (i + 8 + recLen > bytes.length) continue;
    const instance = u16(bytes, i) >>> 4;
    const uidBytes = (instance & 1) === 1 ? 32 : 16;
    const payload = bytes.subarray(i + 8, i + 8 + recLen);
    if (recType === 0xf01e || recType === 0xf01d || recType === 0xf02a) {
      const image = payload.subarray(Math.min(uidBytes + 1, payload.length));
      const raster = pngAt(image, 0) ?? jpegAt(image, 0);
      if (raster) found.push(raster);
      continue;
    }
    if (recType === 0xf01f) {
      const dib = dibToBmp(payload.subarray(Math.min(uidBytes + 1, payload.length)));
      if (dib) found.push({ mime: "image/bmp", bytes: dib });
      continue;
    }
    const infoSize = uidBytes + 34;
    if (payload.length < infoSize) continue;
    const compression = payload[uidBytes + 32] ?? 0xff;
    let raw = payload.subarray(infoSize);
    if (compression === 0x00) {
      raw = (await inflateZlib(raw)) ?? raw;
    }
    const raster =
      extractRasters(raw, true)[0] ??
      rastersFromWmf(raw)[0] ??
      rastersFromEmf(raw)[0] ??
      findDib(raw);
    if (raster) found.push(raster);
  }
  return found;
}

async function inflateZlib(bytes: Uint8Array): Promise<Uint8Array | null> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  for (const format of ["deflate", "deflate-raw"] as const) {
    try {
      const stream = new Blob([copy]).stream().pipeThrough(
        new DecompressionStream(format),
      );
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      continue;
    }
  }
  return null;
}

function isUsableRaster(asset: ImageAsset): boolean {
  if (asset.displayable === false) return false;
  if (!RASTER_MIME.has(asset.mime)) return false;
  return asset.bytes.length > 32 && asset.dataUrl.startsWith("data:image/");
}

function applyRaster(asset: ImageAsset, raster: Raster): void {
  asset.mime = raster.mime;
  asset.bytes = raster.bytes;
  asset.dataUrl = dataUrl(raster.bytes, raster.mime);
  asset.displayable = true;
  if (asset.meta) {
    asset.meta.browserRenderable = true;
    asset.meta.vectorConverted = false;
  }
}

function extractRasters(bytes: Uint8Array, fromAsset: boolean): Raster[] {
  const found: Raster[] = [];
  const seen = new Set<string>();
  function push(raster: Raster | null) {
    if (!raster || raster.bytes.length < 64) return;
    const key = fingerprint(raster.bytes);
    if (seen.has(key)) return;
    seen.add(key);
    found.push(raster);
  }

  if (fromAsset) {
    push(pngAt(bytes, 0) ?? jpegAt(bytes, 0) ?? gifAt(bytes, 0) ?? bmpAt(bytes, 0));
  }

  for (let i = 0; i < bytes.length - 8; i += 1) {
    if (bytes[i] === 0x89 && bytes[i + 1] === 0x50) push(pngAt(bytes, i));
    else if (
      fromAsset &&
      bytes[i] === 0xff &&
      bytes[i + 1] === 0xd8 &&
      bytes[i + 2] === 0xff
    ) {
      push(jpegAt(bytes, i));
    } else if (fromAsset && bytes[i] === 0x47 && bytes[i + 1] === 0x49) {
      push(gifAt(bytes, i));
    } else if (fromAsset && bytes[i] === 0x42 && bytes[i + 1] === 0x4d) {
      push(bmpAt(bytes, i));
    } else if (
      bytes[i] === 0xd7 &&
      bytes[i + 1] === 0xcd &&
      bytes[i + 2] === 0xc6 &&
      bytes[i + 3] === 0x9a
    ) {
      for (const raster of rastersFromWmf(bytes.subarray(i))) push(raster);
    } else if (isEmfHeader(bytes, i)) {
      for (const raster of rastersFromEmf(bytes.subarray(i))) push(raster);
    }
  }

  if (fromAsset && found.length === 0) {
    const fromSvg = rasterFromSvg(bytes);
    if (fromSvg) found.push(fromSvg);
    const dib = findDib(bytes);
    if (dib) found.push(dib);
  }
  return found;
}

function rastersFromWmf(bytes: Uint8Array): Raster[] {
  const rasters: Raster[] = [];
  let offset = 0;
  if (u32(bytes, 0) === 0x9ac6cdd7) offset = 22;
  if (offset + 18 > bytes.length) return rasters;
  const headerSizeWords = u16(bytes, offset + 2);
  let cursor = offset + headerSizeWords * 2;
  while (cursor + 6 <= bytes.length) {
    const sizeWords = u32(bytes, cursor);
    const recordSize = sizeWords * 2;
    if (recordSize < 6 || cursor + recordSize > bytes.length) break;
    const fn = u16(bytes, cursor + 4);
    if (fn === 0) break;
    if (fn === 0x0f43 || fn === 0x0b41 || fn === 0x0940 || fn === 0x0d33) {
      const payload = bytes.subarray(cursor + 6, cursor + recordSize);
      const raster =
        pngAt(payload, indexOfMagic(payload, [0x89, 0x50, 0x4e, 0x47])) ??
        jpegAt(payload, indexOfMagic(payload, [0xff, 0xd8, 0xff])) ??
        findDib(payload);
      if (raster) rasters.push(raster);
    }
    cursor += recordSize;
  }
  return rasters;
}

function rastersFromEmf(bytes: Uint8Array): Raster[] {
  const rasters: Raster[] = [];
  let cursor = 0;
  while (cursor + 8 <= bytes.length) {
    const type = u32(bytes, cursor);
    const size = u32(bytes, cursor + 4);
    if (size < 8 || cursor + size > bytes.length) break;
    if (type === 0x51 || type === 0x4c || type === 0x4d || type === 0x72) {
      const payload = bytes.subarray(cursor, cursor + size);
      const raster =
        pngAt(payload, indexOfMagic(payload, [0x89, 0x50, 0x4e, 0x47])) ??
        jpegAt(payload, indexOfMagic(payload, [0xff, 0xd8, 0xff])) ??
        findDib(payload);
      if (raster) rasters.push(raster);
    }
    if (type === 0x0e) break;
    cursor += size;
  }
  return rasters;
}

function isEmfHeader(bytes: Uint8Array, i: number): boolean {
  if (i + 44 > bytes.length) return false;
  if (u32(bytes, i) !== 1) return false;
  return (
    bytes[i + 40] === 0x20 &&
    bytes[i + 41] === 0x45 &&
    bytes[i + 42] === 0x4d &&
    bytes[i + 43] === 0x46
  );
}

function findDib(bytes: Uint8Array): Raster | null {
  for (let i = 0; i + 40 < bytes.length; i += 1) {
    if (u32(bytes, i) !== 40) continue;
    const width = i32(bytes, i + 4);
    const height = Math.abs(i32(bytes, i + 8));
    const planes = u16(bytes, i + 12);
    const bitCount = u16(bytes, i + 14);
    if (planes !== 1) continue;
    if (![1, 4, 8, 16, 24, 32].includes(bitCount)) continue;
    if (width < 2 || width > 20000 || height < 2 || height > 20000) continue;
    const bmp = dibToBmp(bytes.subarray(i));
    if (bmp) return { mime: "image/bmp", bytes: bmp };
  }
  return null;
}

function dibToBmp(dib: Uint8Array): Uint8Array | null {
  if (dib.length < 40) return null;
  const headerSize = u32(dib, 0);
  if (headerSize < 12 || headerSize > dib.length) return null;
  const bitsPerPixel = headerSize === 12 ? u16(dib, 10) : u16(dib, 14);
  const compression = headerSize === 12 ? 0 : u32(dib, 16);
  const colorsUsed = headerSize === 12 ? 0 : u32(dib, 32);
  const paletteEntrySize = headerSize === 12 ? 3 : 4;
  const colorCount =
    colorsUsed || (bitsPerPixel > 0 && bitsPerPixel <= 8 ? 1 << bitsPerPixel : 0);
  let paletteSize = colorCount * paletteEntrySize;
  if (compression === 3 && headerSize >= 40) paletteSize += 12;
  const pixelOffset = 14 + headerSize + paletteSize;
  if (pixelOffset > 14 + dib.length) return null;
  const out = new Uint8Array(14 + dib.length);
  out[0] = 0x42;
  out[1] = 0x4d;
  writeU32(out, 2, out.length);
  writeU32(out, 10, pixelOffset);
  out.set(dib, 14);
  return out;
}

function pngAt(bytes: Uint8Array, start: number | null): Raster | null {
  if (start == null || start < 0) return null;
  if (!match(bytes, start, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return null;
  }
  for (let i = start + 8; i + 8 < bytes.length; i += 1) {
    if (match(bytes, i, [0x49, 0x45, 0x4e, 0x44])) {
      return { mime: "image/png", bytes: bytes.subarray(start, i + 8) };
    }
  }
  return null;
}

function jpegAt(bytes: Uint8Array, start: number | null): Raster | null {
  if (start == null || start < 0) return null;
  if (bytes[start] !== 0xff || bytes[start + 1] !== 0xd8) return null;
  for (let i = start + 2; i + 1 < bytes.length; i += 1) {
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
      return { mime: "image/jpeg", bytes: bytes.subarray(start, i + 2) };
    }
  }
  return null;
}

function gifAt(bytes: Uint8Array, start: number | null): Raster | null {
  if (start == null || start < 0) return null;
  if (!match(bytes, start, [0x47, 0x49, 0x46, 0x38])) return null;
  for (let i = start + 6; i < bytes.length; i += 1) {
    if (bytes[i] === 0x3b) {
      return { mime: "image/gif", bytes: bytes.subarray(start, i + 1) };
    }
  }
  return null;
}

function bmpAt(bytes: Uint8Array, start: number | null): Raster | null {
  if (start == null || start < 0) return null;
  if (bytes[start] !== 0x42 || bytes[start + 1] !== 0x4d) return null;
  if (start + 6 > bytes.length) return null;
  const size = u32(bytes, start + 2);
  if (size < 54 || start + size > bytes.length) return null;
  return { mime: "image/bmp", bytes: bytes.subarray(start, start + size) };
}

function rasterFromSvg(bytes: Uint8Array): Raster | null {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 64));
  if (!text.includes("<svg")) return null;
  const svg = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const matchUrl = /data:image\/(png|jpeg|jpg|gif|bmp|webp);base64,([A-Za-z0-9+/=\s]+)/i.exec(
    svg,
  );
  if (!matchUrl) return null;
  const mime =
    matchUrl[1].toLowerCase() === "jpg" ? "image/jpeg" : `image/${matchUrl[1].toLowerCase()}`;
  try {
    const binary = atob(matchUrl[2].replace(/\s+/g, ""));
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return { mime, bytes: out };
  } catch {
    return null;
  }
}

function indexOfMagic(bytes: Uint8Array, magic: number[]): number | null {
  for (let i = 0; i <= bytes.length - magic.length; i += 1) {
    if (match(bytes, i, magic)) return i;
  }
  return null;
}

function match(bytes: Uint8Array, offset: number, magic: number[]): boolean {
  if (offset + magic.length > bytes.length) return false;
  return magic.every((value, index) => bytes[offset + index] === value);
}

function fingerprint(bytes: Uint8Array): string {
  const tail = bytes[bytes.length - 1] ?? 0;
  return `${bytes.length}:${bytes[0] ?? 0}:${bytes[16] ?? 0}:${tail}`;
}

function dataUrl(bytes: Uint8Array, mime: string): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function u16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
}

function u32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] ?? 0) |
    ((bytes[offset + 1] ?? 0) << 8) |
    ((bytes[offset + 2] ?? 0) << 16) |
    ((bytes[offset + 3] ?? 0) << 24)
  ) >>> 0;
}

function i32(bytes: Uint8Array, offset: number): number {
  return u32(bytes, offset) | 0;
}

function writeU32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}
