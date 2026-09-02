import { IconChevron } from "@/components/icons";
import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  subtitle,
  actions,
  onBack,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <header className="shrink-0 px-5 pt-3 md:px-8 md:pt-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-h-11 items-center gap-1">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Nazad"
                className="icon-btn -ml-2 shrink-0"
              >
                <IconChevron className="size-5" />
              </button>
            ) : null}
            <h1 className="page-title flex min-h-11 min-w-0 items-center truncate">{title}</h1>
          </div>
          {subtitle}
        </div>
        {actions ? (
          <div className="flex min-h-11 shrink-0 items-center">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
