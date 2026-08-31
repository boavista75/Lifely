import { KbLinkButton } from "@/components/KbLinkButton";
import { NoteLinkButton } from "@/components/NoteLinkButton";
import { cn } from "@/lib/cn";
import { dayIsToday, toDateKey } from "@/lib/dates";
import { formatItemTime } from "@/lib/items";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useUiStore } from "@/store/useUiStore";
import type { LifelyItem } from "@/types";

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
          <button
            key={key}
            type="button"
            onClick={() => onSelect(day)}
            aria-current={today ? "date" : undefined}
            aria-label={key}
            className={cn(
              "relative flex min-h-0 flex-col items-stretch overflow-hidden rounded-2xl px-1 py-1 text-left transition-colors duration-150 md:px-1.5 md:py-1.5",
              "hover:bg-surface",
              selected && !today && "bg-surface",
              today && "bg-accent/10",
            )}
          >
            <span className="flex justify-center md:justify-start">
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-[13px] font-semibold tabular md:size-8 md:text-[15px]",
                  !inMonth && "text-ink-tertiary",
                  inMonth && !today && !selected && "text-ink",
                  selected && !today && "bg-ink/8 text-ink",
                  today && "bg-accent text-accent-fg",
                )}
              >
                {day.getDate()}
              </span>
            </span>
            {isDesktop ? (
              <DesktopChips items={dayItems} />
            ) : (
              <MobileDots items={dayItems} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function DesktopChips({ items }: { items: LifelyItem[] }) {
  if (items.length === 0) return null;
  const visible = items.slice(0, 3);
  const extra = items.length - visible.length;

  return (
    <div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
      {visible.map((item) => {
        const time = formatItemTime(item);
        return (
          <span
            key={item.id}
            className={cn(
              "truncate rounded-lg px-1.5 py-[3px] text-[11px] leading-4",
              item.completed
                ? "text-ink-tertiary line-through"
                : "bg-accent/12 text-accent",
            )}
          >
            {time ? <span className="tabular">{time} </span> : null}
            {item.title}
          </span>
        );
      })}
      {extra > 0 && (
        <span className="px-1.5 text-[10px] text-ink-tertiary">+{extra}</span>
      )}
    </div>
  );
}

function MobileDots({ items }: { items: LifelyItem[] }) {
  if (items.length === 0) return null;
  const visible = items.slice(0, 3);
  return (
    <span className="mt-1 flex justify-center gap-[3px]">
      {visible.map((item) => (
        <span
          key={item.id}
          className={cn(
            "size-[5px] rounded-full",
            item.completed ? "bg-ink-tertiary/50" : "bg-accent",
          )}
        />
      ))}
    </span>
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
  const openDay = useUiStore((state) => state.openDay);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto overscroll-contain px-3 pb-3 md:grid md:grid-cols-7 md:gap-1.5 md:overflow-hidden md:px-1.5 md:pb-1.5">
      {days.map((day) => {
        const key = toDateKey(day);
        const today = dayIsToday(day);
        const selected = key === selectedDate;
        const dayItems = itemsByDate.get(key) ?? [];

        return (
          <section
            key={key}
            className="min-h-0 rounded-[20px] bg-surface/50 md:flex md:flex-col md:overflow-hidden"
          >
            <button
              type="button"
              onClick={() => onSelectDay(day)}
              aria-current={today ? "date" : undefined}
              aria-label={key}
              className="flex min-h-11 w-full items-center gap-3 px-1 py-2 md:flex-col md:gap-1 md:pt-3"
            >
              <span className="w-10 text-[12px] font-medium uppercase tracking-wide text-ink-secondary md:w-auto">
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
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-1 pb-2 md:px-1.5">
              {dayItems.length === 0 ? (
                <button
                  type="button"
                  onClick={() => openDay(key)}
                  className="hidden min-h-8 w-full md:block"
                  aria-label="Otvori dan"
                />
              ) : (
                dayItems.map((item) => (
                  <div key={item.id} className="flex items-start">
                    <button
                      type="button"
                      onClick={() => onOpenItem(item.id)}
                      className={cn(
                        "min-w-0 flex-1 rounded-xl px-2 py-1.5 text-left transition-colors duration-150 md:px-1.5",
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
                      <span className="block truncate text-[13px] font-medium leading-4 text-ink md:text-[12px]">
                        {item.title}
                      </span>
                    </button>
                    {item.noteId && (
                      <NoteLinkButton noteId={item.noteId} compact />
                    )}
                    {item.kbPageId && (
                      <KbLinkButton pageId={item.kbPageId} compact />
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
