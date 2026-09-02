import { Sheet } from "@/components/Sheet";
import { cn } from "@/lib/cn";
import { dateKeyInMonth, todayKey } from "@/lib/dates";
import { categoriesForBucket, categoryMeta, parseAmount } from "@/lib/finances";
import { useFinancesStore } from "@/store/useFinancesStore";
import type { ExpenseCategory, FinanceBucket, FinanceExpense } from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";

type SpendBucket = Exclude<FinanceBucket, "savings">;

type Props = {
  open: boolean;
  onClose: () => void;
  bucket?: SpendBucket;
  existing?: FinanceExpense | null;
  defaultMonth?: string;
};

const BUCKET_OPTIONS: { value: SpendBucket; label: string; hint: string }[] = [
  { value: "needs", label: "50%", hint: "Dina · hausings" },
  { value: "wants", label: "30%", hint: "Visa · izlazci" },
];

export function ExpenseSheet({ open, onClose, bucket, existing, defaultMonth }: Props) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="expense-sheet-title" zIndex={60}>
      {open && (
        <ExpenseForm
          key={existing?.id ?? `${bucket ?? "expense"}-${defaultMonth ?? "today"}`}
          bucket={bucket}
          existing={existing ?? null}
          defaultMonth={defaultMonth}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}

function ExpenseForm({
  bucket,
  existing,
  defaultMonth,
  onClose,
}: {
  bucket?: SpendBucket;
  existing: FinanceExpense | null;
  defaultMonth?: string;
  onClose: () => void;
}) {
  const addExpense = useFinancesStore((state) => state.addExpense);
  const updateExpense = useFinancesStore((state) => state.updateExpense);
  const [spendBucket, setSpendBucket] = useState<SpendBucket | null>(
    existing
      ? categoryMeta(existing.category).bucket
      : (bucket ?? null),
  );
  const options = useMemo(
    () => (spendBucket ? categoriesForBucket(spendBucket) : []),
    [spendBucket],
  );
  const [category, setCategory] = useState<ExpenseCategory | null>(
    existing?.category ?? null,
  );
  const [amount, setAmount] = useState(
    existing ? String(existing.amount) : "",
  );
  const [date, setDate] = useState(
    existing?.date ?? (defaultMonth ? dateKeyInMonth(defaultMonth) : todayKey()),
  );
  const bucketLocked = Boolean(bucket);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!category) return;
    const id = window.setTimeout(() => amountRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [category]);

  function pickBucket(next: SpendBucket) {
    setSpendBucket(next);
    setCategory((current) => {
      if (!current) return null;
      return categoryMeta(current).bucket === next ? current : null;
    });
    setError(null);
  }

  function save() {
    if (!spendBucket) {
      setError("Izaberite 50% ili 30%");
      return;
    }
    if (!category) {
      setError("Izaberite kategoriju");
      return;
    }
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
    if (existing) {
      updateExpense(existing.id, { category, amount: parsed, date });
    } else {
      addExpense({ category, amount: parsed, date });
    }
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
          id="expense-sheet-title"
          className="font-display text-[18px] font-semibold tracking-[-0.02em]"
        >
          {existing ? "Izmeni trošak" : "Unesi trošak"}
        </h2>
        <button
          type="submit"
          disabled={saving}
          className="pressable min-h-11 rounded-full px-2 text-[16px] font-semibold text-accent disabled:opacity-50"
        >
          {existing ? "Sačuvaj" : "Dodaj"}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-5">
        {!bucketLocked && (
          <div className="mb-4">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
              Prvo izaberi grupu
            </span>
            <div className="grid grid-cols-2 gap-2">
              {BUCKET_OPTIONS.map((entry) => {
                const selected = entry.value === spendBucket;
                return (
                  <button
                    key={entry.value}
                    type="button"
                    onClick={() => pickBucket(entry.value)}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center rounded-2xl px-3 transition-colors",
                      selected
                        ? "bg-accent text-accent-fg"
                        : "bg-surface-2 text-ink",
                    )}
                  >
                    <span className="text-[18px] font-semibold leading-none">
                      {entry.label}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-[12px]",
                        selected ? "text-accent-fg/80" : "text-ink-secondary",
                      )}
                    >
                      {entry.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {spendBucket && (
          <div className="mb-4">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
              Kategorija
            </span>
            <div className="flex flex-wrap gap-2">
              {options.map((entry) => {
                const selected = entry.id === category;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      setCategory(entry.id);
                      if (error) setError(null);
                    }}
                    className={cn(
                      "min-h-10 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                      selected
                        ? "bg-accent text-accent-fg"
                        : "bg-surface-2 text-ink-secondary",
                    )}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>
          </div>
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
            placeholder="npr. 2.500"
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
