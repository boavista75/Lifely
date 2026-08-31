import { ItemRow } from "@/components/ItemRow";
import { ScreenHeader } from "@/components/ScreenHeader";
import { todayKey, parseDateKey, shortMonthDay } from "@/lib/dates";
import { compareDayItems } from "@/lib/items";
import { useItemsStore } from "@/store/useItemsStore";
import { useUiStore } from "@/store/useUiStore";
import type { LifelyItem } from "@/types";
import { AnimatePresence } from "motion/react";
import { useMemo, useRef, useState, type FormEvent } from "react";

export function TodoScreen() {
  const items = useItemsStore((state) => state.items);
  const addItem = useItemsStore((state) => state.addItem);
  const openEditItem = useUiStore((state) => state.openEditItem);
  const [draft, setDraft] = useState("");
  const addingRef = useRef(false);
  const today = todayKey();

  const groups = useMemo(() => groupTodos(items, today), [items, today]);

  function onQuickAdd(event: FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title || addingRef.current) return;
    addingRef.current = true;
    addItem({
      title,
      date: today,
      timeMode: "none",
      startTime: null,
      endTime: null,
    });
    setDraft("");
    addingRef.current = false;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScreenHeader title="Todo" />
      <form onSubmit={onQuickAdd} className="shrink-0 px-5 pt-5 md:px-8">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Dodaj za danas"
          className="field md:max-w-xl"
        />
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-8 md:px-6">
        {groups.empty ? (
          <p className="px-3 py-20 text-center text-[15px] text-ink-secondary">
            Nema stavki. Dodaj prvu iznad.
          </p>
        ) : (
          <>
            {groups.overdue.length > 0 && (
              <Section title="Ranije" items={groups.overdue} onOpen={openEditItem} showDate />
            )}
            {groups.today.length > 0 && (
              <Section title="Danas" items={groups.today} onOpen={openEditItem} />
            )}
            {groups.upcoming.length > 0 && (
              <Upcoming
                items={groups.upcoming}
                onOpen={openEditItem}
              />
            )}
            {groups.completed.length > 0 && (
              <Section
                title="Završeno"
                items={groups.completed}
                onOpen={openEditItem}
                showDate
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  items,
  onOpen,
  showDate = false,
}: {
  title: string;
  items: LifelyItem[];
  onOpen: (id: string) => void;
  showDate?: boolean;
}) {
  return (
    <section className="mt-5">
      <h2 className="px-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
        {title}
      </h2>
      <div className="card overflow-hidden rounded-[22px]">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              showDate={showDate}
              onOpen={() => onOpen(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Upcoming({
  items,
  onOpen,
}: {
  items: LifelyItem[];
  onOpen: (id: string) => void;
}) {
  const byDate = new Map<string, LifelyItem[]>();
  for (const item of items) {
    const list = byDate.get(item.date);
    if (list) list.push(item);
    else byDate.set(item.date, [item]);
  }

  return (
    <section className="mt-5">
      <h2 className="px-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-secondary">
        Predstojeće
      </h2>
      {[...byDate.entries()].map(([date, list]) => (
        <div key={date} className="mb-3">
          <p className="px-3 pb-1.5 text-[13px] text-ink-secondary tabular">
            {shortMonthDay(parseDateKey(date))}
          </p>
          <div className="card overflow-hidden rounded-[22px]">
            <AnimatePresence initial={false}>
              {list.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onOpen={() => onOpen(item.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </section>
  );
}

function groupTodos(items: LifelyItem[], today: string) {
  const active = items.filter((item) => !item.completed);
  const completed = items
    .filter((item) => item.completed)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const overdue = active
    .filter((item) => item.date < today)
    .sort((a, b) => a.date.localeCompare(b.date) || compareDayItems(a, b));
  const todayItems = active
    .filter((item) => item.date === today)
    .sort(compareDayItems);
  const upcoming = active
    .filter((item) => item.date > today)
    .sort((a, b) => a.date.localeCompare(b.date) || compareDayItems(a, b));

  return {
    overdue,
    today: todayItems,
    upcoming,
    completed,
    empty:
      overdue.length + todayItems.length + upcoming.length + completed.length ===
      0,
  };
}
