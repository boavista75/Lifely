import { BonusSheet } from "@/components/BonusSheet";
import { ExpenseSheet } from "@/components/ExpenseSheet";
import { FinanceConfirm } from "@/components/FinanceConfirm";
import { SalarySheet } from "@/components/SalarySheet";
import { SavingSheet } from "@/components/SavingSheet";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  IconBell,
  IconCard,
  IconChevron,
  IconLock,
} from "@/components/icons";
import { cn } from "@/lib/cn";
import { todayKey } from "@/lib/dates";
import {
  BUCKETS,
  bucketMeta,
  categoriesForBucket,
  categoryMeta,
  currentMonthKey,
  expenseDateHeading,
  formatExpenseDate,
  formatRsd,
  formatRsdNumber,
  groupByDate,
  listHistoryMonths,
  monthTitleFromKey,
  summarizeMonth,
  type MonthSummary,
} from "@/lib/finances";
import { tabTransition } from "@/lib/motion";
import { requestFinanceNotifications, tickFinanceReminders } from "@/hooks/useFinanceReminders";
import {
  shouldShowExpenseReminder,
  shouldShowSalaryReminder,
  useFinancesStore,
} from "@/store/useFinancesStore";
import type {
  ExpenseCategoryDef,
  FinanceBucket,
  FinanceData,
  FinanceExpense,
} from "@/types";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState, type ReactNode } from "react";

type View =
  | { kind: "root" }
  | { kind: "bucket"; bucket: FinanceBucket; month: string };

type SheetState =
  | { type: "salary" }
  | { type: "expense"; bucket?: Exclude<FinanceBucket, "savings">; id?: string }
  | { type: "bonus"; bucket?: FinanceBucket }
  | { type: "saving" }
  | null;

type DeleteState =
  | { kind: "expense"; id: string }
  | { kind: "bonus"; id: string }
  | null;

const desktopOverview =
  "flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-[minmax(18rem,min(32rem,42%))_minmax(0,1fr)] lg:items-start lg:gap-6";
const expenseList = "flex flex-col gap-2 2xl:grid 2xl:grid-cols-2 2xl:gap-3";

export function FinancesScreen() {
  const data = useFinancesStore();
  const [historyMonth, setHistoryMonth] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "root" });
  const [sheet, setSheet] = useState<SheetState>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const resetAll = useFinancesStore((state) => state.resetAll);
  const [notifyState, setNotifyState] = useState<NotificationPermission | "unsupported" | "idle">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );

  const activeMonth = historyMonth ?? currentMonthKey();
  const summary = useMemo(
    () => summarizeMonth(activeMonth, data),
    [activeMonth, data],
  );
  const months = useMemo(() => listHistoryMonths(data), [data]);
  const existingExpense =
    sheet?.type === "expense" && sheet.id
      ? (data.expenses.find((entry) => entry.id === sheet.id) ?? null)
      : null;

  const onHistoryList = view.kind === "root" && !historyMonth;
  const splitEnabled = data.splitEnabled;
  const showSalaryBanner = onHistoryList && shouldShowSalaryReminder(data);
  const showExpenseBanner = onHistoryList && shouldShowExpenseReminder(data);
  const showNotifyPrompt = onHistoryList && notifyState === "default";

  function setSplitEnabled(enabled: boolean) {
    data.setSplitEnabled(enabled);
    if (!enabled) setView({ kind: "root" });
  }

  function openBucket(bucket: FinanceBucket, month = activeMonth) {
    setView({ kind: "bucket", bucket, month });
  }

  function back() {
    if (view.kind === "bucket") {
      setView({ kind: "root" });
      return;
    }
    if (historyMonth) setHistoryMonth(null);
  }

  const title =
    view.kind === "bucket"
      ? bucketMeta(view.bucket).label
      : historyMonth
        ? monthTitleFromKey(historyMonth)
        : "Finansije";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <ScreenHeader
        title={title}
        onBack={view.kind !== "root" || historyMonth ? back : undefined}
        subtitle={
          onHistoryList ? (
            <p className="mt-1 text-[14px] text-ink-secondary">Istorija</p>
          ) : view.kind === "bucket" ? (
            <p className="mt-1 text-[14px] text-ink-secondary">
              {bucketMeta(view.bucket).percent} · {monthTitleFromKey(view.month)}
            </p>
          ) : null
        }
      />

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-5 md:px-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={
              view.kind === "bucket"
                ? `bucket-${view.bucket}-${view.month}`
                : historyMonth
                  ? `month-${historyMonth}-${splitEnabled ? "split" : "simple"}`
                  : "history"
            }
            className="mx-auto w-full min-w-0 max-w-xl lg:mx-0 lg:max-w-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={tabTransition}
          >
            {view.kind === "bucket" ? (
              <BucketDetail
                summary={summarizeMonth(view.month, data)}
                bucket={view.bucket}
                onAddExpense={(b) => setSheet({ type: "expense", bucket: b })}
                onEditExpense={(id) =>
                  setSheet({
                    type: "expense",
                    bucket: view.bucket === "savings" ? undefined : view.bucket,
                    id,
                  })
                }
                onAddBonus={() => setSheet({ type: "bonus", bucket: view.bucket })}
              />
            ) : historyMonth ? (
              splitEnabled ? (
                <MonthOverview
                  summary={summary}
                  splitEnabled={splitEnabled}
                  onSplitEnabled={setSplitEnabled}
                  onOpenBucket={(bucket) => openBucket(bucket, historyMonth)}
                  onExpense={() => setSheet({ type: "expense" })}
                  onBonus={() => setSheet({ type: "bonus" })}
                />
              ) : (
                <SimpleMonthOverview
                  summary={summary}
                  splitEnabled={splitEnabled}
                  onSplitEnabled={setSplitEnabled}
                  onExpense={() => setSheet({ type: "expense" })}
                  onBonus={() => setSheet({ type: "bonus" })}
                  onSave={() => setSheet({ type: "saving" })}
                  onEditExpense={(id) => setSheet({ type: "expense", id })}
                />
              )
            ) : (
              <HistoryList
                months={months}
                data={data}
                splitEnabled={splitEnabled}
                onOpen={(month) => setHistoryMonth(month)}
                onSalary={() => setSheet({ type: "salary" })}
                onReset={() => setResetOpen(true)}
                banners={
                  <>
                    {showSalaryBanner && (
                      <ReminderCard
                        title="Unesi platu"
                        body={`10. je u mesecu — unesi platu za ${monthTitleFromKey(currentMonthKey())}.`}
                        action="Unesi platu"
                        onAction={() => setSheet({ type: "salary" })}
                        onDismiss={() =>
                          data.dismissSalaryReminder(currentMonthKey())
                        }
                      />
                    )}
                    {showExpenseBanner && (
                      <ReminderCard
                        title="Unesi troškove"
                        body="Podsetnik: unesi sve današnje troškove ako već nisi."
                        action="Unesi trošak"
                        secondary="Nisam trošio"
                        onAction={() => setSheet({ type: "expense" })}
                        onSecondary={() => data.confirmNoSpendToday(todayKey())}
                        onDismiss={() =>
                          data.dismissExpenseReminder(todayKey())
                        }
                      />
                    )}
                    {showNotifyPrompt && (
                      <ReminderCard
                        title="Obaveštenja"
                        body="Uključi podsetnik 10. u mesecu za platu i svako veče u 22h za troškove."
                        action="Uključi"
                        onAction={async () => {
                          const result = await requestFinanceNotifications();
                          setNotifyState(result);
                          tickFinanceReminders();
                        }}
                      />
                    )}
                  </>
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <SalarySheet
        open={sheet?.type === "salary"}
        onClose={() => setSheet(null)}
        defaultMonth={activeMonth}
      />
      <ExpenseSheet
        open={sheet?.type === "expense"}
        onClose={() => setSheet(null)}
        bucket={sheet?.type === "expense" ? sheet.bucket : undefined}
        existing={existingExpense}
        simple={!splitEnabled}
        defaultMonth={
          view.kind === "bucket" ? view.month : (historyMonth ?? undefined)
        }
      />
      <BonusSheet
        open={sheet?.type === "bonus"}
        onClose={() => setSheet(null)}
        defaultBucket={sheet?.type === "bonus" ? sheet.bucket : undefined}
        simple={!splitEnabled}
        defaultMonth={
          view.kind === "bucket" ? view.month : (historyMonth ?? undefined)
        }
      />
      <SavingSheet
        open={sheet?.type === "saving"}
        onClose={() => setSheet(null)}
        month={activeMonth}
        remainingTotal={summary.totalWithBonus}
      />
      <FinanceConfirm
        open={resetOpen}
        title="Resetovati finansije?"
        body="Svi meseci, plate, troškovi, ušteđevina i bonus uplate biće obrisani. Ovo je za testiranje."
        confirmLabel="Resetuj"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          resetAll();
          setResetOpen(false);
          setSheet(null);
          setHistoryMonth(null);
          setView({ kind: "root" });
        }}
      />
    </div>
  );
}

function MonthOverview({
  summary,
  splitEnabled,
  onSplitEnabled,
  onOpenBucket,
  onExpense,
  onBonus,
}: {
  summary: MonthSummary;
  splitEnabled: boolean;
  onSplitEnabled: (enabled: boolean) => void;
  onOpenBucket: (bucket: FinanceBucket) => void;
  onExpense: () => void;
  onBonus: () => void;
}) {
  return (
    <div className={desktopOverview}>
      <div className="flex min-w-0 flex-col gap-4 lg:col-start-1">
        <SplitToggle enabled={splitEnabled} onChange={onSplitEnabled} />
        <BalanceCard summary={summary} />
      </div>
      <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-stretch">
        <SplitGraphic summary={summary} onOpen={onOpenBucket} />
      </div>
      <div className="grid grid-cols-2 gap-2 lg:col-start-1">
        <button
          type="button"
          onClick={onExpense}
          className="pressable flex min-h-12 items-center justify-center rounded-2xl bg-surface text-[15px] font-semibold shadow-[var(--shadow-card)]"
        >
          Unesi trošak
        </button>
        <button
          type="button"
          onClick={onBonus}
          className="pressable flex min-h-12 items-center justify-center rounded-2xl bg-surface text-[15px] font-semibold shadow-[var(--shadow-card)]"
        >
          Uplata van plate
        </button>
      </div>
    </div>
  );
}

function SimpleMonthOverview({
  summary,
  splitEnabled,
  onSplitEnabled,
  onExpense,
  onBonus,
  onSave,
  onEditExpense,
}: {
  summary: MonthSummary;
  splitEnabled: boolean;
  onSplitEnabled: (enabled: boolean) => void;
  onExpense: () => void;
  onBonus: () => void;
  onSave: () => void;
  onEditExpense: (id: string) => void;
}) {
  const categories = useFinancesStore((state) => state.categories);
  const deleteExpense = useFinancesStore((state) => state.deleteExpense);
  const deleteBonus = useFinancesStore((state) => state.deleteBonus);
  const deleteSaving = useFinancesStore((state) => state.deleteSaving);
  const [pending, setPending] = useState<
    DeleteState | { kind: "saving"; month: string }
  >(null);
  const spentCats = categories
    .filter((cat) => (summary.spentByCategory[cat.id] ?? 0) > 0)
    .sort(
      (a, b) =>
        (summary.spentByCategory[b.id] ?? 0) -
        (summary.spentByCategory[a.id] ?? 0),
    );
  const spentMax = Math.max(
    ...spentCats.map((entry) => summary.spentByCategory[entry.id] ?? 0),
    1,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className={desktopOverview}>
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:sticky lg:top-0">
          <SplitToggle enabled={splitEnabled} onChange={onSplitEnabled} />
          <SimpleBalanceCard summary={summary} onEditSaving={onSave} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onExpense}
              className="pressable flex min-h-12 items-center justify-center rounded-2xl bg-accent text-[16px] font-semibold text-accent-fg"
            >
              Unesi trošak
            </button>
            <button
              type="button"
              onClick={onSave}
              className="pressable flex min-h-12 items-center justify-center rounded-2xl bg-surface text-[15px] font-semibold shadow-[var(--shadow-card)]"
            >
              Uštedi
            </button>
          </div>
          <button
            type="button"
            onClick={onBonus}
            className="pressable flex min-h-12 items-center justify-center rounded-2xl bg-surface text-[15px] font-semibold shadow-[var(--shadow-card)]"
          >
            Uplata van plate
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-2">
          {spentCats.length > 0 && (
            <div className="card rounded-[22px] px-4 py-4">
              <p className="mb-3 text-[13px] font-medium text-ink-secondary">
                Promet po kategoriji
              </p>
              <div className="flex flex-col gap-3">
                {spentCats.map((cat) => {
                  const value = summary.spentByCategory[cat.id] ?? 0;
                  return (
                    <div key={cat.id}>
                      <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
                        <span>{cat.label}</span>
                        <span className="tabular-nums text-ink-secondary">
                          {formatRsd(value)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-accent/70"
                          style={{
                            width: `${Math.round((value / spentMax) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {summary.expenses.length === 0 && summary.bonuses.length === 0 ? (
            <p className="px-2 py-6 text-center text-[14px] text-ink-secondary lg:py-16">
              Nema unetih troškova. Unesi trošak ili uštedi deo novca.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <GroupedExpenseList
                expenses={summary.expenses}
                categories={categories}
                onEditExpense={onEditExpense}
                onDeleteExpense={(id) =>
                  setPending({ kind: "expense", id })
                }
              />
              {summary.bonuses.length > 0 && (
                <div className={expenseList}>
                  {summary.bonuses.map((entry) => (
                    <div
                      key={entry.id}
                      className="card flex items-center gap-3 rounded-[20px] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium">Bonus uplata</p>
                        <p className="text-[12px] text-ink-secondary">
                          {formatExpenseDate(entry.date)}
                        </p>
                      </div>
                      <p className="text-[15px] font-semibold tabular-nums text-accent">
                        +{formatRsd(entry.amount)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setPending({ kind: "bonus", id: entry.id })
                        }
                        className="pressable text-[13px] text-danger"
                      >
                        Obriši
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {summary.lockedSavings > 0 && (
            <button
              type="button"
              onClick={() => setPending({ kind: "saving", month: summary.month })}
              className="pressable text-center text-[13px] font-medium text-danger"
            >
              Otključaj ušteđevinu
            </button>
          )}
        </div>
      </div>

      <FinanceConfirm
        open={pending !== null}
        title={
          pending?.kind === "bonus"
            ? "Obrisati uplatu?"
            : pending?.kind === "saving"
              ? "Otključati ušteđevinu?"
              : "Obrisati trošak?"
        }
        body={
          pending?.kind === "saving"
            ? "Zaključani iznos će se vratiti u ukupan novac za ovaj mesec."
            : "Stavka će biti uklonjena iz ovog meseca."
        }
        confirmLabel={pending?.kind === "saving" ? "Otključaj" : "Obriši"}
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === "expense") deleteExpense(pending.id);
          if (pending?.kind === "bonus") deleteBonus(pending.id);
          if (pending?.kind === "saving") deleteSaving(pending.month);
          setPending(null);
        }}
      />
    </div>
  );
}

function SplitToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="card flex items-center gap-3 rounded-[22px] px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">50 / 30 / 20</p>
        <p className="mt-0.5 text-[13px] leading-5 text-ink-secondary">
          {enabled
            ? "Podela plate na housings, funnymoney i ušteđevinu"
            : "Jedan budžet — ukupan novac, troškovi i ušteda"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Podela 50/30/20"
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200",
          enabled ? "bg-accent" : "bg-surface-2",
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 size-6 rounded-full bg-surface shadow-[var(--shadow-card)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            enabled && "translate-x-[20px]",
          )}
        />
      </button>
    </div>
  );
}

function SimpleBalanceCard({
  summary,
  onEditSaving,
}: {
  summary: MonthSummary;
  onEditSaving: () => void;
}) {
  return (
    <div className="card rounded-[28px] px-5 py-6">
      <p className="text-[13px] font-medium text-ink-secondary">Ukupno ostalo</p>
      <p
        className={cn(
          "mt-1 font-display text-[40px] font-semibold leading-[0.95] tracking-[-0.03em] tabular-nums",
          summary.remainingSpendable < 0 && "text-danger",
        )}
      >
        {formatRsd(summary.remainingSpendable)}
      </p>
      <div className="mt-4 space-y-1.5 text-[15px]">
        <p className="flex items-baseline justify-between gap-3">
          <span className="text-ink-secondary">Plata</span>
          <span className="font-semibold tabular-nums">
            {formatRsd(summary.salary)}
          </span>
        </p>
        <p className="flex items-baseline justify-between gap-3">
          <span className="text-ink-secondary">Bonus uplate</span>
          <span className="font-semibold tabular-nums">
            {formatRsd(summary.totalBonus)}
          </span>
        </p>
        <p className="flex items-baseline justify-between gap-3">
          <span className="text-ink-secondary">Troškovi</span>
          <span className="font-semibold tabular-nums">
            −{formatRsd(summary.totalSpent)}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onEditSaving}
        className="relative mt-5 w-full overflow-hidden rounded-2xl bg-ink/8 px-4 py-4 text-left ring-1 ring-ink/10"
      >
        <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_10px,color-mix(in_srgb,var(--ink)_6%,transparent)_10px_11px)]" />
        <span className="relative flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[13px] font-medium text-ink-secondary">
            <IconLock className="size-4" />
            Ušteđevina · zaključano
          </span>
          <span className="font-display text-[20px] font-semibold tabular-nums text-ink-secondary">
            {formatRsd(summary.lockedSavings)}
          </span>
        </span>
      </button>
    </div>
  );
}

function HistoryList({
  months,
  data,
  splitEnabled,
  onOpen,
  onSalary,
  onReset,
  banners,
}: {
  months: string[];
  data: FinanceData;
  splitEnabled: boolean;
  onOpen: (month: string) => void;
  onSalary: () => void;
  onReset: () => void;
  banners?: ReactNode;
}) {
  const deleteMonth = useFinancesStore((state) => state.deleteMonth);
  const [pendingMonth, setPendingMonth] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {banners}
      {months.length === 0 ? (
        <p className="px-2 py-16 text-center text-[15px] text-ink-secondary">
          Još nema sačuvanih meseci. Unesi prvu platu pa će se ovde pojaviti
          istorija.
        </p>
      ) : (
        <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-3">
          {months.map((month) => {
            const summary = summarizeMonth(month, data);
            return (
              <div
                key={month}
                className="card flex min-w-0 items-center gap-3 rounded-[22px] px-4 py-4"
              >
                <button
                  type="button"
                  onClick={() => onOpen(month)}
                  className="pressable flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[20px] font-semibold tracking-[-0.02em]">
                      {monthTitleFromKey(month)}
                    </p>
                    <p className="mt-0.5 text-[13px] text-ink-secondary">
                      Plata {formatRsd(summary.salary)}
                      {!splitEnabled && summary.lockedSavings > 0
                        ? ` · ušteđevina ${formatRsd(summary.lockedSavings)}`
                        : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-right text-[15px] font-semibold tabular-nums">
                    {formatRsd(
                      splitEnabled
                        ? summary.totalWithBonus
                        : summary.remainingSpendable,
                    )}
                  </p>
                  <IconChevron className="size-4 shrink-0 rotate-180 text-ink-tertiary" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingMonth(month)}
                  className="pressable shrink-0 whitespace-nowrap text-[13px] text-danger"
                >
                  Obriši mesec
                </button>
              </div>
            );
          })}
        </div>
      )}
      <FinanceConfirm
        open={pendingMonth !== null}
        title="Obrisati mesec?"
        body={`Plata, troškovi, ušteđevina i bonus uplate za ${pendingMonth ? monthTitleFromKey(pendingMonth) : "ovaj mesec"} biće uklonjeni.`}
        confirmLabel="Obriši"
        danger
        onCancel={() => setPendingMonth(null)}
        onConfirm={() => {
          if (pendingMonth) deleteMonth(pendingMonth);
          setPendingMonth(null);
        }}
      />
      <button
        type="button"
        onClick={onSalary}
        className="pressable flex min-h-12 items-center justify-center rounded-2xl bg-accent text-[16px] font-semibold text-accent-fg lg:min-w-[240px] lg:self-start lg:px-8"
      >
        Unesi platu
      </button>
      <button
        type="button"
        onClick={onReset}
        className="pressable flex min-h-11 items-center justify-center rounded-2xl text-[13px] font-medium text-danger lg:self-start"
      >
        Resetuj sve podatke
      </button>
    </div>
  );
}

function BalanceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p className="flex items-baseline justify-between gap-3">
      <span className="text-ink-secondary">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </p>
  );
}

function BalanceCard({ summary }: { summary: MonthSummary }) {
  return (
    <div className="card rounded-[28px] px-5 py-6">
      <p className="text-[13px] font-medium text-ink-secondary">
        Ostalo od plate
      </p>
      <p
        className={cn(
          "mt-1 font-display text-[40px] font-semibold leading-[0.95] tracking-[-0.03em] tabular-nums",
          summary.leftoverSalary < 0 && "text-danger",
        )}
      >
        {formatRsd(summary.leftoverSalary)}
      </p>
      <div className="mt-4 space-y-1.5 text-[15px]">
        <BalanceRow label="Ukupna plata" value={formatRsd(summary.salary)} />
        <BalanceRow
          label="Bonus uplate"
          value={formatRsd(summary.totalBonus)}
        />
        <BalanceRow
          label="Ukupno sa bonus"
          value={formatRsd(summary.totalWithBonus)}
        />
        <BalanceRow
          label="Troškovi"
          value={`−${formatRsd(summary.totalSpent)}`}
        />
      </div>
      <div className="mt-5 pt-5 hairline-t">
        <p className="text-[13px] font-medium text-ink-secondary">
          Bez ušteđevine ostalo
        </p>
        <p
          className={cn(
            "mt-1 font-display text-[40px] font-semibold leading-[0.95] tracking-[-0.03em] tabular-nums",
            summary.cardsRemaining < 0 && "text-danger",
          )}
        >
          {formatRsd(summary.cardsRemaining)}
        </p>
      </div>
    </div>
  );
}

function SplitGraphic({
  summary,
  onOpen,
}: {
  summary: MonthSummary;
  onOpen: (bucket: FinanceBucket) => void;
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <p className="mb-2 px-1 text-[13px] font-medium text-ink-secondary">
        Budžet 50 / 30 / 20
      </p>
      <div className="flex h-[108px] min-w-0 overflow-hidden rounded-[22px] bg-surface-2 lg:h-full lg:min-h-[280px]">
        {BUCKETS.map((bucket, index) => {
          const allocated =
            summary.alloc[bucket.id] + summary.bonusByBucket[bucket.id];
          const remaining = summary.remainingByBucket[bucket.id];
          const fill =
            allocated > 0
              ? Math.max(0, Math.min(1, remaining / allocated))
              : 0;
          const Icon = bucket.id === "savings" ? IconLock : IconCard;
          return (
            <button
              key={bucket.id}
              type="button"
              onClick={() => onOpen(bucket.id)}
              aria-label={`${bucket.label}, ostalo ${formatRsd(remaining)}`}
              className={cn(
                "relative flex min-w-0 flex-col items-center justify-center gap-1 overflow-hidden px-1.5",
                bucket.id === "needs" && "flex-[5] bg-accent/14",
                bucket.id === "wants" && "flex-[3] bg-accent/8",
                bucket.id === "savings" && "flex-[2] bg-ink/8",
                index > 0 && "shadow-[-0.5px_0_0_0_var(--hairline)]",
              )}
            >
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 transition-[height] duration-300",
                  bucket.id === "savings" ? "bg-ink/22" : "bg-accent/40",
                )}
                style={{ height: `${Math.round(fill * 100)}%` }}
              />
              {bucket.id === "savings" && (
                <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_srgb,var(--ink)_8%,transparent)_6px_7px)]" />
              )}
              <Icon className="relative size-4 text-ink lg:size-6" />
              <span
                className={cn(
                  "relative max-w-full truncate font-display text-[15px] font-semibold leading-none tracking-[-0.03em] tabular-nums lg:text-[22px]",
                  remaining < 0 && "text-danger",
                  bucket.id === "savings" && remaining >= 0 && "text-ink-secondary",
                )}
              >
                {formatRsdNumber(remaining)}
              </span>
              <span className="relative max-w-full truncate text-[10px] font-medium leading-none text-ink-secondary lg:text-[12px]">
                {bucket.percent} · {bucket.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BucketDetail({
  summary,
  bucket,
  onAddExpense,
  onEditExpense,
  onAddBonus,
}: {
  summary: MonthSummary;
  bucket: FinanceBucket;
  onAddExpense: (bucket: Exclude<FinanceBucket, "savings">) => void;
  onEditExpense: (id: string) => void;
  onAddBonus: () => void;
}) {
  const remaining = summary.remainingByBucket[bucket];
  const spent = summary.spentByBucket[bucket];
  const allocated = summary.alloc[bucket] + summary.bonusByBucket[bucket];
  const fill =
    allocated > 0 ? Math.max(0, Math.min(1, remaining / allocated)) : 0;
  const locked = bucket === "savings";
  const categories = useFinancesStore((state) => state.categories);
  const cats = categoriesForBucket(bucket, categories).sort(
    (a, b) =>
      (summary.spentByCategory[b.id] ?? 0) -
      (summary.spentByCategory[a.id] ?? 0),
  );
  const expenses = summary.expenses.filter((entry) =>
    categories.some((cat) => cat.id === entry.category && cat.bucket === bucket),
  );
  const bonuses = summary.bonuses.filter((entry) => entry.bucket === bucket);
  const deleteExpense = useFinancesStore((state) => state.deleteExpense);
  const deleteBonus = useFinancesStore((state) => state.deleteBonus);
  const [pending, setPending] = useState<DeleteState>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className={desktopOverview}>
        <div className="flex min-w-0 flex-col gap-4 lg:col-start-1 lg:sticky lg:top-0">
          <div
            className={cn(
              "card relative overflow-hidden rounded-[28px] px-5 py-6",
              locked && "ring-1 ring-ink/10",
            )}
          >
            {locked && (
              <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0_10px,color-mix(in_srgb,var(--ink)_6%,transparent)_10px_11px)]" />
            )}
            <div className="relative">
              <p className="flex items-center gap-2 text-[13px] font-medium text-ink-secondary">
                {locked && <IconLock className="size-4" />}
                {locked ? "Zaključano — ne troši se" : "Ostalo"}
              </p>
              <p
                className={cn(
                  "mt-1 font-display text-[36px] font-semibold leading-[0.95] tracking-[-0.03em] tabular-nums",
                  remaining < 0 && "text-danger",
                  locked && "text-ink-secondary",
                )}
              >
                {formatRsd(remaining)}
              </p>
              <p className="mt-3 text-[14px] text-ink-secondary">
                Promet:{" "}
                <span className="font-semibold tabular-nums text-ink">
                  {formatRsd(spent)}
                </span>
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    "h-full rounded-full",
                    locked ? "bg-ink/35" : remaining < 0 ? "bg-danger" : "bg-accent",
                  )}
                  style={{ width: `${Math.round(fill * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] text-ink-tertiary">
                Od plate {formatRsd(summary.alloc[bucket])}
                {summary.bonusByBucket[bucket] > 0
                  ? ` · bonus ${formatRsd(summary.bonusByBucket[bucket])}`
                  : ""}
              </p>
            </div>
          </div>

          {cats.length > 0 && (
            <div className="card rounded-[22px] px-4 py-4">
              <p className="mb-3 text-[13px] font-medium text-ink-secondary">
                Promet po kategoriji
              </p>
              <div className="flex flex-col gap-3">
                {cats.map((cat) => {
                  const value = summary.spentByCategory[cat.id];
                  const max = Math.max(
                    ...cats.map((entry) => summary.spentByCategory[entry.id]),
                    1,
                  );
                  return (
                    <div key={cat.id}>
                      <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
                        <span>{cat.label}</span>
                        <span className="tabular-nums text-ink-secondary">
                          {formatRsd(value)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-accent/70"
                          style={{
                            width: `${Math.round((value / max) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {bucket !== "savings" && (
            <button
              type="button"
              onClick={() => onAddExpense(bucket)}
              className="pressable flex min-h-12 items-center justify-center rounded-2xl bg-accent text-[16px] font-semibold text-accent-fg"
            >
              Unesi trošak
            </button>
          )}
          <button
            type="button"
            onClick={onAddBonus}
            className="pressable flex min-h-12 items-center justify-center rounded-2xl bg-surface text-[15px] font-semibold shadow-[var(--shadow-card)]"
          >
            Uplata van plate
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:col-start-2">
          {expenses.length === 0 && bonuses.length === 0 ? (
            <p className="px-2 py-6 text-center text-[14px] text-ink-secondary lg:py-16">
              {locked
                ? "Ušteđevina je zaključana. Bonus uplate ovde ostaju sačuvane."
                : "Nema prometa u ovoj grupi."}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <GroupedExpenseList
                expenses={expenses}
                categories={categories}
                onEditExpense={onEditExpense}
                onDeleteExpense={(id) =>
                  setPending({ kind: "expense", id })
                }
              />
              {bonuses.length > 0 && (
                <div className={expenseList}>
                  {bonuses.map((entry) => (
                    <div
                      key={entry.id}
                      className="card flex items-center gap-3 rounded-[20px] px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium">Bonus uplata</p>
                        <p className="text-[12px] text-ink-secondary">
                          {formatExpenseDate(entry.date)}
                        </p>
                      </div>
                      <p className="text-[15px] font-semibold tabular-nums text-accent">
                        +{formatRsd(entry.amount)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setPending({ kind: "bonus", id: entry.id })
                        }
                        className="pressable text-[13px] text-danger"
                      >
                        Obriši
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <FinanceConfirm
        open={pending !== null}
        title={pending?.kind === "bonus" ? "Obrisati uplatu?" : "Obrisati trošak?"}
        body="Stavka će biti uklonjena iz ovog meseca."
        confirmLabel="Obriši"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === "expense") deleteExpense(pending.id);
          if (pending?.kind === "bonus") deleteBonus(pending.id);
          setPending(null);
        }}
      />
    </div>
  );
}

function GroupedExpenseList({
  expenses,
  categories,
  onEditExpense,
  onDeleteExpense,
}: {
  expenses: FinanceExpense[];
  categories: readonly ExpenseCategoryDef[];
  onEditExpense: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}) {
  const groups = useMemo(() => groupByDate(expenses), [expenses]);
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => {
        const total = group.items.reduce((sum, entry) => sum + entry.amount, 0);
        return (
          <section key={group.date}>
            <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
              <h2 className="text-[13px] font-medium text-ink-secondary">
                {expenseDateHeading(group.date)}
              </h2>
              <p className="text-[13px] tabular-nums text-ink-secondary">
                −{formatRsd(total)}
              </p>
            </div>
            <div className={expenseList}>
              {group.items.map((entry) => (
                <ExpenseRow
                  key={entry.id}
                  expense={entry}
                  label={categoryMeta(entry.category, categories).label}
                  onOpen={() => onEditExpense(entry.id)}
                  onDelete={() => onDeleteExpense(entry.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ExpenseRow({
  expense,
  label,
  onOpen,
  onDelete,
}: {
  expense: FinanceExpense;
  label: string;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card flex items-center gap-3 rounded-[20px] px-4 py-3">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="text-[15px] font-medium">{label}</p>
      </button>
      <p className="text-[15px] font-semibold tabular-nums">
        −{formatRsd(expense.amount)}
      </p>
      <button
        type="button"
        onClick={onDelete}
        className="pressable text-[13px] text-danger"
      >
        Obriši
      </button>
    </div>
  );
}

function ReminderCard({
  title,
  body,
  action,
  secondary,
  onAction,
  onSecondary,
  onDismiss,
}: {
  title: string;
  body: string;
  action: string;
  secondary?: string;
  onAction: () => void;
  onSecondary?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="rounded-[22px] bg-accent/10 px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
          <IconBell className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold">{title}</p>
          <p className="mt-0.5 text-[13px] leading-5 text-ink-secondary">
            {body}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onAction}
              className="pressable min-h-9 rounded-full bg-accent px-3.5 text-[13px] font-semibold text-accent-fg"
            >
              {action}
            </button>
            {secondary && onSecondary && (
              <button
                type="button"
                onClick={onSecondary}
                className="pressable min-h-9 rounded-full bg-surface px-3.5 text-[13px] font-medium"
              >
                {secondary}
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="pressable min-h-9 rounded-full px-3 text-[13px] text-ink-secondary"
              >
                Kasnije
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
