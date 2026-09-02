import { FinanceConfirm } from "@/components/FinanceConfirm";
import { IconChevron } from "@/components/icons";
import { Sheet } from "@/components/Sheet";
import {
  currentMonthKey,
  currentYearMonthChoices,
  monthKeyInCurrentYear,
  monthTitleFromKey,
  parseAmount,
} from "@/lib/finances";
import { useFinancesStore } from "@/store/useFinancesStore";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultMonth?: string;
};

export function SalarySheet({ open, onClose, defaultMonth }: Props) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="salary-sheet-title" zIndex={60}>
      {open && (
        <SalaryForm
          key={defaultMonth ?? "salary"}
          defaultMonth={defaultMonth}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}

function SalaryForm({
  defaultMonth,
  onClose,
}: {
  defaultMonth?: string;
  onClose: () => void;
}) {
  const salaries = useFinancesStore((state) => state.salaries);
  const setSalary = useFinancesStore((state) => state.setSalary);
  const [month, setMonth] = useState(() =>
    monthKeyInCurrentYear(defaultMonth ?? currentMonthKey()),
  );
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const existing = salaries.find((entry) => entry.month === month);
  const alreadyEntered = Boolean(existing);

  useEffect(() => {
    const id = window.setTimeout(() => amountRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, []);

  function submit(force: boolean) {
    const parsed = parseAmount(amount, { allowZero: true });
    if (parsed === null) {
      setError("Unesite iznos plate u dinarima");
      amountRef.current?.focus();
      return;
    }
    if (alreadyEntered && !force) {
      setConfirmOpen(true);
      return;
    }
    if (saving) return;
    setSaving(true);
    setSalary(month, parsed);
    onClose();
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        submit(false);
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
          id="salary-sheet-title"
          className="font-display text-[18px] font-semibold tracking-[-0.02em]"
        >
          Unesi platu
        </h2>
        <button
          type="submit"
          disabled={saving}
          className="pressable min-h-11 rounded-full px-2 text-[16px] font-semibold text-accent disabled:opacity-50"
        >
          Sačuvaj
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 md:px-5">
        {alreadyEntered && (
          <p
            className="mb-4 rounded-2xl bg-danger/8 px-4 py-3 text-[13px] leading-5 text-danger"
            role="status"
          >
            Plata za {monthTitleFromKey(month)} je već uneta. Nova plata će
            preklopiti (zameniti) prethodno unetu platu, a svi troškovi za taj
            mesec biće resetovani na 0.
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
            placeholder="npr. 70.000"
            className="field tabular-nums"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
            Mesec
          </span>
          <MonthSelect value={month} onChange={setMonth} />
        </label>

        {error && (
          <p className="mb-4 text-[14px] text-danger" role="alert">
            {error}
          </p>
        )}
      </div>

      <FinanceConfirm
        open={confirmOpen}
        title="Zameniti platu?"
        body={`Plata za ${monthTitleFromKey(month)} je već uneta. Nova plata će preklopiti (zameniti) prethodno unetu platu, a svi troškovi za taj mesec biće resetovani na 0.`}
        confirmLabel="Zameni"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          submit(true);
        }}
      />
    </form>
  );
}

function MonthSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (month: string) => void;
}) {
  const options = useMemo(() => currentYearMonthChoices(), []);
  const selected = monthKeyInCurrentYear(value);

  return (
    <div className="relative">
      <select
        value={selected}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Mesec"
        className="field"
      >
        {options.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.label}
          </option>
        ))}
      </select>
      <IconChevron className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 -rotate-90 text-ink-tertiary" />
    </div>
  );
}
