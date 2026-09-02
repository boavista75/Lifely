import { KbPageLinkControl } from "@/components/KbPageLinkControl";
import { IconChevron, IconPlus } from "@/components/icons";
import { RichEditorToolbar, ToolGroup } from "@/components/RichEditorToolbar";
import { RowDeleteButton } from "@/components/RowDeleteButton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { NOTE_EXTENSIONS } from "@/lib/editor";
import { noteCreatedTitle } from "@/lib/dates";
import { isKbFile, isKbPage, pageIdFromHref } from "@/lib/kb";
import { tabTransition } from "@/lib/motion";
import { displayNoteTitle, isBlankHtml, isDefaultNoteTitle, notePreview } from "@/lib/notes";
import { useItemsStore } from "@/store/useItemsStore";
import { useKbStore } from "@/store/useKbStore";
import { useNotesStore } from "@/store/useNotesStore";
import { useUiStore } from "@/store/useUiStore";
import { EditorContent, useEditor } from "@tiptap/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

export function NotesScreen() {
  const notes = useNotesStore((state) => state.notes);
  const addNote = useNotesStore((state) => state.addNote);
  const updateNote = useNotesStore((state) => state.updateNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const activeNoteId = useUiStore((state) => state.activeNoteId);
  const openNote = useUiStore((state) => state.openNote);
  const closeNote = useUiStore((state) => state.closeNote);
  const requestDeleteNote = useUiStore((state) => state.requestDeleteNote);
  const active = notes.find((note) => note.id === activeNoteId) ?? null;

  function createNote() {
    const note = addNote();
    openNote(note.id);
  }

  function backToList() {
    if (!active) {
      closeNote();
      return;
    }
    const untitled =
      !active.title.trim() ||
      isDefaultNoteTitle(active.title, active.createdAt);
    if (isBlankHtml(active.content) && untitled) {
      deleteNote(active.id);
    } else if (!active.title.trim()) {
      updateNote(active.id, {
        title: noteCreatedTitle(new Date(active.createdAt)),
      });
    }
    closeNote();
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {active ? (
        <motion.div
          key={active.id}
          className="h-full min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={tabTransition}
        >
          <NoteEditor noteId={active.id} onBack={backToList} />
        </motion.div>
      ) : (
        <motion.div
          key="list"
          className="flex h-full min-h-0 flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={tabTransition}
        >
          <ScreenHeader
            title="Notes"
            actions={
              <button
                type="button"
                onClick={createNote}
                aria-label="Kreiraj novi notes"
                className="icon-btn text-accent hover:bg-accent/12"
              >
                <IconPlus className="size-6" />
              </button>
            }
          />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-8 pt-4 md:px-6">
            {notes.length === 0 ? (
              <p className="px-3 py-20 text-center text-[15px] text-ink-secondary">
                Nema beleški. Dodaj prvu dugmetom +
              </p>
            ) : (
              <div className="card overflow-hidden rounded-[22px]">
                {notes.map((note) => {
                  const preview = notePreview(note.content);
                  return (
                    <div
                      key={note.id}
                      className="flex min-h-14 items-center shadow-[0_0.5px_0_0_var(--hairline)] last:shadow-none"
                    >
                      <button
                        type="button"
                        onClick={() => openNote(note.id)}
                        className="min-w-0 flex-1 px-4 py-3 text-left"
                      >
                        <span className="block truncate text-[16px] font-medium">
                          {displayNoteTitle(note.title, note.createdAt)}
                        </span>
                        {preview ? (
                          <span className="mt-0.5 block truncate text-[13px] text-ink-secondary">
                            {preview}
                          </span>
                        ) : null}
                      </button>
                      <RowDeleteButton
                        label="Obriši belešku"
                        onClick={() => requestDeleteNote(note.id)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NoteEditor({
  noteId,
  onBack,
}: {
  noteId: string;
  onBack: () => void;
}) {
  const note = useNotesStore((state) =>
    state.notes.find((entry) => entry.id === noteId),
  );
  const updateNote = useNotesStore((state) => state.updateNote);
  const requestDeleteNote = useUiStore((state) => state.requestDeleteNote);
  const saveTimer = useRef<number | null>(null);
  const updateNoteRef = useRef(updateNote);
  updateNoteRef.current = updateNote;
  const openLinkedKbPage = useUiStore((state) => state.openLinkedKbPage);
  const openLinkedRef = useRef(openLinkedKbPage);
  openLinkedRef.current = openLinkedKbPage;
  const initialContent = useRef(note?.content || "<p></p>");
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      extensions: NOTE_EXTENSIONS,
      content: initialContent.current,
      editorProps: {
        attributes: {
          class: "note-body outline-none min-h-full",
        },
      },
      onUpdate: ({ editor: instance }) => {
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => {
          updateNoteRef.current(noteId, { content: instance.getHTML() });
        }, 280);
      },
    },
    [noteId],
  );
  editorRef.current = editor;

  useEffect(() => {
    const dom = editor?.view.dom;
    if (!dom) return;
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      const id = pageIdFromHref(anchor?.getAttribute("href"));
      if (!id) return;
      event.preventDefault();
      event.stopPropagation();
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      const instance = editorRef.current;
      if (instance && !instance.isDestroyed) {
        updateNoteRef.current(noteId, { content: instance.getHTML() });
      }
      const next = useKbStore
        .getState()
        .nodes.find(
          (node) => node.id === id && (isKbPage(node) || isKbFile(node)),
        );
      if (next) openLinkedRef.current(next.id, next.parentId);
    }
    dom.addEventListener("click", onClick);
    return () => dom.removeEventListener("click", onClick);
  }, [editor, noteId]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      if (editor && !editor.isDestroyed) {
        updateNote(noteId, { content: editor.getHTML() });
      }
    };
  }, [editor, noteId, updateNote]);

  if (!note) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-2 px-2 pt-2 md:px-4 md:pt-5">
        <button
          type="button"
          onClick={onBack}
          className="pressable inline-flex min-h-11 items-center gap-0.5 rounded-full px-2 text-[16px] text-accent"
        >
          <IconChevron className="size-5" />
          Beleške
        </button>
        <button
          type="button"
          onClick={() => requestDeleteNote(note.id)}
          className="pressable min-h-11 rounded-full px-3 text-[16px] text-danger"
        >
          Obriši
        </button>
      </header>
      <input
        value={note.title}
        onChange={(event) => updateNote(note.id, { title: event.target.value })}
        onBlur={() => {
          if (!note.title.trim()) {
            updateNote(note.id, {
              title: noteCreatedTitle(new Date(note.createdAt)),
            });
          }
        }}
        placeholder="Naslov"
        className="w-full shrink-0 bg-transparent px-5 py-2 font-display text-[32px] font-semibold leading-tight tracking-[-0.03em] outline-none placeholder:text-ink-tertiary md:px-8"
      />
      {editor && (
        <RichEditorToolbar
          editor={editor}
          extra={
            <ToolGroup label="Linkovi">
              <KbPageLinkControl editor={editor} />
            </ToolGroup>
          }
        />
      )}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4 md:px-8">
        <EditorContent editor={editor} className="h-full min-h-[50%]" />
        <LinkedItems noteId={note.id} />
      </div>
    </div>
  );
}

function LinkedItems({ noteId }: { noteId: string }) {
  const items = useItemsStore((state) => state.items);
  const linked = items.filter((item) => item.noteId === noteId);
  const openEditItem = useUiStore((state) => state.openEditItem);
  if (linked.length === 0) return null;

  return (
    <section className="mt-8 pb-8">
      <h2 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
        Povezane stavke
      </h2>
      <div className="card overflow-hidden rounded-[22px]">
        {linked.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openEditItem(item.id)}
            className="flex min-h-12 w-full items-center px-4 text-left text-[15px] shadow-[0_0.5px_0_0_var(--hairline)] last:shadow-none"
          >
            {item.title}
          </button>
        ))}
      </div>
    </section>
  );
}
