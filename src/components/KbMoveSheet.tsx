import { Sheet } from "@/components/Sheet";
import { IconCheck, IconFolder, IconKnowledge } from "@/components/icons";
import { cn } from "@/lib/cn";
import {
  canMoveKbNode,
  displayKbTitle,
  kbMoveFolderOptions,
} from "@/lib/kb";
import { useKbStore } from "@/store/useKbStore";

type Props = {
  nodeId: string | null;
  onClose: () => void;
  onMove: (parentId: string | null) => void;
};

export function KbMoveSheet({ nodeId, onClose, onMove }: Props) {
  const nodes = useKbStore((state) => state.nodes);
  const node = nodes.find((entry) => entry.id === nodeId) ?? null;
  const options = node ? kbMoveFolderOptions(nodes, node.id) : [];
  const atRoot = node?.parentId === null;
  const canRoot = node ? canMoveKbNode(nodes, node.id, null) : false;
  const kindLabel =
    node?.kind === "folder"
      ? "folder"
      : node?.kind === "file"
        ? "fajl"
        : "stranica";

  return (
    <Sheet open={Boolean(node)} onClose={onClose} labelledBy="kb-move-title">
      <div className="flex min-h-0 flex-col px-5 pb-5 pt-2">
        <h2
          id="kb-move-title"
          className="font-display text-[22px] font-semibold tracking-[-0.02em]"
        >
          Premesti
        </h2>
        {node ? (
          <p className="mt-1 truncate text-[13px] text-ink-secondary">
            {displayKbTitle(node.title, node.createdAt)} · {kindLabel}
          </p>
        ) : null}
        <div className="mt-3 max-h-[min(52dvh,420px)] overflow-y-auto overscroll-contain rounded-2xl bg-surface-2/80 py-1">
          <button
            type="button"
            disabled={!canRoot}
            aria-current={atRoot ? "true" : undefined}
            onClick={() => onMove(null)}
            className={cn(
              "flex min-h-11 w-full items-center gap-2 px-3.5 text-left text-[15px]",
              atRoot && "text-ink-tertiary",
              !atRoot && "hover:bg-ink/[0.055]",
            )}
          >
            <IconKnowledge className="size-[18px] shrink-0 text-ink-secondary" />
            <span className="min-w-0 flex-1 truncate">Na početak</span>
            {atRoot ? <IconCheck className="size-4 shrink-0 text-accent" /> : null}
          </button>
          {options.map((folder) => (
            <button
              key={folder.id}
              type="button"
              disabled={folder.current}
              aria-current={folder.current ? "true" : undefined}
              onClick={() => onMove(folder.id)}
              style={{ paddingLeft: 14 + folder.depth * 16 }}
              className={cn(
                "flex min-h-11 w-full items-center gap-2 pr-3.5 text-left text-[15px]",
                folder.current && "text-ink-tertiary",
                !folder.current && "hover:bg-ink/[0.055]",
              )}
            >
              <IconFolder className="size-[18px] shrink-0 text-ink-secondary" />
              <span className="min-w-0 flex-1 truncate">{folder.title}</span>
              {folder.current ? (
                <IconCheck className="size-4 shrink-0 text-accent" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
