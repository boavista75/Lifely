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
import { srLatn } from "date-fns/locale/sr-Latn";

export const WEEK_STARTS_ON = 1 as const;

const locale = srLatn;
const weekOptions = { weekStartsOn: WEEK_STARTS_ON, locale };

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

export function isDateKeyToday(key: string): boolean {
  return key === todayKey();
}

export function monthTitle(date: Date): string {
  return capitalize(format(date, "LLLL yyyy", { locale }));
}

export function fullDateTitle(date: Date): string {
  return capitalize(format(date, "EEEE, d. MMMM", { locale }));
}

export function shortMonthDay(date: Date): string {
  return format(date, "d. MMM", { locale });
}

export function weekdayShort(date: Date): string {
  return capitalize(format(date, "EEE", { locale }));
}

export const WEEKDAY_LETTERS = ["P", "U", "S", "Č", "P", "S", "N"] as const;

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

export function noteCreatedTitle(date: Date): string {
  const day = format(date, "d.", { locale });
  const month = capitalize(format(date, "LLLL", { locale }));
  const time = format(date, "HH:mm", { locale });
  return `${day} ${month} - ${time}h`;
}
