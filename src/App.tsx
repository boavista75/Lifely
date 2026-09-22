import { AppShell } from "@/components/AppShell";
import { text, useLocaleStore } from "@/i18n";
import { AuthScreen } from "@/components/AuthScreen";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DaySheet } from "@/components/DaySheet";
import { ItemSheet } from "@/components/ItemSheet";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useCloudStore } from "@/lib/cloud";
import { useContentGate } from "@/hooks/useContentGate";
import { useFinanceReminders } from "@/hooks/useFinanceReminders";
import { isProfilePath } from "@/lib/profile";
import { CalendarScreen } from "@/screens/CalendarScreen";
import { FinancesScreen } from "@/screens/FinancesScreen";
import { KnowledgeScreen } from "@/screens/KnowledgeScreen";
import { NotesScreen } from "@/screens/NotesScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { TodoScreen } from "@/screens/TodoScreen";
import { useBootStore } from "@/store/useBootStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useUiStore } from "@/store/useUiStore";
import type { TabId } from "@/types";
import { useEffect } from "react";

export default function App() {
  useLocaleStore((state) => state.locale);
  const profile = isProfilePath();
  const phase = useSessionStore((state) => state.phase);
  const message = useSessionStore((state) => state.message);
  const restore = useSessionStore((state) => state.restore);
  const ready = useBootStore((state) => state.ready);
  const cloudMessage = useCloudStore((state) =>
    state.status === "error" ? state.message : "",
  );

  useEffect(() => {
    void restore();
  }, [restore]);

  if (phase === "checking" || phase === "booting") {
    return <Boot label={message || text("boot.loading")} />;
  }
  if (phase === "anon" || phase === "offline") return <AuthScreen />;
  if (profile) return <ProfileScreen />;
  if (phase === "error" || !ready) {
    return (
      <Boot
        label={message || text("boot.failed")}
        action={text("boot.retry")}
        onAction={() => void restore()}
      />
    );
  }

  return (
    <AppShell>
      {cloudMessage ? (
        <p className="pointer-events-none absolute inset-x-0 top-2 z-40 text-center text-[13px] font-semibold text-danger">
          {cloudMessage}
        </p>
      ) : null}
      <TabPane ready={ready} />
      <FinanceReminders />
      <DaySheet />
      <ItemSheet />
      <ConfirmDialog />
    </AppShell>
  );
}

function FinanceReminders() {
  useFinanceReminders();
  return null;
}

function TabPane({ ready }: { ready: boolean }) {
  const tab = useUiStore((state) => state.tab);
  const contentReady = useContentGate(tab, ready);

  return (
    <div className="relative h-full min-h-0" aria-busy={!contentReady}>
      {contentReady ? (
        <div className="h-full min-h-0">
          <TabScreen tab={tab} />
        </div>
      ) : (
        <LoadingScreen />
      )}
    </div>
  );
}

function TabScreen({ tab }: { tab: TabId }) {
  if (tab === "calendar") return <CalendarScreen />;
  if (tab === "todo") return <TodoScreen />;
  if (tab === "notes") return <NotesScreen />;
  if (tab === "knowledge") return <KnowledgeScreen />;
  return <FinancesScreen />;
}

function Boot({
  label,
  action,
  onAction,
}: {
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="boot-screen" role="status" aria-live="polite" aria-busy={!action}>
      <div className="boot-screen__inner">
        <p className="boot-screen__brand">Lifely</p>
        {action ? null : <span className="boot-screen__spinner" />}
        <p className="boot-screen__label">{label}</p>
        {action && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="min-h-11 rounded-2xl bg-accent px-4 text-[15px] font-semibold text-accent-fg"
          >
            {action}
          </button>
        ) : null}
      </div>
    </div>
  );
}

