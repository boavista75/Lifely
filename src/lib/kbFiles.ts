import { KB_TEXT_SCALE_DEFAULT, uniqueSiblingTitle } from "@/lib/kb";
import { convertDocumentToHtml } from "@/lib/kbFilePreview";
import type { LifelyKbFile, LifelyKbFolder, LifelyKbNode } from "@/types";

export const MAX_KB_FILE_BYTES = 100 * 1024 * 1024;
export const EDITOR_FILE_EXTS = new Set(["md", "txt"]);
export const OFFICE_FILE_EXTS = new Set(["doc", "docx"]);

const SKIP_NAMES = new Set([".ds_store", "thumbs.db", "desktop.ini"]);

export type KbImportPlan = {
  nodes: LifelyKbNode[];
  blobs: { id: string; blob: Blob }[];
  expandIds: string[];
  skippedLarge: string[];
};

export function fileExtension(name: string): string {
  const base = name.split("/").pop() ?? name;
  const index = base.lastIndexOf(".");
  if (index <= 0) return "";
  return base.slice(index + 1).toLowerCase();
}

export function isEditorKbFileName(name: string): boolean {
  return EDITOR_FILE_EXTS.has(fileExtension(name));
}

export function isPdfKbFileName(name: string): boolean {
  return fileExtension(name) === "pdf";
}

export function isOfficeKbFileName(name: string): boolean {
  return OFFICE_FILE_EXTS.has(fileExtension(name));
}

export function relativePathOf(file: File): string {
  const relative = file.webkitRelativePath?.replaceAll("\\", "/").replace(/^\/+/, "");
  if (relative) return relative;
  return file.name.replaceAll("\\", "/");
}

function shouldSkipPath(path: string): boolean {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return true;
  if (parts.some((part) => part === ".." || part === "." || part === "__MACOSX")) {
    return true;
  }
  const name = parts[parts.length - 1] ?? "";
  if (name.startsWith("._")) return true;
  return SKIP_NAMES.has(name.toLowerCase());
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function withRelativePath(file: File, path: string): File {
  const copy = new File([file], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
  Object.defineProperty(copy, "webkitRelativePath", { value: path });
  return copy;
}

export async function filesFromDirectoryHandle(
  dir: FileSystemDirectoryHandle,
  path = dir.name,
): Promise<File[]> {
  const files: File[] = [];
  const iterable = dir as FileSystemDirectoryHandle & {
    values: () => AsyncIterable<FileSystemHandle>;
  };
  for await (const child of iterable.values()) {
    if (child.kind === "file") {
      const file = await (child as FileSystemFileHandle).getFile();
      files.push(withRelativePath(file, `${path}/${file.name}`));
      continue;
    }
    if (child.kind === "directory") {
      files.push(
        ...(await filesFromDirectoryHandle(
          child as FileSystemDirectoryHandle,
          `${path}/${child.name}`,
        )),
      );
    }
  }
  return files;
}

export async function pickKbFiles(): Promise<File[] | null> {
  const picker = (
    window as Window & {
      showOpenFilePicker?: (options: {
        multiple: boolean;
      }) => Promise<FileSystemFileHandle[]>;
    }
  ).showOpenFilePicker;
  if (typeof picker !== "function") return null;
  const handles = await picker({ multiple: true });
  return Promise.all(handles.map((handle) => handle.getFile()));
}

export async function pickKbFolder(): Promise<File[] | null> {
  const picker = (
    window as Window & {
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    }
  ).showDirectoryPicker;
  if (typeof picker !== "function") return null;
  const dir = await picker();
  return filesFromDirectoryHandle(dir);
}

export async function filesFromDrop(data: DataTransfer | null): Promise<File[]> {
  if (!data) return [];
  const items = [...data.items].filter((item) => item.kind === "file");
  const fromEntries: File[] = [];
  for (const item of items) {
    const entry = item.webkitGetAsEntry?.();
    if (!entry) continue;
    fromEntries.push(...(await readEntry(entry, entry.name)));
  }
  if (fromEntries.length > 0) return fromEntries;
  return [...data.files];
}

async function readEntry(
  entry: FileSystemEntry,
  path: string,
): Promise<File[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      (entry as FileSystemFileEntry).file(resolve, reject);
    });
    return [withRelativePath(file, path)];
  }
  if (!entry.isDirectory) return [];
  const children = await readAllEntries(
    (entry as FileSystemDirectoryEntry).createReader(),
  );
  const files: File[] = [];
  for (const child of children) {
    files.push(...(await readEntry(child, `${path}/${child.name}`)));
  }
  return files;
}

function readAllEntries(
  reader: FileSystemDirectoryReader,
): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    function next() {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all);
          return;
        }
        all.push(...batch);
        next();
      }, reject);
    }
    next();
  });
}

export async function planKbImport(
  existing: LifelyKbNode[],
  parentId: string | null,
  files: File[],
): Promise<KbImportPlan> {
  const now = new Date().toISOString();
  const working = [...existing];
  const created: LifelyKbNode[] = [];
  const blobs: { id: string; blob: Blob }[] = [];
  const expandIds = new Set<string>();
  const skippedLarge: string[] = [];
  const folderCache = new Map<string, string>();

  if (parentId) expandIds.add(parentId);

  function folderAt(
    ownerId: string | null,
    title: string,
    cacheKey: string,
  ): string {
    const cached = folderCache.get(cacheKey);
    if (cached) return cached;
    const found = working.find(
      (node) =>
        node.kind === "folder" &&
        node.parentId === ownerId &&
        node.title === title,
    );
    if (found) {
      folderCache.set(cacheKey, found.id);
      expandIds.add(found.id);
      return found.id;
    }
    const folder: LifelyKbFolder = {
      id: crypto.randomUUID(),
      kind: "folder",
      parentId: ownerId,
      title,
      createdAt: now,
      updatedAt: now,
    };
    working.push(folder);
    created.push(folder);
    folderCache.set(cacheKey, folder.id);
    expandIds.add(folder.id);
    return folder.id;
  }

  function parentForPath(path: string): string | null {
    const parts = path.split("/").filter(Boolean);
    const folders = parts.slice(0, -1);
    let current = parentId;
    let key = "";
    for (const folder of folders) {
      key = key ? `${key}/${folder}` : folder;
      current = folderAt(current, folder, key);
    }
    return current;
  }

  for (const file of files) {
    const path = relativePathOf(file);
    if (shouldSkipPath(path)) continue;
    if (file.size > MAX_KB_FILE_BYTES) {
      skippedLarge.push(file.name);
      continue;
    }
    const ownerId = parentForPath(path);
    const name = path.split("/").filter(Boolean).pop() ?? file.name;
    const title = uniqueSiblingTitle(working, ownerId, name);
    if (isEditorKbFileName(name)) {
      const page: LifelyKbFile = {
        id: crypto.randomUUID(),
        kind: "file",
        parentId: ownerId,
        title,
        mediaId: "",
        mimeType: file.type || "text/plain",
        size: file.size,
        content: await convertDocumentToHtml(file, name),
        textScale: KB_TEXT_SCALE_DEFAULT,
        createdAt: now,
        updatedAt: now,
      };
      working.push(page);
      created.push(page);
      continue;
    }
    const mediaId = crypto.randomUUID();
    const node: LifelyKbFile = {
      id: crypto.randomUUID(),
      kind: "file",
      parentId: ownerId,
      title,
      mediaId,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      content: null,
      textScale: KB_TEXT_SCALE_DEFAULT,
      createdAt: now,
      updatedAt: now,
    };
    working.push(node);
    created.push(node);
    blobs.push({ id: mediaId, blob: file });
  }

  return {
    nodes: created,
    blobs,
    expandIds: [...expandIds],
    skippedLarge,
  };
}

export function isPdfKbFile(node: LifelyKbNode): boolean {
  return node.kind === "file" && isPdfKbFileName(node.title);
}

export function isOfficeKbFile(node: LifelyKbNode): boolean {
  return node.kind === "file" && isOfficeKbFileName(node.title);
}
