import type { Source } from "./domain.ts";

/** Query timestamps carry their local offset; source dates use each capture's named zone. */
export function calendarContext(at: string, sources: Source[]) {
  const day = /^\d{4}-\d{2}-\d{2}T/u.test(at) ? at.slice(0, 10) : null;
  let previousCalendarWeek = null;
  if (day !== null) {
    const monday = new Date(`${day}T12:00:00Z`);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7) - 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(sunday.getUTCDate() + 6);
    previousCalendarWeek = {
      startInclusive: monday.toISOString().slice(0, 10),
      endInclusive: sunday.toISOString().slice(0, 10),
    };
  }
  return {
    queryDayAsProvided: day,
    weekStartsOn: "Monday",
    previousCalendarWeek,
    sourceDays: sources.map((source) => ({
      sourceId: source.id,
      receivedLocalDay: new Intl.DateTimeFormat("sv-SE", {
        timeZone: source.zone,
      }).format(new Date(source.receivedAt)),
    })),
  };
}
