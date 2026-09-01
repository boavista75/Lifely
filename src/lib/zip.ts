const CRC_TABLE = new Uint32Array(256);

for (let index = 0; index < 256; index += 1) {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  CRC_TABLE[index] = crc >>> 0;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc = CRC_TABLE[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, Math.min(2107, date.getFullYear()));
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function writeU16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true);
}

function writeU32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true);
}

export type ZipStoreEntry = {
  path: string;
  data: Uint8Array;
};

function normalizeZipPath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/{2,}/g, "/");
}

export function buildZipStore(entries: ZipStoreEntry[], date = new Date()): Blob {
  const encoder = new TextEncoder();
  const prepared = entries.map((entry) => {
    const path = normalizeZipPath(entry.path);
    const dir = path.endsWith("/");
    const data = dir ? new Uint8Array(0) : entry.data;
    return { path, name: encoder.encode(path), data, dir };
  });
  const { time, date: dosDate } = dosDateTime(date);
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of prepared) {
    const crc = crc32(entry.data);
    const size = entry.data.byteLength;
    const local = new Uint8Array(30 + entry.name.byteLength);
    const localView = new DataView(local.buffer);
    writeU32(localView, 0, 0x04034b50);
    writeU16(localView, 4, 20);
    writeU16(localView, 6, 0x0800);
    writeU16(localView, 8, 0);
    writeU16(localView, 10, time);
    writeU16(localView, 12, dosDate);
    writeU32(localView, 14, crc);
    writeU32(localView, 18, size);
    writeU32(localView, 22, size);
    writeU16(localView, 26, entry.name.byteLength);
    writeU16(localView, 28, 0);
    local.set(entry.name, 30);
    locals.push(local, entry.data);

    const central = new Uint8Array(46 + entry.name.byteLength);
    const centralView = new DataView(central.buffer);
    writeU32(centralView, 0, 0x02014b50);
    writeU16(centralView, 4, 20);
    writeU16(centralView, 6, 20);
    writeU16(centralView, 8, 0x0800);
    writeU16(centralView, 10, 0);
    writeU16(centralView, 12, time);
    writeU16(centralView, 14, dosDate);
    writeU32(centralView, 16, crc);
    writeU32(centralView, 20, size);
    writeU32(centralView, 24, size);
    writeU16(centralView, 28, entry.name.byteLength);
    writeU16(centralView, 30, 0);
    writeU16(centralView, 32, 0);
    writeU16(centralView, 34, 0);
    writeU16(centralView, 36, 0);
    writeU32(centralView, 38, entry.dir ? 0x10 : 0);
    writeU32(centralView, 42, offset);
    central.set(entry.name, 46);
    centrals.push(central);
    offset += local.byteLength + entry.data.byteLength;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.byteLength, 0);
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  writeU32(eocdView, 0, 0x06054b50);
  writeU16(eocdView, 4, 0);
  writeU16(eocdView, 6, 0);
  writeU16(eocdView, 8, prepared.length);
  writeU16(eocdView, 10, prepared.length);
  writeU32(eocdView, 12, centralSize);
  writeU32(eocdView, 16, offset);
  writeU16(eocdView, 20, 0);

  const parts = [...locals, ...centrals, eocd];
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const bytes = new Uint8Array(total);
  let cursor = 0;
  for (const part of parts) {
    bytes.set(part, cursor);
    cursor += part.byteLength;
  }
  return new Blob([bytes.buffer], { type: "application/zip" });
}