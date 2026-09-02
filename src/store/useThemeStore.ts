import {
  applyTheme,
  loadPalette,
  loadTheme,
  savePalette,
  saveTheme,
  type Theme,
} from "@/lib/storage";
import type { PaletteId } from "@/lib/palettes";
import { create } from "zustand";

type ThemeState = {
  theme: Theme;
  palette: PaletteId;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: PaletteId) => void;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: loadTheme(),
  palette: loadPalette(),
  setTheme: (theme) => {
    saveTheme(theme);
    applyTheme(theme, get().palette);
    set({ theme });
  },
  setPalette: (palette) => {
    savePalette(palette);
    applyTheme(get().theme, palette);
    set({ palette });
  },
  toggleTheme: () => {
    get().setTheme(get().theme === "dark" ? "light" : "dark");
  },
}));

applyTheme(useThemeStore.getState().theme, useThemeStore.getState().palette);
