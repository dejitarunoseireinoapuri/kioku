import test from "node:test";
import assert from "node:assert/strict";
import { calendarContext } from "../src/calendar.ts";

test("last week is an inclusive Monday-to-Sunday interval across week and year boundaries", () => {
  assert.deepEqual(
    calendarContext("2026-11-20T12:00:00+01:00", []).previousCalendarWeek,
    { startInclusive: "2026-11-09", endInclusive: "2026-11-15" },
  );
  assert.deepEqual(
    calendarContext("2026-01-01T00:30:00+01:00", []).previousCalendarWeek,
    { startInclusive: "2025-12-22", endInclusive: "2025-12-28" },
  );
});

test("source days use their capture zone while the query retains its explicit local date", () => {
  const result = calendarContext("2026-11-12T00:30:00+01:00", [
    {
      id: "synthetic",
      text: "Texto de prueba",
      receivedAt: "2026-11-11T23:30:00Z",
      zone: "Europe/Madrid",
    },
  ]);
  assert.equal(result.queryDayAsProvided, "2026-11-12");
  assert.equal(result.sourceDays[0]?.receivedLocalDay, "2026-11-12");
  assert.equal(calendarContext("non-ISO", []).previousCalendarWeek, null);
});
