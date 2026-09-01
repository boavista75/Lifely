import { todayKey } from "@/lib/dates";
import {
  currentMonthKey,
  isDayLogged,
  monthTitleFromKey,
  nextDailyReminderAt,
  nextSalaryReminderAt,
  salaryForMonth,
} from "@/lib/finances";
import { useFinancesStore } from "@/store/useFinancesStore";
import { useEffect } from "react";

const SALARY_TAG = "lifely-salary";
const EXPENSE_TAG = "lifely-expense";

async function showNotice(title: string, body: string, tag: string): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker?.ready.catch(() => undefined);
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        tag,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      });
      return true;
    }
  } catch {
    // Fall through to the page Notification API.
  }
  try {
    new Notification(title, { body, tag, icon: "/icon-192.png" });
    return true;
  } catch {
    return false;
  }
}

export function tickFinanceReminders() {
  const data = useFinancesStore.getState();
  const now = new Date();
  const month = currentMonthKey();
  const date = todayKey();

  if (
    now.getDate() >= 10 &&
    !salaryForMonth(data, month) &&
    data.salaryNotifiedMonth !== month
  ) {
    void showNotice(
      "Unesi platu",
      `10. je u mesecu — unesi platu za ${monthTitleFromKey(month)}.`,
      SALARY_TAG,
    ).then((shown) => {
      if (
        shown ||
        (typeof Notification !== "undefined" && Notification.permission === "denied")
      ) {
        useFinancesStore.getState().markSalaryNotified(month);
      }
    });
  }

  if (
    now.getHours() >= 22 &&
    !isDayLogged(data, date) &&
    data.expenseNotifiedDate !== date
  ) {
    void showNotice(
      "Unesi troškove",
      "Podsetnik: unesi sve današnje troškove ako već nisi.",
      EXPENSE_TAG,
    ).then((shown) => {
      if (
        shown ||
        (typeof Notification !== "undefined" && Notification.permission === "denied")
      ) {
        useFinancesStore.getState().markExpenseNotified(date);
      }
    });
  }
}

export async function requestFinanceNotifications(): Promise<NotificationPermission | "unsupported"> {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function useFinanceReminders() {
  useEffect(() => {
    tickFinanceReminders();
    const interval = window.setInterval(tickFinanceReminders, 60_000);
    const salaryTimer = window.setTimeout(
      tickFinanceReminders,
      nextSalaryReminderAt().getTime() - Date.now(),
    );
    const expenseTimer = window.setTimeout(
      tickFinanceReminders,
      nextDailyReminderAt(22).getTime() - Date.now(),
    );
    const onVisible = () => {
      if (document.visibilityState === "visible") tickFinanceReminders();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(salaryTimer);
      window.clearTimeout(expenseTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
