import { SegmentedControl } from "@/components/SegmentedControl";
import { text } from "@/i18n";
import { Sheet } from "@/components/Sheet";
import { BUCKETS, bucketMeta, parseAmount } from "@/lib/finances";
import { dateKeyInMonth, todayKey } from "@/lib/dates";
import { useFinancesStore } from "@/store/useFinancesStore";
import type { FinanceBucket } from "@/types";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultBucket?: FinanceBucket;
  defaultMonth?: string;
  simple?: boolean;
};

export function BonusSheet({
  open,
  onClose,
  defaultBucket,
  defaultMonth,
  simple = false,
}: Props) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="bonus-sheet-title" zIndex={60}>
      {open && (
        <BonusForm
          key={`${simple ? "simple" : (defaultBucket ?? "bonus")}-${defaultMonth ?? "today"}`}
          defaultBucket={simple ? "needs" : defaultBucket}
          defaultMonth={defaultMonth}
          simple={simple}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}

function BonusForm({
  defaultBucket,
  defaultMonth,
  simple,
  onClose,
}: {
  defaultBucket?: FinanceBucket;
  defaultMonth?: string;
  simple: boolean;
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
      setError(text("finance.amountRequired"));
      amountRef.current?.focus();
      return;
    }
    if (!date) {
      setError(text("finance.pickDate"));
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
          {text("common.cancel")}
        </button>
        <h2
          id="bonus-sheet-title"
          className="font-display text-[18px] font-semibold tracking-[-0.02em]"
        >
          {text("finance.bonusTitle")}
        </h2>
        <button
          type="submit"
          disabled={saving}
          className="pressable min-h-11 rounded-full px-2 text-[16px] font-semibold text-accent disabled:opacity-50"
        >
          {text("common.add")}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-5">
        <p className="mb-4 text-[13px] leading-5 text-ink-secondary">
          {simple ? text("finance.bonusSimple") : text("finance.bonusSplit")}
        </p>

        {!simple && (
          <div className="mb-4">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
              {text("finance.category")}
            </span>
            <SegmentedControl
              value={bucket}
              onChange={setBucket}
              options={BUCKETS.map((entry) => ({
                value: entry.id,
                label: `${entry.percent} ${bucketMeta(entry.id).shortLabel}`,
              }))}
              ariaLabel={text("finance.bonusWhere")}
              size="sm"
            />
          </div>
        )}

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
            {text("finance.amountRsd")}
          </span>
          <input
            ref={amountRef}
            inputMode="numeric"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              if (error) setError(null);
            }}
            placeholder={text("finance.bonusExample")}
            className="field tabular-nums"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
            {text("item.date")}
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
