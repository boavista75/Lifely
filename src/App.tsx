import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DaySheet } from "@/components/DaySheet";
import { ItemSheet } from "@/components/ItemSheet";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useContentGate } from "@/hooks/useContentGate";
import { useFinanceReminders } from "@/hooks/useFinanceReminders";
import { CalendarScreen } from "@/screens/CalendarScreen";
import { FinancesScreen } from "@/screens/FinancesScreen";
import { KnowledgeScreen } from "@/screens/KnowledgeScreen";
import { NotesScreen } from "@/screens/NotesScreen";
import { TodoScreen } from "@/screens/TodoScreen";
import { hydrateApp, useBootStore } from "@/store/useBootStore";
import { useUiStore } from "@/store/useUiStore";
import type { TabId } from "@/types";
import { useEffect } from "react";

export default function App() {
  const ready = useBootStore((state) => state.ready);

  useEffect(() => {
    void hydrateApp();
  }, []);

  return (
    <AppShell>
      <TabPane ready={ready} />
      {ready ? (
        <>
          <FinanceReminders />
          <DaySheet />
          <ItemSheet />
          <ConfirmDialog />
        </>
      ) : null}
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

