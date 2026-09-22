import { create } from "zustand";

export type Locale = "sr" | "en";

const LOCALE_KEY = "lifely-locale";

function readStoredLocale(): Locale {
  try {
    return localStorage.getItem(LOCALE_KEY) === "en" ? "en" : "sr";
  } catch {
    return "sr";
  }
}

function applyDocumentLocale(locale: Locale): void {
  document.documentElement.lang = locale === "en" ? "en" : "sr-Latn";
}

let currentLocale = readStoredLocale();
applyDocumentLocale(currentLocale);

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: currentLocale,
  setLocale: (locale) => {
    currentLocale = locale;
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // The language still applies for this visit.
    }
    applyDocumentLocale(locale);
    set({ locale });
  },
}));

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  useLocaleStore.getState().setLocale(locale);
}

export function isLocale(value: unknown): value is Locale {
  return value === "sr" || value === "en";
}
