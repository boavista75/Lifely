import { IconNotes } from "@/components/icons";
import { useUiStore } from "@/store/useUiStore";

export function NoteLinkButton({
  noteId,
  compact = false,
}: {
  noteId: string;
  compact?: boolean;
}) {
  const openLinkedNote = useUiStore((state) => state.openLinkedNote);
  return (
    <button
      type="button"
      aria-label="Otvori belešku"
      onClick={(event) => {
        event.stopPropagation();
        openLinkedNote(noteId);
      }}
      className={
        compact
          ? "grid size-8 shrink-0 place-items-center text-accent"
          : "grid size-11 shrink-0 place-items-center text-accent"
      }
    >
      <IconNotes className={compact ? "size-3.5" : "size-[18px]"} />
    </button>
  );
}
