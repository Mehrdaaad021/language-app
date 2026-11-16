import { getCalendarData } from "@/lib/server/calendar-actions";
import CalendarClient from "@/components/calendar/CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const data = await getCalendarData();
  return <CalendarClient initial={data} />;
}