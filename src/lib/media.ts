export const MEDIA_ERROR_EVENT = "lifely-media-error";

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

const DB_NAME = "lifely-media";
const STORE = "blobs";
const VERSION = 1;

export type MediaAlign = "left" | "center" | "right";
export type MediaKind = "image" | "video";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function reportMediaError(message: string): void {
  window.dispatchEvent(new CustomEvent(MEDIA_ERROR_EVENT, { detail: message }));
}

export function mediaKind(file: File): MediaKind | null {
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
    return "image";
  }
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export async function saveMedia(blob: Blob): Promise<string> {
  const id = crypto.randomUUID();
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(blob, id);
  });
  return id;
}

export async function loadMedia(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export function filesFromTransfer(
  data: DataTransfer | null | undefined,
): File[] {
  if (!data) return [];
  const fromFiles = [...data.files];
  if (fromFiles.length > 0) return fromFiles;
  const fromItems: File[] = [];
  for (const item of data.items) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file) fromItems.push(file);
  }
  return fromItems;
}

export async function cropImageBlob(
  source: Blob,
  crop: { x: number; y: number; w: number; h: number },
  natural: { width: number; height: number },
  displayed: { width: number; height: number },
): Promise<Blob> {
  const image = await blobToImage(source);
  const scaleX = natural.width / displayed.width;
  const scaleY = natural.height / displayed.height;
  const sx = Math.max(0, crop.x * scaleX);
  const sy = Math.max(0, crop.y * scaleY);
  const sw = Math.min(natural.width - sx, crop.w * scaleX);
  const sh = Math.min(natural.height - sy, crop.h * scaleY);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nije dostupan");
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const type = source.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, type === "image/jpeg" ? 0.92 : undefined);
  });
  if (!blob) throw new Error("Kropljenje nije uspelo");
  return blob;
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Slika se nije učitala"));
    };
    image.src = url;
  });
}
