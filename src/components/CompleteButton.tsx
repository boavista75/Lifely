import { cn } from "@/lib/cn";
import { motion, useReducedMotion } from "motion/react";

type Props = {
  completed: boolean;
  onToggle: () => void;
  label: string;
};

export function CompleteButton({ completed, onToggle, label }: Props) {
  const reduce = useReducedMotion();

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={completed}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className="grid size-11 shrink-0 place-items-center"
    >
      <span
        className={cn(
          "grid size-[22px] place-items-center rounded-full border-[1.5px] transition-colors duration-150",
          completed
            ? "border-accent bg-accent text-accent-fg"
            : "border-ink-tertiary/80 bg-transparent",
        )}
      >
        <motion.svg
          viewBox="0 0 16 16"
          className="size-[12px]"
          aria-hidden
        >
          <motion.path
            d="M3.2 8.2 6.4 11.2 12.8 4.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              pathLength: completed ? 1 : 0,
              opacity: completed ? 1 : 0,
            }}
            transition={
              reduce
                ? { duration: 0.01 }
                : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
          />
        </motion.svg>
      </span>
    </button>
  );
}
