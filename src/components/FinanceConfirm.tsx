import { dialogTransition } from "@/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function FinanceConfirm({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center px-6">
          <motion.button
            type="button"
            aria-label="Zatvori"
            className="absolute inset-0 bg-[var(--backdrop)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduce ? { duration: 0.01 } : dialogTransition}
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="finance-confirm-title"
            className="relative w-full max-w-[320px] overflow-hidden rounded-[24px] bg-surface shadow-[var(--shadow-float)]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={reduce ? { duration: 0.01 } : dialogTransition}
          >
            <div className="px-5 pb-4 pt-6 text-center">
              <h2
                id="finance-confirm-title"
                className="font-display text-[22px] font-semibold tracking-[-0.02em]"
              >
                {title}
              </h2>
              <p className="mt-1.5 text-[13px] leading-5 text-ink-secondary">
                {body}
              </p>
            </div>
            <div className="grid grid-cols-2 hairline-t">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-12 text-[16px] text-ink-secondary transition-colors duration-150 hover:bg-ink/[0.04]"
              >
                Otkaži
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={
                  danger
                    ? "min-h-12 text-[16px] font-semibold text-danger shadow-[-0.5px_0_0_0_var(--hairline)] transition-colors duration-150 hover:bg-danger/[0.06]"
                    : "min-h-12 text-[16px] font-semibold text-accent shadow-[-0.5px_0_0_0_var(--hairline)] transition-colors duration-150 hover:bg-accent/[0.06]"
                }
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
