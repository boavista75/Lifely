import { FinanceConfirm } from "@/components/FinanceConfirm";
import { IconClose, IconPlus } from "@/components/icons";
import { Sheet } from "@/components/Sheet";
import { cn } from "@/lib/cn";
import { dateKeyInMonth, todayKey } from "@/lib/dates";
import {
  BUCKETS,
  CATEGORY_LABEL_MAX,
  categoriesForBucket,
  categoryMeta,
  findCategoryByLabelAny,
  parseAmount,
} from "@/lib/finances";
import { useFinancesStore } from "@/store/useFinancesStore";
import type {
  ExpenseCategory,
  ExpenseCategoryDef,
  FinanceBucket,
  FinanceExpense,
} from "@/types";
import { useEffect, useMemo, useRef, useState } from "react";

type SpendBucket = Exclude<FinanceBucket, "savings">;

type Props = {
  open: boolean;
  onClose: () => void;
  bucket?: SpendBucket;
  existing?: FinanceExpense | null;
  defaultMonth?: string;
  simple?: boolean;
};

const BUCKET_OPTIONS = BUCKETS.filter(
  (entry): entry is (typeof BUCKETS)[number] & { id: SpendBucket } =>
    entry.id !== "savings",
).map((entry) => ({
  value: entry.id,
  label: entry.percent,
  hint: entry.shortLabel,
}));

export function ExpenseSheet({
  open,
  onClose,
  bucket,
  existing,
  defaultMonth,
  simple = false,
}: Props) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="expense-sheet-title" zIndex={60}>
      {open && (
        <ExpenseForm
          key={
            existing?.id ??
            `${simple ? "simple" : (bucket ?? "expense")}-${defaultMonth ?? "today"}`
          }
          bucket={simple ? undefined : bucket}
          existing={existing ?? null}
          defaultMonth={defaultMonth}
          simple={simple}
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
  simple,
  onClose,
}: {
  bucket?: SpendBucket;
  existing: FinanceExpense | null;
  defaultMonth?: string;
  simple: boolean;
  onClose: () => void;
}) {
  const categories = useFinancesStore((state) => state.categories);
  const expenses = useFinancesStore((state) => state.expenses);
  const addExpense = useFinancesStore((state) => state.addExpense);
  const updateExpense = useFinancesStore((state) => state.updateExpense);
  const addCategory = useFinancesStore((state) => state.addCategory);
  const deleteCategory = useFinancesStore((state) => state.deleteCategory);
  const [spendBucket, setSpendBucket] = useState<SpendBucket | null>(
    simple
      ? null
      : existing
        ? categoryMeta(existing.category, categories).bucket
        : (bucket ?? null),
  );
  const options = useMemo(
    () =>
      simple
        ? categories
        : spendBucket
          ? categoriesForBucket(spendBucket, categories)
          : [],
    [simple, spendBucket, categories],
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
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ExpenseCategoryDef | null>(
    null,
  );
  const amountRef = useRef<HTMLInputElement>(null);
  const newCategoryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!category) return;
    const id = window.setTimeout(() => amountRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [category]);

  useEffect(() => {
    if (!addingCategory) return;
    const id = window.setTimeout(() => newCategoryRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [addingCategory]);

  function pickBucket(next: SpendBucket) {
    setSpendBucket(next);
    setCategory((current) => {
      if (!current) return null;
      return categoryMeta(current, categories).bucket === next ? current : null;
    });
    setAddingCategory(false);
    setNewCategoryLabel("");
    setError(null);
  }

  function submitNewCategory() {
    const existingByLabel = findCategoryByLabelAny(newCategoryLabel, categories);
    if (existingByLabel && (simple || existingByLabel.bucket === spendBucket)) {
      setCategory(existingByLabel.id);
      setAddingCategory(false);
      setNewCategoryLabel("");
      setError(null);
      return;
    }
    if (!simple && !spendBucket) return;
    const created = addCategory({
      label: newCategoryLabel,
      bucket: spendBucket ?? "needs",
    });
    if (!created) {
      setError("Unesite naziv kategorije");
      newCategoryRef.current?.focus();
      return;
    }
    setCategory(created.id);
    setAddingCategory(false);
    setNewCategoryLabel("");
    setError(null);
  }

  function confirmDeleteCategory() {
    if (!pendingDelete) return;
    const removedId = pendingDelete.id;
    deleteCategory(removedId);
    if (category === removedId) setCategory(null);
    setPendingDelete(null);
    setError(null);
  }

  function save() {
    if (!simple && !spendBucket) {
      setError("Izaberite grupu");
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

  const pendingDeleteCount = pendingDelete
    ? expenses.filter((entry) => entry.category === pendingDelete.id).length
    : 0;

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
        {!simple && !bucketLocked && (
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

        {(simple || spendBucket) && (
          <div className="mb-4">
            <span className="mb-1.5 block text-[13px] font-medium text-ink-secondary">
              Kategorija
            </span>
            <div className="flex flex-wrap gap-2">
              {options.map((entry) => {
                const selected = entry.id === category;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex min-h-10 items-center rounded-full pl-3.5 transition-colors",
                      selected
                        ? "bg-accent text-accent-fg"
                        : "bg-surface-2 text-ink-secondary",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setCategory(entry.id);
                        setAddingCategory(false);
                        setNewCategoryLabel("");
                        if (error) setError(null);
                      }}
                      className="min-h-10 text-[13px] font-medium"
                    >
                      {entry.label}
                    </button>
                    <button
                      type="button"
                      aria-label={`Obriši kategoriju ${entry.label}`}
                      onClick={() => setPendingDelete(entry)}
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full",
                        selected ? "text-accent-fg/75" : "text-ink-tertiary",
                      )}
                    >
                      <IconClose className="size-3.5" />
                    </button>
                  </div>
                );
              })}
              {!addingCategory && (
                <button
                  type="button"
                  aria-label="Nova kategorija"
                  onClick={() => {
                    setAddingCategory(true);
                    setNewCategoryLabel("");
                    if (error) setError(null);
                  }}
                  className="flex min-h-10 items-center gap-1 rounded-full bg-surface-2 px-3.5 text-[13px] font-medium text-ink-secondary"
                >
                  <IconPlus className="size-3.5" />
                  Nova
                </button>
              )}
            </div>
            {addingCategory && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={newCategoryRef}
                  value={newCategoryLabel}
                  onChange={(event) => {
                    setNewCategoryLabel(event.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitNewCategory();
                    }
                    if (event.key === "Escape") {
                      event.preventDefault();
                      event.stopPropagation();
                      setAddingCategory(false);
                      setNewCategoryLabel("");
                    }
                  }}
                  placeholder="Naziv kategorije"
                  maxLength={CATEGORY_LABEL_MAX}
                  className="field min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={submitNewCategory}
                  className="pressable shrink-0 rounded-full px-3 text-[14px] font-semibold text-accent"
                >
                  Dodaj
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingCategory(false);
                    setNewCategoryLabel("");
                  }}
                  className="pressable shrink-0 rounded-full px-2 text-[14px] text-ink-secondary"
                >
                  Otkaži
                </button>
              </div>
            )}
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

      <FinanceConfirm
        open={pendingDelete !== null}
        title="Obrisati kategoriju?"
        body={
          pendingDeleteCount > 0
            ? `„${pendingDelete?.label}“ i ${pendingDeleteCount === 1 ? "1 povezani trošak" : `${pendingDeleteCount} povezanih troškova`} će biti uklonjeni.`
            : `„${pendingDelete?.label ?? ""}“ će biti uklonjena iz liste.`
        }
        confirmLabel="Obriši"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteCategory}
      />
    </form>
  );
}
