import { KbPagePicker } from "@/components/KbPagePicker";
import { NotePicker } from "@/components/NotePicker";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Sheet } from "@/components/Sheet";
import { TimePicker } from "@/components/TimePicker";
import { cn } from "@/lib/cn";
import { isValidRange, normalizeTime } from "@/lib/items";
import { useItemsStore } from "@/store/useItemsStore";
import { useUiStore, type ItemSheetState } from "@/store/useUiStore";
import type { LifelyItem, TimeMode } from "@/types";
import { useEffect, useRef, useState } from "react";

const TIME_OPTIONS: { value: TimeMode; label: string }[] = [
  { value: "none", label: "Bez vremena" },
  { value: "start", label: "Samo početak" },
  { value: "range", label: "Od–do" },
];

export function ItemSheet() {
  const itemSheet = useUiStore((state) => state.itemSheet);
  const closeItemSheet = useUiStore((state) => state.closeItemSheet);
  const items = useItemsStore((state) => state.items);
  const existing =
    itemSheet?.mode === "edit"
      ? (items.find((item) => item.id === itemSheet.id) ?? null)
      : null;
  const formKey =
    itemSheet?.mode === "edit"
      ? itemSheet.id
      : itemSheet
        ? `new-${itemSheet.date}`
        : "closed";

  return (
    <Sheet
      open={itemSheet !== null}
      onClose={closeItemSheet}
      labelledBy="item-sheet-title"
      zIndex={60}
    >
      {itemSheet && (
        <ItemForm key={formKey} itemSheet={itemSheet} existing={existing} />
      )}
    </Sheet>
  );
}

function ItemForm({
  itemSheet,
  existing,
}: {
  itemSheet: ItemSheetState;
  existing: LifelyItem | null;
}) {
  const closeItemSheet = useUiStore((state) => state.closeItemSheet);
  const requestDelete = useUiStore((state) => state.requestDelete);
  const addItem = useItemsStore((state) => state.addItem);
  const updateItem = useItemsStore((state) => state.updateItem);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(
    existing?.date ?? (itemSheet.mode === "new" ? itemSheet.date : ""),
  );
  const [timeMode, setTimeMode] = useState<TimeMode>(existing?.timeMode ?? "none");
  const [startTime, setStartTime] = useState(existing?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(existing?.endTime ?? "10:00");
  const [noteId, setNoteId] = useState<string | null>(existing?.noteId ?? null);
  const [kbPageId, setKbPageId] = useState<string | null>(
    existing?.kbPageId ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const isEdit = itemSheet.mode === "edit";

  useEffect(() => {
    const id = window.setTimeout(() => titleRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, []);

  function onTimeModeChange(mode: TimeMode) {
    setTimeMode(mode);
    setError(null);
    if (mode === "range") {
      setEndTime((current) =>
        isValidRange(startTime, current) ? current : "10:00",
      );
    }
  }

  function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Unesite naziv");
      titleRef.current?.focus();
      return;
    }
    const start = timeMode === "none" ? null : normalizeTime(startTime);
    const end = timeMode === "range" ? normalizeTime(endTime) : null;
    if (timeMode === "range" && start && end && !isValidRange(start, end)) {
      setError("Kraj mora biti posle početka");
      return;
    }
    if (saving) return;
    setSaving(true);

    if (itemSheet.mode === "new") {
      addItem({
        title: trimmed,
        date,
        timeMode,
        startTime: start,
        endTime: end,
        noteId,
        kbPageId,
      });
    } else {
      updateItem(itemSheet.id, {
        title: trimmed,
        date,
        timeMode,
        startTime: start,
        endTime: end,
        noteId,
        kbPageId,
      });
    }
    closeItemSheet();
  }

  const heading = isEdit ? "Izmeni stavku" : "Nova stavka";
  const saveLabel = isEdit ? "Sačuvaj" : "Dodaj";

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-1 md:px-5 md:pt-5">
        <button
          type="button"
          onClick={closeItemSheet}
          className="pressable min-h-11 rounded-full px-2 text-[16px] text-ink-secondary"
        >
          Otkaži
        </button>
        <h2 id="item-sheet-title" className="font-display text-[18px] font-semibold tracking-[-0.02em]">
          {heading}
        </h2>
        <button
          type="submit"
          disabled={saving}
          className="pressable min-h-11 rounded-full px-2 text-[16px] font-semibold text-accent disabled:opacity-50"
        >
          {saveLabel}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-5">
        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
            Naziv
          </span>
          <input
            ref={titleRef}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Šta treba uraditi"
            className="field"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
            Datum
          </span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            onClick={(event) => {
              const input = event.currentTarget;
              try {
                input.showPicker();
              } catch {
                // Browser will open the native picker on tap.
              }
            }}
            className="date-picker field tabular"
          />
        </label>

        <div className="mb-4">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
            Vreme
          </span>
          <SegmentedControl
            value={timeMode}
            onChange={onTimeModeChange}
            options={TIME_OPTIONS}
            ariaLabel="Režim vremena"
            size="sm"
          />
        </div>

        {timeMode !== "none" && (
          <div
            className={cn(
              "mb-4 grid gap-3",
              timeMode === "range" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            <TimePicker
              label="Početak"
              value={startTime}
              onChange={(next) => setStartTime(normalizeTime(next))}
            />
            {timeMode === "range" && (
              <TimePicker
                label="Kraj"
                value={endTime}
                onChange={(next) => setEndTime(normalizeTime(next))}
              />
            )}
          </div>
        )}

        <NotePicker value={noteId} onChange={setNoteId} />
        <KbPagePicker value={kbPageId} onChange={setKbPageId} />

        {error && (
          <p className="mb-4 text-[14px] text-danger" role="alert">
            {error}
          </p>
        )}

        {isEdit && existing && (
          <button
            type="button"
            onClick={() => requestDelete(existing.id)}
            className="pressable mt-2 flex min-h-11 w-full items-center justify-center rounded-2xl bg-danger/8 text-[16px] font-medium text-danger"
          >
            Obriši stavku
          </button>
        )}
      </div>
    </form>
  );
}
