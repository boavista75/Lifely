import type { MessageKey } from "@/i18n";
import type { TabId } from "@/types";
import {
  IconCalendar,
  IconFinances,
  IconKnowledge,
  IconNotes,
  IconTodo,
} from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

export type TabDef = {
  id: TabId;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const TAB_LABELS: Record<TabId, MessageKey> = {
  calendar: "nav.calendar",
  todo: "nav.todo",
  notes: "nav.notes",
  knowledge: "nav.knowledge",
  finances: "nav.finances",
};

export function tabLabel(id: TabId): MessageKey {
  return TAB_LABELS[id];
}

export const TABS: TabDef[] = [
  { id: "calendar", label: "Kalendar", Icon: IconCalendar },
  { id: "todo", label: "Todo", Icon: IconTodo },
  { id: "notes", label: "Notes", Icon: IconNotes },
  { id: "knowledge", label: "Knowledge", Icon: IconKnowledge },
  { id: "finances", label: "Finansije", Icon: IconFinances },
];
