import { CompleteButton } from "@/components/CompleteButton";
import { KbLinkButton } from "@/components/KbLinkButton";
import { NoteLinkButton } from "@/components/NoteLinkButton";
import { RowDeleteButton } from "@/components/RowDeleteButton";
import { useOptimisticComplete } from "@/hooks/useOptimisticComplete";
import { cn } from "@/lib/cn";
import { nextDateKey, parseDateKey, shortMonthDay } from "@/lib/dates";
import { formatItemTime } from "@/lib/items";
import { listItem } from "@/lib/motion";
import { useItemsStore } from "@/store/useItemsStore";
import { useUiStore } from "@/store/useUiStore";
import type { LifelyItem } from "@/types";
import { motion, useReducedMotion } from "motion/react";

type Props = {
  item: LifelyItem;
  showDate?: boolean;
  onOpen: () => void;
  showDefer?: boolean;
};

export function ItemRow({
  item,
  showDate = false,
  onOpen,
  showDefer = false,
}: Props) {
  const toggleComplete = useItemsStore((state) => state.toggleComplete);
  const updateItem = useItemsStore((state) => state.updateItem);
  const requestDelete = useUiStore((state) => state.requestDelete);
  const [complete, onToggle] = useOptimisticComplete(item.completed, () =>
    toggleComplete(item.id),
  );
  const reduce = useReducedMotion();
  const time = formatItemTime(item);

  return (
    <motion.div
      layout={reduce ? false : "position"}
      initial={reduce ? false : listItem.initial}
      animate={{
        ...listItem.animate,
        opacity: complete && item.completed ? 0.52 : 1,
      }}
      exit={reduce ? { opacity: 0 } : listItem.exit}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-12 items-center gap-0.5 px-0.5"
    >
      <CompleteButton
        completed={complete}
        onToggle={onToggle}
        label={complete ? "Označi kao nezavršeno" : "Označi kao završeno"}
      />
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 py-2 pr-2 text-left"
      >
        <span className="relative inline-block max-w-full">
          <span
            className={cn(
              "block truncate text-[16px] leading-5",
              complete ? "text-ink-secondary" : "text-ink",
            )}
          >
            {item.title}
          </span>
          <motion.span
            aria-hidden
            className="absolute top-1/2 left-0 h-px w-full origin-left bg-current"
            initial={false}
            animate={{ scaleX: complete ? 1 : 0 }}
            transition={
              reduce
                ? { duration: 0.01 }
                : { duration: 0.24, delay: 0.08, ease: [0.22, 1, 0.36, 1] }
            }
          />
        </span>
        {(time || showDate) && (
          <span className="mt-0.5 block truncate text-[13px] text-ink-secondary tabular">
            {showDate ? capitalizeDate(item.date) : null}
            {showDate && time ? " · " : null}
            {time}
          </span>
        )}
      </button>
      {item.noteId && <NoteLinkButton noteId={item.noteId} />}
      {item.kbPageId && <KbLinkButton pageId={item.kbPageId} />}
      {showDefer && (
        <button
          type="button"
          aria-label="Prebaci za sutra"
          onClick={(event) => {
            event.stopPropagation();
            updateItem(item.id, { date: nextDateKey(item.date) });
          }}
          className="pressable mr-1 min-h-11 shrink-0 rounded-full px-2.5 py-1.5 text-[13px] font-semibold text-accent"
        >
          Za sutra
        </button>
      )}
      <RowDeleteButton
        label="Obriši stavku"
        onClick={() => requestDelete(item.id)}
      />
    </motion.div>
  );
}

function capitalizeDate(dateKey: string): string {
  return shortMonthDay(parseDateKey(dateKey));
}
