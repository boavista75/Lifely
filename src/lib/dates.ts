import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { srLatn } from "date-fns/locale/sr-Latn";
import { getLocale, type Locale } from "@/i18n/locale";

export const WEEK_STARTS_ON = 1 as const;

const weekOptions = { weekStartsOn: WEEK_STARTS_ON };

function dateLocale(locale: Locale = getLocale()) {
  return locale === "en" ? enUS : srLatn;
}

export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Today if it falls in `month` (`yyyy-MM`), otherwise the 1st of that month. */
export function dateKeyInMonth(month: string, now = new Date()): string {
  const today = toDateKey(now);
  if (today.startsWith(month)) return today;
  return `${month}-01`;
}

export function isDateKeyToday(key: string): boolean {
  return key === todayKey();
}

export function monthTitle(date: Date): string {
  return capitalize(format(date, "LLLL yyyy", { locale: dateLocale() }));
}

export function monthName(date: Date): string {
  return capitalize(format(date, "LLLL", { locale: dateLocale() }));
}

export function fullDateTitle(date: Date): string {
  const locale = getLocale();
  const pattern = locale === "en" ? "EEEE, MMMM d" : "EEEE, d. MMMM";
  return capitalize(format(date, pattern, { locale: dateLocale(locale) }));
}

export function shortMonthDay(date: Date): string {
  const locale = getLocale();
  const pattern = locale === "en" ? "MMM d" : "d. MMM";
  return format(date, pattern, { locale: dateLocale(locale) });
}

export function weekdayShort(date: Date): string {
  return capitalize(format(date, "EEE", { locale: dateLocale() }));
}

export function weekdayLetters(): string[] {
  return getLocale() === "en"
    ? ["M", "T", "W", "T", "F", "S", "S"]
    : ["P", "U", "S", "Č", "P", "S", "N"];
}

export function weekdayLetter(day: Date): string {
  const letters =
    getLocale() === "en"
      ? ["S", "M", "T", "W", "T", "F", "S"]
      : ["N", "P", "U", "S", "Č", "P", "S"];
  return letters[day.getDay()] ?? "";
}

export function getMonthGrid(cursor: Date): Date[] {
  const start = startOfWeek(startOfMonth(cursor), weekOptions);
  return eachDayOfInterval({ start, end: addDays(start, 41) });
}

export function getWeekDays(cursor: Date): Date[] {
  const start = startOfWeek(cursor, weekOptions);
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

export function monthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function weekKey(date: Date): string {
  return toDateKey(startOfWeek(date, weekOptions));
}

export function shiftMonth(date: Date, amount: number): Date {
  return addMonths(date, amount);
}

export function shiftWeek(date: Date, amount: number): Date {
  return addWeeks(date, amount);
}

export function sameDay(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

export function sameMonth(a: Date, b: Date): boolean {
  return isSameMonth(a, b);
}

export function dayIsToday(date: Date): boolean {
  return isToday(date);
}

export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function nextDateKey(key: string): string {
  return toDateKey(addDays(parseDateKey(key), 1));
}

export function noteCreatedTitle(date: Date, locale: Locale = getLocale()): string {
  const dateFnsLocale = dateLocale(locale);
  const time = format(date, "HH:mm", { locale: dateFnsLocale });
  if (locale === "en") {
    return `${format(date, "MMMM d", { locale: dateFnsLocale })} - ${time}`;
  }
  const day = format(date, "d.", { locale: dateFnsLocale });
  const month = capitalize(format(date, "LLLL", { locale: dateFnsLocale }));
  return `${day} ${month} - ${time}h`;
}
