import { KbLinkButton } from "@/components/KbLinkButton";
import { NoteLinkButton } from "@/components/NoteLinkButton";
import { useCalendarDrag } from "@/hooks/useCalendarItemDrag";
import { cn } from "@/lib/cn";
import { dayIsToday, toDateKey } from "@/lib/dates";
import { formatItemTime } from "@/lib/items";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import type { LifelyItem } from "@/types";
import type { PointerEvent as ReactPointerEvent } from "react";

type Props = {
  days: Date[];
  cursor: Date;
  selectedDate: string;
  itemsByDate: Map<string, LifelyItem[]>;
  onSelect: (date: Date) => void;
};

export function MonthGrid({
  days,
  cursor,
  selectedDate,
  itemsByDate,
  onSelect,
}: Props) {
  const isDesktop = useIsDesktop();
  const { draggingId, overDate, onItemPointerDown, consumeDragClick } =
    useCalendarDrag();

  return (
    <div className="grid h-full grid-cols-7 grid-rows-6 gap-1 p-1 select-none md:gap-1.5 md:p-1.5">
      {days.map((day) => {
        const key = toDateKey(day);
        const inMonth =
          day.getMonth() === cursor.getMonth() &&
          day.getFullYear() === cursor.getFullYear();
        const today = dayIsToday(day);
        const selected = key === selectedDate;
        const dayItems = itemsByDate.get(key) ?? [];

        return (
          <div
            key={key}
            data-calendar-day={key}
            className={cn(
              "relative flex min-h-0 min-w-0 flex-col items-stretch overflow-hidden rounded-2xl px-1 py-1 text-left transition-colors duration-150 md:px-1.5 md:py-1.5",
              "hover:bg-surface",
              selected && !today && overDate !== key && "bg-surface",
              today && overDate !== key && "bg-accent/10",
              dropTarget(key, overDate),
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(day)}
              aria-current={today ? "date" : undefined}
              aria-label={
                dayItems.length === 0 ? `Dodaj stavku za ${key}` : key
              }
              className="absolute inset-0 z-0"
            />
            <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col items-stretch">
              <span className="pointer-events-none flex shrink-0 items-center justify-center md:justify-between">
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full text-[13px] font-semibold tabular md:size-7 md:text-[14px]",
                    !inMonth && "text-ink-tertiary",
                    inMonth && !today && !selected && "text-ink",
                    selected && !today && "bg-ink/8 text-ink",
                    today && "bg-accent text-accent-fg",
                  )}
                >
                  {day.getDate()}
                </span>
                {isDesktop && dayItems.length > 3 ? (
                  <span className="pr-0.5 text-[10px] font-semibold tabular leading-none text-ink-tertiary">
                    +{dayItems.length - 3}
                  </span>
                ) : null}
              </span>
              <DayChips
                items={dayItems}
                compact={!isDesktop}
                draggingId={draggingId}
                onPointerDown={onItemPointerDown}
                onClick={() => {
                  if (consumeDragClick()) return;
                  onSelect(day);
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayChips({
  items,
  compact,
  draggingId,
  onPointerDown,
  onClick,
}: {
  items: LifelyItem[];
  compact: boolean;
  draggingId: string | null;
  onPointerDown: (
    item: LifelyItem,
    event: ReactPointerEvent,
    options?: { immediate?: boolean },
  ) => void;
  onClick: () => void;
}) {
  if (items.length === 0) return null;
  const visible = items.slice(0, compact ? 2 : 3);

  return (
    <div className="pointer-events-auto mt-1 flex min-h-0 flex-1 flex-col justify-start gap-0.5 overflow-hidden md:gap-1">
      {visible.map((item) => {
        const time = formatItemTime(item);
        return (
          <button
            key={item.id}
            type="button"
            aria-label={`Prevuci „${item.title}“ na drugi dan`}
            onPointerDown={(event) =>
              onPointerDown(item, event, { immediate: true })
            }
            onClick={(event) => {
              event.stopPropagation();
              onClick();
            }}
            className={cn(
              "grid min-h-0 w-full cursor-grab place-items-center overflow-hidden rounded-md px-1 touch-none md:max-h-5 md:flex-1 md:basis-0",
              compact ? "h-4 max-h-4" : "max-h-5 flex-1 basis-0",
              item.completed
                ? "bg-ink/6 text-ink-tertiary line-through"
                : "bg-accent/12 text-accent",
              draggingId === item.id && "opacity-35",
            )}
          >
            <span className="block w-full truncate text-center text-[10px] leading-none">
              {time ? <span className="tabular">{time} </span> : null}
              {item.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type WeekProps = {
  days: Date[];
  selectedDate: string;
  itemsByDate: Map<string, LifelyItem[]>;
  onSelectDay: (date: Date) => void;
  onOpenItem: (id: string) => void;
};

export function WeekGrid({
  days,
  selectedDate,
  itemsByDate,
  onSelectDay,
  onOpenItem,
}: WeekProps) {
  const { draggingId, overDate, onItemPointerDown, consumeDragClick } =
    useCalendarDrag();

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain px-3 pb-4 md:grid md:grid-cols-7 md:gap-1.5 md:overflow-hidden md:px-1.5 md:pb-1.5">
      {days.map((day) => {
        const key = toDateKey(day);
        const today = dayIsToday(day);
        const selected = key === selectedDate;
        const dayItems = itemsByDate.get(key) ?? [];

        return (
          <section
            key={key}
            data-calendar-day={key}
            className={cn(
              "shrink-0 rounded-[20px] bg-surface/70 transition-colors duration-150 md:flex md:min-h-0 md:min-w-0 md:flex-col md:overflow-hidden md:bg-surface/50",
              dropTarget(key, overDate),
            )}
          >
            <button
              type="button"
              onClick={() => onSelectDay(day)}
              aria-current={today ? "date" : undefined}
              aria-label={key}
              className="flex min-h-11 w-full shrink-0 items-center gap-3 px-2 py-2 md:flex-col md:gap-1 md:px-1 md:pt-3"
            >
              <span className="w-8 text-[12px] font-medium uppercase tracking-wide text-ink-secondary md:w-auto">
                {weekdayLetter(day)}
              </span>
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-[15px] font-semibold tabular",
                  selected && !today && "bg-ink/8 text-ink",
                  today && "bg-accent text-accent-fg",
                  !selected && !today && "text-ink",
                )}
              >
                {day.getDate()}
              </span>
            </button>
            <div className="space-y-1.5 px-2 pb-2.5 md:min-h-0 md:flex-1 md:space-y-1 md:overflow-y-auto md:overscroll-contain md:px-1.5 md:pb-2">
              {dayItems.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onSelectDay(day)}
                  className="hidden min-h-8 w-full md:block"
                  aria-label={`Dodaj stavku za ${key}`}
                />
              ) : (
                dayItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-0.5",
                      draggingId === item.id && "opacity-35",
                    )}
                  >
                    <button
                      type="button"
                      aria-label={`Prevuci „${item.title}“ na drugi dan`}
                      onPointerDown={(event) => onItemPointerDown(item, event)}
                      onClick={() => {
                        if (consumeDragClick()) return;
                        onOpenItem(item.id);
                      }}
                      className={cn(
                        "min-w-0 flex-1 cursor-grab rounded-xl px-2.5 py-2 text-left transition-colors duration-150 md:px-1.5 md:py-1.5",
                        item.completed
                          ? "text-ink-tertiary line-through"
                          : "bg-accent/12 text-accent",
                      )}
                    >
                      {formatItemTime(item) && (
                        <span className="block text-[11px] tabular opacity-80">
                          {formatItemTime(item)}
                        </span>
                      )}
                      <span className="block text-[14px] font-medium leading-5 text-ink wrap-break-word md:truncate md:text-[12px] md:leading-4">
                        {item.title}
                      </span>
                    </button>
                    {item.noteId && (
                      <span data-no-calendar-drag>
                        <NoteLinkButton noteId={item.noteId} compact />
                      </span>
                    )}
                    {item.kbPageId && (
                      <span data-no-calendar-drag>
                        <KbLinkButton pageId={item.kbPageId} compact />
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function weekdayLetter(day: Date): string {
  const letters = ["N", "P", "U", "S", "Č", "P", "S"];
  return letters[day.getDay()] ?? "";
}

function dropTarget(dateKey: string, overDate: string | null): string | undefined {
  if (!overDate || overDate !== dateKey) return undefined;
  return "bg-accent/16 ring-2 ring-accent/45 ring-inset";
}
