import { IconDownload } from "@/components/icons";
import { cn } from "@/lib/cn";
import { downloadKbNode } from "@/lib/kbDownload";
import { reportMediaError } from "@/lib/media";
import { useKbStore } from "@/store/useKbStore";
import { useState, type MouseEvent } from "react";

type Props = {
  nodeId: string;
  compact?: boolean;
  variant?: "icon" | "label";
  beforeDownload?: () => Promise<void> | void;
};

export function KbDownloadButton({
  nodeId,
  compact = false,
  variant = "icon",
  beforeDownload,
}: Props) {
  const nodes = useKbStore((state) => state.nodes);
  const node = nodes.find((entry) => entry.id === nodeId);
  const [busy, setBusy] = useState(false);
  const folder = node?.kind === "folder";
  const label = folder
    ? "Preuzmi folder"
    : node?.kind === "page"
      ? "Preuzmi stranicu"
      : "Preuzmi fajl";

  async function onClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await beforeDownload?.();
      await downloadKbNode(useKbStore.getState().nodes, nodeId);
    } catch {
      reportMediaError("Preuzimanje nije uspelo");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "label") {
    return (
      <button
        type="button"
        aria-label={label}
        aria-busy={busy}
        disabled={busy}
        onClick={(event) => void onClick(event)}
        className="pressable min-h-11 rounded-full px-3 text-[16px] text-ink-secondary disabled:opacity-50"
      >
        {busy ? "Preuzimanje…" : "Preuzmi"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={busy ? "Preuzimanje…" : label}
      aria-busy={busy}
      disabled={busy}
      onClick={(event) => void onClick(event)}
      className={cn(
        "grid place-items-center rounded-md text-ink-tertiary hover:bg-surface-2 hover:text-ink disabled:opacity-50",
        compact ? "size-7" : "size-8",
      )}
    >
      <IconDownload className={compact ? "size-3.5" : "size-4"} />
    </button>
  );
}