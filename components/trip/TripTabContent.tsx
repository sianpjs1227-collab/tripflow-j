import type { Trip, TripTab } from "@/types/trip";
import ScheduleTab from "./schedule/ScheduleTab";
import ExpenseTab from "./expense/ExpenseTab";
import PlacesTab from "./places/PlacesTab";
import ChecklistTab from "./checklist/ChecklistTab";
import MemoTab from "./memo/MemoTab";

interface TripTabContentProps {
  trip: Trip;
  activeTab: TripTab;
}

/** 탭별 콘텐츠 영역 */
export default function TripTabContent({ trip, activeTab }: TripTabContentProps) {
  switch (activeTab) {
    case "schedule":
      return <ScheduleTab trip={trip} />;

    case "places":
      return <PlacesTab />;

    case "budget":
      return <ExpenseTab />;

    case "checklist":
      return <ChecklistTab />;

    case "memo":
      return <MemoTab />;

    default:
      return null;
  }
}
