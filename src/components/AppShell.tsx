import { Sidebar } from "@/components/Sidebar";
import { TabBar } from "@/components/TabBar";
import { BrandLockup } from "@/components/ThemeToggle";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden bg-canvas text-ink">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="px-5 pt-[max(12px,env(safe-area-inset-top))] md:hidden">
          <BrandLockup />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </div>
        <TabBar />
      </div>
    </div>
  );
}
