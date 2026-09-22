import { Sheet } from "@/components/Sheet";
import { formatRsd, monthTitleFromKey, parseAmount } from "@/lib/finances";
import { useFinancesStore } from "@/store/useFinancesStore";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  month: string;
  remainingTotal: number;
};

export function SavingSheet({ open, onClose, month, remainingTotal }: Props) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="saving-sheet-title" zIndex={60}>
      {open && (
        <SavingForm
          key={month}
          month={month}
          remainingTotal={remainingTotal}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}

function SavingForm({
  month,
  remainingTotal,
  onClose,
}: {
  month: string;
  remainingTotal: number;
  onClose: () => void;
}) {
  const savings = useFinancesStore((state) => state.savings);
  const setSaving = useFinancesStore((state) => state.setSaving);
  const existing = savings.find((entry) => entry.month === month);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSavingState] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const maxLockable = Math.max(0, remainingTotal, existing?.amount ?? 0);

  useEffect(() => {
    const id = window.setTimeout(() => amountRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, []);

  function save() {
    const parsed = parseAmount(amount);
    if (parsed === null) {
      setError("Unesite iznos u dinarima");
      amountRef.current?.focus();
      return;
    }
    if (parsed > maxLockable) {
      setError(
        maxLockable === 0
          ? "Nema raspoloživog novca za uštedu"
          : `Možeš zaključati najviše ${formatRsd(maxLockable)}`,
      );
      amountRef.current?.focus();
      return;
    }
    if (saving) return;
    setSavingState(true);
    setSaving(month, parsed);
    onClose();
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3 pt-1 md:px-5 md:pt-5">
        <button
          type="button"
          onClick={onClose}
          className="pressable min-h-11 rounded-full px-2 text-[16px] text-ink-secondary"
        >
          Otkaži
        </button>
        <h2
          id="saving-sheet-title"
          className="font-display text-[18px] font-semibold tracking-[-0.02em]"
        >
          Uštedi
        </h2>
        <button
          type="submit"
          disabled={saving}
          className="pressable min-h-11 rounded-full px-2 text-[16px] font-semibold text-accent disabled:opacity-50"
        >
          Zaključaj
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-5">
        <p className="mb-4 text-[13px] leading-5 text-ink-secondary">
          Iznos se zaključava kao ušteđevina za {monthTitleFromKey(month)} i ne
          troši se.
        </p>

        {existing && (
          <p className="mb-4 rounded-2xl bg-surface-2 px-4 py-3 text-[13px] leading-5 text-ink-secondary">
            Trenutno zaključano:{" "}
            <span className="font-semibold text-ink">
              {formatRsd(existing.amount)}
            </span>
            . Uneti iznos zamenjuje prethodni.
          </p>
        )}

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
            Iznos (RSD)
          </span>
          <input
            ref={amountRef}
            inputMode="numeric"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              if (error) setError(null);
            }}
            placeholder="npr. 10.000"
            className="field tabular-nums"
          />
        </label>
        <p className="-mt-2 mb-4 text-[12px] text-ink-tertiary">
          Raspoloživo za uštedu: {formatRsd(Math.max(0, remainingTotal))}
        </p>

        {error && (
          <p className="mb-4 text-[14px] text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
