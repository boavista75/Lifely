import { Sheet } from "@/components/Sheet";
import { IconFile, IconFolder, IconUpload } from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  filesFromDrop,
  isAbortError,
  MAX_KB_FILE_BYTES,
  pickKbFiles,
  pickKbFolder,
} from "@/lib/kbFiles";
import { useKbStore } from "@/store/useKbStore";
import { useEffect, useRef, useState } from "react";

export function useKbUpload(onImported: (expandIds: string[]) => void) {
  const importFiles = useKbStore((state) => state.importFiles);
  const filesRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4200);
    return () => window.clearTimeout(timer);
  }, [message]);

  function pick(parentId: string | null) {
    parentRef.current = parentId;
    setMessage(null);
    setOpen(true);
  }

  async function ingest(list: File[] | FileList | null) {
    const files = list ? [...list] : [];
    if (filesRef.current) filesRef.current.value = "";
    if (folderRef.current) folderRef.current.value = "";
    if (files.length === 0) return;
    setBusy(true);
    try {
      const result = await importFiles(parentRef.current, files);
      if (result.imported > 0) {
        onImported(result.expandIds);
        setOpen(false);
      }
      if (result.skippedLarge.length > 0) {
        const maxMb = Math.round(MAX_KB_FILE_BYTES / (1024 * 1024));
        const names = result.skippedLarge.slice(0, 3).join(", ");
        const extra =
          result.skippedLarge.length > 3
            ? ` i još ${result.skippedLarge.length - 3}`
            : "";
        setMessage(`Preskočeno (maks. ${maxMb} MB): ${names}${extra}`);
      } else if (result.imported === 0) {
        setMessage("Nema fajlova za otpremanje");
      }
    } catch {
      setMessage("Otpremanje nije uspelo");
    } finally {
      setBusy(false);
      setDragging(false);
    }
  }

  async function chooseFiles() {
    try {
      const picked = await pickKbFiles();
      if (picked) {
        await ingest(picked);
        return;
      }
    } catch (error) {
      if (isAbortError(error)) return;
    }
    filesRef.current?.click();
  }

  async function chooseFolder() {
    try {
      const picked = await pickKbFolder();
      if (picked) {
        await ingest(picked);
        return;
      }
    } catch (error) {
      if (isAbortError(error)) return;
    }
    folderRef.current?.click();
  }

  const dialog = (
    <Sheet open={open} onClose={() => !busy && setOpen(false)} labelledBy="kb-upload-title">
      <div className="px-5 pb-5 pt-2">
        <h2
          id="kb-upload-title"
          className="font-display text-[22px] font-semibold tracking-[-0.02em]"
        >
          Otpremi
        </h2>
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            void filesFromDrop(event.dataTransfer).then((files) => ingest(files));
          }}
          className={cn(
            "mt-3 flex min-h-40 w-full flex-col items-center justify-center rounded-[22px] border border-dashed px-4 py-5 text-center transition-colors duration-150",
            dragging
              ? "border-accent bg-accent/10"
              : "border-hairline bg-surface-2/80",
            busy && "opacity-60",
          )}
        >
          <IconUpload className="size-7 text-accent" />
          <span className="mt-2 text-[15px] font-medium">
            {busy ? "Otpremanje…" : "Prevuci fajlove ili foldere"}
          </span>
          <span className="mt-1 text-[13px] text-ink-secondary">
            ili izaberi sa računara
          </span>
          <div className="mt-4 flex w-full max-w-sm gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void chooseFiles()}
              className="pressable flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-surface px-3 text-[14px] font-medium shadow-sm"
            >
              <IconFile className="size-4 text-ink-secondary" />
              Fajlovi
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void chooseFolder()}
              className="pressable flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-surface px-3 text-[14px] font-medium shadow-sm"
            >
              <IconFolder className="size-4 text-ink-secondary" />
              Folder
            </button>
          </div>
        </div>
        {message ? (
          <p className="mt-2 text-[13px] text-danger">{message}</p>
        ) : null}
        <input
          ref={filesRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => void ingest(event.target.files)}
        />
        <input
          ref={folderRef}
          type="file"
          multiple
          className="hidden"
          {...{ webkitdirectory: "", directory: "" }}
          onChange={(event) => void ingest(event.target.files)}
        />
      </div>
    </Sheet>
  );

  return { pick, busy, message, dialog };
}

export function KbUploadButton({
  compact,
  busy,
  onOpen,
}: {
  compact: boolean;
  busy: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Otpremi"
      disabled={busy}
      onClick={onOpen}
      className={
        compact
          ? "grid size-9 place-items-center rounded-xl text-accent hover:bg-accent/12 disabled:opacity-50"
          : "icon-btn text-accent hover:bg-accent/12 disabled:opacity-50"
      }
    >
      <IconUpload className={compact ? "size-5" : "size-6"} />
    </button>
  );
}
