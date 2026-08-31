import { IconKnowledge } from "@/components/icons";
import { isKbPage } from "@/lib/kb";
import { useKbStore } from "@/store/useKbStore";
import { useUiStore } from "@/store/useUiStore";

export function KbLinkButton({
  pageId,
  compact = false,
}: {
  pageId: string;
  compact?: boolean;
}) {
  const nodes = useKbStore((state) => state.nodes);
  const openLinkedKbPage = useUiStore((state) => state.openLinkedKbPage);
  const page = nodes.find((node) => node.id === pageId && isKbPage(node));

  return (
    <button
      type="button"
      aria-label="Otvori Knowledge stranicu"
      onClick={(event) => {
        event.stopPropagation();
        openLinkedKbPage(pageId, page?.parentId ?? null);
      }}
      className={
        compact
          ? "grid size-8 shrink-0 place-items-center text-accent"
          : "grid size-11 shrink-0 place-items-center text-accent"
      }
    >
      <IconKnowledge className={compact ? "size-3.5" : "size-[18px]"} />
    </button>
  );
}
