import { ItemRow } from "@/components/ItemRow";
import { Sheet } from "@/components/Sheet";
import { IconPlus } from "@/components/icons";
import { fullDateTitle, parseDateKey } from "@/lib/dates";
import { itemsOnDate } from "@/lib/items";
import { useItemsStore } from "@/store/useItemsStore";
import { useUiStore } from "@/store/useUiStore";
import { AnimatePresence } from "motion/react";

export function DaySheet() {
  const open = useUiStore((state) => state.daySheetOpen);
  const closeDay = useUiStore((state) => state.closeDay);
  const selectedDate = useUiStore((state) => state.selectedDate);
  const openNewItem = useUiStore((state) => state.openNewItem);
  const openEditItem = useUiStore((state) => state.openEditItem);
  const items = useItemsStore((state) => state.items);
  const dayItems = itemsOnDate(items, selectedDate);
  const headingId = "day-sheet-title";
  const title = fullDateTitle(parseDateKey(selectedDate));

  return (
    <Sheet open={open} onClose={closeDay} labelledBy={headingId} zIndex={50}>
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-1 md:px-6 md:pt-5">
          <div className="min-w-0">
            <h2
              id={headingId}
              className="font-display truncate text-[26px] font-semibold leading-tight tracking-[-0.03em]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => openNewItem(selectedDate)}
            className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent/12 px-3.5 text-[15px] font-semibold text-accent"
          >
            <IconPlus className="size-4" />
            Dodaj
          </button>
        </header>

        <div className="min-h-[240px] flex-1 overflow-y-auto overscroll-contain px-2 pb-5 md:min-h-[320px] md:px-3">
          {dayItems.length === 0 ? (
            <p className="px-3 py-10 text-center text-[15px] text-ink-secondary">
              Nema stavki za ovaj dan
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {dayItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  showDefer
                  onOpen={() => openEditItem(item.id)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </Sheet>
  );
}
