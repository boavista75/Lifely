import { TABS } from "@/nav";
import { cn } from "@/lib/cn";
import { snappySpring } from "@/lib/motion";
import { useUiStore } from "@/store/useUiStore";
import { motion, useReducedMotion } from "motion/react";

export function TabBar() {
  const tab = useUiStore((state) => state.tab);
  const setTab = useUiStore((state) => state.setTab);
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label="Glavna navigacija"
      className="absolute inset-x-0 bottom-0 z-30 px-3 pb-[max(10px,env(safe-area-inset-bottom))] md:hidden"
    >
      <div className="grid h-[62px] grid-cols-5 rounded-[22px] bg-surface px-1 shadow-[var(--shadow-float)]">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center gap-0.5",
                active ? "text-accent" : "text-ink-tertiary",
              )}
            >
              {active && (
                <motion.span
                  layoutId={reduce ? undefined : "tab-pill"}
                  className="absolute inset-x-1 inset-y-1.5 rounded-2xl bg-accent/12"
                  transition={reduce ? { duration: 0.01 } : snappySpring}
                />
              )}
              <Icon className="relative size-[22px]" />
              <span className="relative text-[10px] font-semibold leading-none tracking-wide">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
