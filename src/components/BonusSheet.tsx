import { SegmentedControl } from "@/components/SegmentedControl";
import { Sheet } from "@/components/Sheet";
import { BUCKETS, parseAmount } from "@/lib/finances";
import { dateKeyInMonth, todayKey } from "@/lib/dates";
import { useFinancesStore } from "@/store/useFinancesStore";
import type { FinanceBucket } from "@/types";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultBucket?: FinanceBucket;
  defaultMonth?: string;
};

export function BonusSheet({ open, onClose, defaultBucket, defaultMonth }: Props) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="bonus-sheet-title" zIndex={60}>
      {open && (
        <BonusForm
          key={`${defaultBucket ?? "bonus"}-${defaultMonth ?? "today"}`}
          defaultBucket={defaultBucket}
          defaultMonth={defaultMonth}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}

function BonusForm({
  defaultBucket,
  defaultMonth,
  onClose,
}: {
  defaultBucket?: FinanceBucket;
  defaultMonth?: string;
  onClose: () => void;
}) {
  const addBonus = useFinancesStore((state) => state.addBonus);
  const [bucket, setBucket] = useState<FinanceBucket>(defaultBucket ?? "needs");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(
    defaultMonth ? dateKeyInMonth(defaultMonth) : todayKey(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

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
    if (!date) {
      setError("Izaberite datum");
      return;
    }
    if (saving) return;
    setSaving(true);
    addBonus({ amount: parsed, bucket, date });
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
          id="bonus-sheet-title"
          className="font-display text-[18px] font-semibold tracking-[-0.02em]"
        >
          Uplata van plate
        </h2>
        <button
          type="submit"
          disabled={saving}
          className="pressable min-h-11 rounded-full px-2 text-[16px] font-semibold text-accent disabled:opacity-50"
        >
          Dodaj
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-5">
        <p className="mb-4 text-[13px] leading-5 text-ink-secondary">
          Ova uplata se ne deli na 50/30/20. Izaberi gde da ode.
        </p>

        <div className="mb-4">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
            Kategorija
          </span>
          <SegmentedControl
            value={bucket}
            onChange={setBucket}
            options={BUCKETS.map((entry) => ({
              value: entry.id,
              label: `${entry.percent} ${entry.shortLabel}`,
            }))}
            ariaLabel="Gde da ide uplata"
            size="sm"
          />
        </div>

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
            placeholder="npr. 5.000"
            className="field tabular-nums"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
            Datum
          </span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            onClick={(event) => {
              const input = event.currentTarget;
              try {
                input.showPicker();
              } catch {
                // Browser will open the native picker on tap.
              }
            }}
            className="date-picker field tabular-nums"
          />
        </label>

        {error && (
          <p className="mb-4 text-[14px] text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
