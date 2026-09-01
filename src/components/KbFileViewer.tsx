import { IconChevron } from "@/components/icons";
import { KbDownloadButton } from "@/components/KbDownloadButton";
import { KB_FILE_UNOPENABLE } from "@/lib/kbFilePreview";
import { useKbStore } from "@/store/useKbStore";
import { useUiStore } from "@/store/useUiStore";
import type { LifelyKbFile } from "@/types";

export function KbFileViewer({ fileId }: { fileId: string }) {
  const nodes = useKbStore((state) => state.nodes);
  const file = nodes.find(
    (node): node is LifelyKbFile => node.id === fileId && node.kind === "file",
  );
  const closeKbPage = useUiStore((state) => state.closeKbPage);
  const requestDeleteKb = useUiStore((state) => state.requestDeleteKb);

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
      <h1 className="w-full shrink-0 truncate bg-transparent px-5 py-2 font-display text-[32px] font-semibold leading-tight tracking-[-0.03em] md:px-8">
        {file.title}
      </h1>
      <p className="px-5 pt-16 text-center text-[16px] text-ink-secondary md:px-8">
        {KB_FILE_UNOPENABLE}
      </p>
    </div>
  );
}
