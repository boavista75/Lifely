import { cn } from "@/lib/cn";
import { snappySpring } from "@/lib/motion";
import { motion, useReducedMotion } from "motion/react";

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = "md",
}: Props<T>) {
  const reduce = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative flex w-full rounded-2xl bg-surface-2/90 p-[3px]",
        size === "sm" && "p-0.5 rounded-[14px]",
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-0 min-h-9 min-w-0 flex-1 rounded-[14px] px-2 text-center font-medium transition-colors duration-200",
              size === "sm" ? "min-h-8 rounded-[10px] text-[12px]" : "text-[13px]",
              selected ? "text-ink" : "text-ink-secondary",
            )}
          >
            {selected && (
              <motion.span
                layoutId={reduce ? undefined : `seg-${ariaLabel}`}
                className="absolute inset-0 rounded-[inherit] bg-surface shadow-[var(--shadow-card)]"
                transition={reduce ? { duration: 0.01 } : snappySpring}
              />
            )}
            <span className="relative z-10 block truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
