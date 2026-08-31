import { AppShell } from "@/components/AppShell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DaySheet } from "@/components/DaySheet";
import { ItemSheet } from "@/components/ItemSheet";
import { tabTransition } from "@/lib/motion";
import { CalendarScreen } from "@/screens/CalendarScreen";
import { ComingSoonScreen } from "@/screens/ComingSoonScreen";
import { KnowledgeScreen } from "@/screens/KnowledgeScreen";
import { NotesScreen } from "@/screens/NotesScreen";
import { TodoScreen } from "@/screens/TodoScreen";
import { useUiStore } from "@/store/useUiStore";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export default function App() {
  const tab = useUiStore((state) => state.tab);
  const reduce = useReducedMotion();

  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          className="h-full min-h-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduce ? { duration: 0.01 } : tabTransition}
        >
          {tab === "calendar" && <CalendarScreen />}
          {tab === "todo" && <TodoScreen />}
          {tab === "notes" && <NotesScreen />}
          {tab === "knowledge" && <KnowledgeScreen />}
          {tab === "finances" && (
            <ComingSoonScreen
              title="Finansije"
              message="Pregled finansija stiže uskoro."
            />
          )}
        </motion.div>
      </AnimatePresence>
      <DaySheet />
      <ItemSheet />
      <ConfirmDialog />
    </AppShell>
  );
}
