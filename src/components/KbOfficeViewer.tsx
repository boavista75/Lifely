import { IconChevron } from "@/components/icons";
import { KbDownloadButton } from "@/components/KbDownloadButton";
import { KB_FILE_UNOPENABLE } from "@/lib/kbFilePreview";
import { renderOfficeDocument } from "@/lib/kbOffice";
import { loadMedia } from "@/lib/media";
import { useKbStore } from "@/store/useKbStore";
import { useUiStore } from "@/store/useUiStore";
import type { LifelyKbFile } from "@/types";
import { useEffect, useRef, useState } from "react";

export function KbOfficeViewer({ fileId }: { fileId: string }) {
  const nodes = useKbStore((state) => state.nodes);
  const file = nodes.find(
    (node): node is LifelyKbFile => node.id === fileId && node.kind === "file",
  );
  const updateNode = useKbStore((state) => state.updateNode);
  const closeKbPage = useUiStore((state) => state.closeKbPage);
  const requestDeleteKb = useUiStore((state) => state.requestDeleteKb);
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const host = hostRef.current;
    if (!file?.mediaId || !host) return;
    const container = host;
    const mediaId = file.mediaId;
    const title = file.title;
    let cancelled = false;
    container.replaceChildren();
    setLoading(true);
    setError(false);

    async function load() {
      const blob = await loadMedia(mediaId);
      if (cancelled) return;
      if (!blob) {
        setError(true);
        setLoading(false);
        return;
      }
      await renderOfficeDocument(blob, title, container);
      if (!cancelled) setLoading(false);
    }

    void load().catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      container.replaceChildren();
    };
  }, [file?.id, file?.mediaId, file?.title, fileId]);

  if (!file) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 px-2 pt-2 md:px-4 md:pt-5">
        <button
          type="button"
          onClick={closeKbPage}
          className="pressable inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-[16px] text-accent"
        >
          <IconChevron className="size-5" />
          Knowledge
        </button>
        <div className="flex shrink-0 items-center">
          <KbDownloadButton nodeId={file.id} variant="label" />
          <button
            type="button"
            onClick={() => requestDeleteKb("kb-file", file.id)}
            className="pressable min-h-11 rounded-full px-3 text-[16px] text-danger"
          >
            Obriši
          </button>
        </div>
      </header>
      <input
        value={file.title}
        onChange={(event) => updateNode(file.id, { title: event.target.value })}
        className="w-full shrink-0 bg-transparent px-5 py-2 font-display text-[32px] font-semibold leading-tight tracking-[-0.03em] outline-none md:px-8"
      />
      <div className="relative min-h-0 flex-1 overflow-hidden px-3 pb-4 md:px-6">
        {loading ? (
          <p className="absolute inset-0 z-10 grid place-items-center text-[15px] text-ink-secondary">
            Učitavanje…
          </p>
        ) : null}
        {error ? (
          <p className="pt-16 text-center text-[16px] text-ink-secondary">
            {KB_FILE_UNOPENABLE}
          </p>
        ) : null}
        <div
          ref={hostRef}
          className="kb-office-surface absolute inset-x-3 inset-y-0 overflow-auto md:inset-x-6"
        />
      </div>
    </div>
  );
}
