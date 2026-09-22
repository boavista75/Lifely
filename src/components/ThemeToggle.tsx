import { AccountMenu } from "@/components/AccountMenu";
import { text } from "@/i18n";
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
      aria-label={dark ? text("theme.light") : text("theme.dark")}
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
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <span className="page-title flex h-12 w-full items-center overflow-visible">Lifely</span>
      <div className="flex shrink-0 items-center gap-1">
        <AccountMenu />
        <AppearanceButton />
        <ThemeToggle />
      </div>
    </div>
  );
}
