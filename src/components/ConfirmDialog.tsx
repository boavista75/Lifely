import { dialogTransition } from "@/lib/motion";
import { displayKbTitle } from "@/lib/kb";
import { displayNoteTitle } from "@/lib/notes";
import { useItemsStore } from "@/store/useItemsStore";
import { useKbStore } from "@/store/useKbStore";
import { useNotesStore } from "@/store/useNotesStore";
import { useUiStore } from "@/store/useUiStore";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

export function ConfirmDialog() {
  const confirmDelete = useUiStore((state) => state.confirmDelete);
  const closeConfirm = useUiStore((state) => state.closeConfirm);
  const closeItemSheet = useUiStore((state) => state.closeItemSheet);
  const closeNote = useUiStore((state) => state.closeNote);
  const closeKbPage = useUiStore((state) => state.closeKbPage);
  const openKbFolder = useUiStore((state) => state.openKbFolder);
  const kbFolderId = useUiStore((state) => state.kbFolderId);
  const kbPageId = useUiStore((state) => state.kbPageId);
  const items = useItemsStore((state) => state.items);
  const notes = useNotesStore((state) => state.notes);
  const kbNodes = useKbStore((state) => state.nodes);
  const deleteItem = useItemsStore((state) => state.deleteItem);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const deleteNode = useKbStore((state) => state.deleteNode);
  const reduce = useReducedMotion();

  const item =
    confirmDelete?.kind === "item"
      ? items.find((entry) => entry.id === confirmDelete.id)
      : undefined;
  const note =
    confirmDelete?.kind === "note"
      ? notes.find((entry) => entry.id === confirmDelete.id)
      : undefined;
  const kbNode =
    confirmDelete?.kind === "kb-page" || confirmDelete?.kind === "kb-folder"
      ? kbNodes.find((entry) => entry.id === confirmDelete.id)
      : undefined;
  const open = Boolean(
    (confirmDelete?.kind === "item" && item) ||
      (confirmDelete?.kind === "note" && note) ||
      ((confirmDelete?.kind === "kb-page" ||
        confirmDelete?.kind === "kb-folder") &&
        kbNode),
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeConfirm]);

  function confirm() {
    if (!confirmDelete) return;
    if (confirmDelete.kind === "item") {
      deleteItem(confirmDelete.id);
      closeItemSheet();
    } else if (confirmDelete.kind === "note") {
      deleteNote(confirmDelete.id);
      closeNote();
    } else {
      const parentId = kbNode?.parentId ?? null;
      const removed = deleteNode(confirmDelete.id);
      if (kbPageId && removed.includes(kbPageId)) closeKbPage();
      if (kbFolderId && removed.includes(kbFolderId)) openKbFolder(parentId);
    }
    closeConfirm();
  }

  const title =
    confirmDelete?.kind === "note"
      ? "Obrisati belešku?"
      : confirmDelete?.kind === "kb-page"
        ? "Obrisati stranicu?"
        : confirmDelete?.kind === "kb-folder"
          ? "Obrisati folder?"
          : "Obrisati stavku?";
  const name =
    confirmDelete?.kind === "note"
      ? displayNoteTitle(note?.title ?? "", note?.createdAt)
      : confirmDelete?.kind === "kb-page" || confirmDelete?.kind === "kb-folder"
        ? displayKbTitle(kbNode?.title ?? "", kbNode?.createdAt)
        : (item?.title ?? "");
  const body =
    confirmDelete?.kind === "kb-folder"
      ? `„${name}“ i sav sadržaj unutra će biti uklonjeni.`
      : `„${name}“ će biti uklonjena.`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center px-6">
          <motion.button
            type="button"
            aria-label="Zatvori"
            className="absolute inset-0 bg-[var(--backdrop)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0.01 } : dialogTransition}
            onClick={closeConfirm}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            className="relative w-full max-w-[300px] overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow-float)]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={reduce ? { duration: 0.01 } : dialogTransition}
          >
            <div className="px-5 pb-4 pt-6 text-center">
              <h2
                id="confirm-delete-title"
                className="font-display text-[22px] font-semibold tracking-[-0.02em]"
              >
                {title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-5 text-ink-secondary">
                {body}
              </p>
            </div>
            <div className="grid grid-cols-2 hairline-t">
              <button
                type="button"
                onClick={closeConfirm}
                className="min-h-12 text-[16px] text-ink-secondary transition-colors duration-150 hover:bg-ink/[0.04]"
              >
                Otkaži
              </button>
              <button
                type="button"
                onClick={confirm}
                className="min-h-12 text-[16px] font-semibold text-danger shadow-[-0.5px_0_0_0_var(--hairline)] transition-colors duration-150 hover:bg-danger/[0.06]"
              >
                Obriši
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
