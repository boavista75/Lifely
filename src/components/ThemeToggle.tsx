import { AppearanceButton } from "@/components/AppearanceButton";
import { IconMoon, IconSun } from "@/components/icons";
import { cn } from "@/lib/cn";
import { useThemeStore } from "@/store/useThemeStore";

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Uključi svetlu temu" : "Uključi tamnu temu"}
      onClick={toggleTheme}
      className="relative h-8 w-[52px] shrink-0 rounded-full bg-surface-2"
    >
      <span
        className={cn(
          "absolute top-1 left-1 grid size-6 place-items-center rounded-full bg-surface text-ink shadow-[var(--shadow-card)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
          dark && "translate-x-[20px]",
        )}
      >
        {dark ? (
          <IconMoon className="size-3.5" />
        ) : (
          <IconSun className="size-3.5" />
        )}
      </span>
    </button>
  );
}

export function BrandLockup() {
  return (
    <div className="flex min-h-11 min-w-0 items-center justify-between gap-3">
      <span className="page-title min-w-0 truncate">Lifely</span>
      <div className="flex shrink-0 items-center gap-1">
        <AppearanceButton />
        <ThemeToggle />
      </div>
    </div>
  );
}
