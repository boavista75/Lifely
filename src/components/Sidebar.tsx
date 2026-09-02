import { BrandLockup } from "@/components/ThemeToggle";
import { KbExplorer } from "@/components/KbExplorer";
import { TABS } from "@/nav";
import { cn } from "@/lib/cn";
import { snappySpring } from "@/lib/motion";
import { useSidebarResize } from "@/hooks/useSidebarResize";
import { useUiStore } from "@/store/useUiStore";
import { motion, useReducedMotion } from "motion/react";

export function Sidebar() {
  const tab = useUiStore((state) => state.tab);
  const setTab = useUiStore((state) => state.setTab);
  const kbPageId = useUiStore((state) => state.kbPageId);
  const reduce = useReducedMotion();
  const showKbTree = tab === "knowledge" && Boolean(kbPageId);
  const { asideRef, width, handleProps } = useSidebarResize();

  return (
    <aside
      ref={asideRef}
      style={{ width }}
      className="relative z-10 hidden h-full min-w-0 shrink-0 flex-col px-3 md:flex"
    >
      <div className="page-header px-3">
        <BrandLockup />
      </div>
      <nav
        aria-label="Glavna navigacija"
        className="mt-8 flex shrink-0 flex-col gap-1"
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 min-w-0 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium transition-colors duration-200",
                active
                  ? "text-accent"
                  : "text-ink-secondary hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId={reduce ? undefined : "nav-pill"}
                  className="absolute inset-0 rounded-2xl bg-accent/12"
                  transition={reduce ? { duration: 0.01 } : snappySpring}
                />
              )}
              <Icon className="relative size-[22px] shrink-0" />
              <span className="relative min-w-0 truncate">{label}</span>
            </button>
          );
        })}
      </nav>
      {showKbTree ? <KbExplorer variant="sidebar" /> : null}
      <div {...handleProps}>
        <span className="my-8 w-px self-stretch rounded-full bg-ink/22 transition-[background-color,width,box-shadow] duration-150 group-hover:w-0.5 group-hover:bg-accent group-focus-visible:bg-accent group-data-[resizing=true]:w-0.5 group-data-[resizing=true]:bg-accent" />
      </div>
    </aside>
  );
}
