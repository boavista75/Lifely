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

export const TABS: TabDef[] = [
  { id: "calendar", label: "Kalendar", Icon: IconCalendar },
  { id: "todo", label: "Todo", Icon: IconTodo },
  { id: "notes", label: "Notes", Icon: IconNotes },
  { id: "knowledge", label: "Knowledge", Icon: IconKnowledge },
  { id: "finances", label: "Finansije", Icon: IconFinances },
];
