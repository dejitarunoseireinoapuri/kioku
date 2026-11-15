import test from "node:test";
import assert from "node:assert/strict";
import { relativeCalendarPeriod } from "../src/relative-calendar.ts";
import { canonicalTime, validateTime } from "../src/temporal.ts";
import { calendarContext } from "../src/calendar.ts";
const anchor = { receivedAt: "2026-11-15T14:00:00Z", zone: "Europe/Madrid" };

test("relative months, years and weeks retain their calendar precision", () => {
  const cases = [
    ["el mes que viene", "month", "2026-12", null],
    ["este mes", "month", "2026-11", null],
    ["el mes pasado", "month", "2026-10", null],
    ["el próximo año", "year", "2027", null],
    ["este año", "year", "2026", null],
    ["el año pasado", "year", "2025", null],
    ["la semana que viene", "interval", "2026-11-16", "2026-11-22"],
    ["esta semana", "interval", "2026-11-09", "2026-11-15"],
    ["la semana pasada", "interval", "2026-11-02", "2026-11-08"],
  ];
  for (const [quote, precision, value, end] of cases) {
    const resolved = relativeCalendarPeriod(quote!, anchor);
    assert.deepEqual(resolved, { precision, value, end });
    const time = { ...resolved!, quote: quote! };
    validateTime(time, quote!, anchor);
    assert.throws(
      () => validateTime({ ...time, value: "2026-11-01" }, quote!, anchor),
      /TIME_RELATIVE_MISMATCH/,
    );
  }
  const week = relativeCalendarPeriod("la semana pasada", anchor)!;
  const queryWeek = calendarContext(
    anchor.receivedAt,
    [],
  ).previousCalendarWeek!;
  assert.equal(week.value, queryWeek.startInclusive);
  assert.equal(week.end, queryWeek.endInclusive);
});

test("calendar transitions use the owner's zone and avoid end-of-month overflow", () => {
  assert.equal(
    relativeCalendarPeriod("el mes que viene", {
      ...anchor,
      receivedAt: "2026-01-31T12:00:00Z",
    })!.value,
    "2026-02",
  );
  const midnight = {
    receivedAt: "2026-12-31T23:30:00Z",
    zone: "Europe/Madrid",
  };
  assert.equal(
    relativeCalendarPeriod("el mes que viene", midnight)!.value,
    "2027-02",
  );
  assert.equal(
    relativeCalendarPeriod("el año que viene", midnight)!.value,
    "2028",
  );
  assert.equal(
    relativeCalendarPeriod("el mes que viene", {
      ...midnight,
      zone: "America/Los_Angeles",
    })!.value,
    "2027-01",
  );
  assert.deepEqual(relativeCalendarPeriod("esta semana", midnight), {
    precision: "interval",
    value: "2026-12-28",
    end: "2027-01-03",
  });
});

test("a relative month never invents day one and a bare month never acquires a year", () => {
  const quote = "el mes que viene";
  assert.deepEqual(
    canonicalTime(
      { precision: "day", value: "2026-12-01", end: null, quote },
      quote,
      quote,
      anchor,
    ),
    {
      precision: "month",
      value: "2026-12",
      end: null,
      quote,
    },
  );
  assert.throws(
    () =>
      validateTime(
        { precision: "day", value: "2026-12-01", end: null, quote },
        quote,
        anchor,
      ),
    /TIME_RELATIVE_MISMATCH/,
  );
  assert.equal(
    canonicalTime(
      { precision: "month", value: "2026-12", end: null, quote: "diciembre" },
      "diciembre",
      "diciembre",
      anchor,
    ).value,
    "--12",
  );
  for (const value of [
    "algún día",
    "durante dos meses",
    "cuando acabe el mes",
    "el mes que viene y el año pasado",
  ]) {
    assert.equal(relativeCalendarPeriod(value, anchor), null);
  }
});
