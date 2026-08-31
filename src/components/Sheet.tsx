import { dialogTransition, sheetSpring } from "@/lib/motion";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  zIndex?: number;
};

export function Sheet({
  open,
  onClose,
  children,
  labelledBy,
  zIndex = 50,
}: SheetProps) {
  const isDesktop = useIsDesktop();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0" style={{ zIndex }}>
          <motion.button
            type="button"
            aria-label="Zatvori"
            className="absolute inset-0 bg-[var(--backdrop)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0.01 } : dialogTransition}
            onClick={onClose}
          />
          {isDesktop ? (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              className="absolute left-1/2 top-1/2 flex max-h-[min(80dvh,720px)] w-[min(440px,calc(100%-32px))] flex-col overflow-hidden rounded-[28px] bg-surface shadow-[var(--shadow-float)]"
              initial={
                reduce
                  ? { opacity: 0, x: "-50%", y: "-50%" }
                  : { opacity: 0, scale: 0.96, x: "-50%", y: "-50%" }
              }
              animate={{
                opacity: 1,
                scale: 1,
                x: "-50%",
                y: "-50%",
              }}
              exit={
                reduce
                  ? { opacity: 0, x: "-50%", y: "-50%" }
                  : { opacity: 0, scale: 0.98, x: "-50%", y: "-50%" }
              }
              transition={reduce ? { duration: 0.01 } : sheetSpring}
            >
              {children}
            </motion.div>
          ) : (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              className="absolute inset-x-0 bottom-0 flex max-h-[min(92dvh,92svh)] flex-col overflow-hidden rounded-t-[28px] bg-surface pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-float)]"
              initial={reduce ? { opacity: 0 } : { y: "108%" }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: "108%" }}
              transition={reduce ? { duration: 0.01 } : sheetSpring}
            >
              <div className="flex shrink-0 justify-center pt-2.5 pb-1">
                <span className="h-1.5 w-11 rounded-full bg-ink/14" />
              </div>
              {children}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
