import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="shrink-0 px-5 pt-3 md:px-8 md:pt-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title flex min-h-11 items-center">{title}</h1>
          {subtitle}
        </div>
        {actions ? (
          <div className="flex min-h-11 shrink-0 items-center">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
