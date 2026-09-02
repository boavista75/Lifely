import { SegmentedControl } from "@/components/SegmentedControl";
import { IconChevron } from "@/components/icons";
import {
  getMonthGrid,
  getWeekDays,
  monthKey,
  monthTitle,
  parseDateKey,
  sameMonth,
  shiftMonth,
  shiftWeek,
  todayKey,
  toDateKey,
  weekKey,
  WEEKDAY_LETTERS,
} from "@/lib/dates";
import { sortDayItems } from "@/lib/items";
import { monthSlide, slideTransition } from "@/lib/motion";
import { CalendarDragProvider } from "@/hooks/useCalendarItemDrag";
import { MonthGrid, WeekGrid } from "@/screens/MonthGrid";
import { useItemsStore } from "@/store/useItemsStore";
import { useUiStore } from "@/store/useUiStore";
import type { LifelyItem } from "@/types";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState, type ReactNode } from "react";

type CalendarView = "month" | "week";

export function CalendarScreen() {
  const items = useItemsStore((state) => state.items);
  const selectedDate = useUiStore((state) => state.selectedDate);
  const setSelectedDate = useUiStore((state) => state.setSelectedDate);
  const openDay = useUiStore((state) => state.openDay);
  const openNewItem = useUiStore((state) => state.openNewItem);
  const openEditItem = useUiStore((state) => state.openEditItem);
  const reduce = useReducedMotion();

  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => parseDateKey(selectedDate));
  const [direction, setDirection] = useState(0);

  const itemsByDate = useMemo(() => groupByDate(items), [items]);
  const monthDays = useMemo(() => getMonthGrid(cursor), [cursor]);
  const weekDays = useMemo(() => getWeekDays(cursor), [cursor]);
  const title = monthTitle(cursor);
  const periodKey = view === "month" ? monthKey(cursor) : weekKey(cursor);

  function go(amount: number) {
    setDirection(amount);
    setCursor((current) =>
      view === "month" ? shiftMonth(current, amount) : shiftWeek(current, amount),
    );
    if (view === "week") {
      const next = shiftWeek(parseDateKey(selectedDate), amount);
      setSelectedDate(toDateKey(next));
    }
  }

  function goToday() {
    const now = new Date();
    const today = todayKey();
    setDirection(now.getTime() >= cursor.getTime() ? 1 : -1);
    setCursor(now);
    setSelectedDate(today);
  }

  function onSelectDay(date: Date) {
    const key = toDateKey(date);
    setSelectedDate(key);
    if (view === "month" && !sameMonth(date, cursor)) {
      setDirection(date.getTime() > cursor.getTime() ? 1 : -1);
      setCursor(date);
    }
    if ((itemsByDate.get(key)?.length ?? 0) > 0) {
      openDay(key);
    } else {
      openNewItem(key);
    }
  }

  function onViewChange(next: CalendarView) {
    setView(next);
    setCursor(parseDateKey(selectedDate));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-4 pt-3 md:px-8 md:pt-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="page-title flex min-h-11 min-w-0 items-center md:hidden">
            Kalendar
          </h1>
          <p className="hidden min-w-0 truncate font-display text-[34px] font-semibold leading-[0.95] tracking-[-0.03em] tabular md:flex md:min-h-11 md:items-center">
            {title}
          </p>
          <div className="flex min-h-11 shrink-0 items-center gap-0.5">
            <IconButton label="Prethodni" onClick={() => go(-1)}>
              <IconChevron className="size-5" />
            </IconButton>
            <IconButton label="Sledeći" onClick={() => go(1)}>
              <IconChevron className="size-5 rotate-180" />
            </IconButton>
            <button
              type="button"
              onClick={goToday}
              className="pressable ml-1 min-h-11 rounded-full bg-accent/12 px-3.5 text-[14px] font-semibold text-accent"
            >
              Danas
            </button>
          </div>
        </div>
        <p className="mt-2 font-display text-[24px] font-semibold leading-[0.95] tracking-[-0.03em] tabular md:hidden">
          {title}
        </p>
        <div className="mt-4 mb-3 max-w-[280px]">
          <SegmentedControl
            value={view}
            onChange={onViewChange}
            options={[
              { value: "month", label: "Mesec" },
              { value: "week", label: "Nedelja" },
            ]}
            ariaLabel="Prikaz kalendara"
          />
        </div>
      </header>

      {view === "month" && (
        <div className="grid shrink-0 grid-cols-7 px-1 md:px-4">
          {WEEKDAY_LETTERS.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="py-1 text-center text-[11px] font-medium uppercase tracking-wider text-ink-secondary"
            >
              {letter}
            </span>
          ))}
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden md:px-4 md:pb-4">
        <CalendarDragProvider>
          {view === "month" ? (
            <PeriodPane
              key="month"
              periodKey={periodKey}
              direction={direction}
              reduce={Boolean(reduce)}
            >
              <MonthGrid
                days={monthDays}
                cursor={cursor}
                selectedDate={selectedDate}
                itemsByDate={itemsByDate}
                onSelect={onSelectDay}
              />
            </PeriodPane>
          ) : (
            <PeriodPane
              key="week"
              periodKey={periodKey}
              direction={direction}
              reduce={Boolean(reduce)}
            >
              <WeekGrid
                days={weekDays}
                selectedDate={selectedDate}
                itemsByDate={itemsByDate}
                onSelectDay={onSelectDay}
                onOpenItem={openEditItem}
              />
            </PeriodPane>
          )}
        </CalendarDragProvider>
      </div>
    </div>
  );
}

const fadeOnly = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

function PeriodPane({
  periodKey,
  direction,
  reduce,
  children,
}: {
  periodKey: string;
  direction: number;
  reduce: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatePresence initial={false} custom={direction}>
      <motion.div
        key={periodKey}
        custom={direction}
        variants={reduce ? fadeOnly : monthSlide}
        initial="enter"
        animate="center"
        exit="exit"
        transition={reduce ? { duration: 0.01 } : slideTransition}
        className="absolute inset-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function groupByDate(items: LifelyItem[]): Map<string, LifelyItem[]> {
  const map = new Map<string, LifelyItem[]>();
  for (const item of items) {
    const list = map.get(item.date);
    if (list) list.push(item);
    else map.set(item.date, [item]);
  }
  for (const [key, list] of map) {
    map.set(key, sortDayItems(list));
  }
  return map;
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="icon-btn"
    >
      {children}
    </button>
  );
}
