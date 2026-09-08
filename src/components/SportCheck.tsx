import { cn } from "@/lib/cn";
import { useId } from "react";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  description?: string;
};

export function SportCheck({ checked, onChange, description }: Props) {
  const descId = useId();

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-describedby={description ? descId : undefined}
      onClick={() => onChange(!checked)}
      className={cn(
        "pressable flex w-full gap-3 rounded-2xl px-3.5 text-left transition-colors duration-150",
        description ? "items-start py-3" : "mb-4 min-h-12 items-center bg-surface-2",
        description && checked && "bg-accent/12",
        description && !checked && "bg-surface-2",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-[6px] border-[1.5px] transition-colors duration-150",
          !description && "mt-0",
          checked
            ? "border-accent bg-accent text-accent-fg"
            : "border-ink-tertiary/80 bg-transparent text-transparent",
        )}
      >
        <svg viewBox="0 0 16 16" className="size-[12px]" aria-hidden>
          <path
            d="M3.2 8.2 6.4 11.2 12.8 4.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-[16px] font-medium">Sport</span>
        {description ? (
          <span
            id={descId}
            className="mt-1 block text-[13px] leading-snug text-ink-secondary"
          >
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
