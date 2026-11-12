import test from "node:test";
import assert from "node:assert/strict";
import { validateTime, canonicalTime, unknownTime } from "../src/temporal.ts";

test("month, annual birthday and unknown dates retain their original precision", () => {
  validateTime(
    {
      precision: "month",
      value: "2026-11",
      end: null,
      quote: "desde noviembre de 2026",
    },
    "Ahora prefiero té negro desde noviembre de 2026.",
  );
  validateTime(
    {
      precision: "month_day",
      value: "--03-04",
      end: null,
      quote: "4 de marzo",
    },
    "Pablo, mi compañero, cumple años el 4 de marzo.",
  );
  validateTime(unknownTime, "Compré un cuaderno.");
});

test("invented first-of-month, year and invalid calendar dates are rejected", () => {
  assert.throws(
    () =>
      validateTime(
        {
          precision: "day",
          value: "2026-11-01",
          end: null,
          quote: "noviembre de 2026",
        },
        "noviembre de 2026",
      ),
    /TIME_UNSUPPORTED_PRECISION/,
  );
  assert.throws(
    () =>
      validateTime(
        {
          precision: "day",
          value: "2026-03-04",
          end: null,
          quote: "4 de marzo",
        },
        "4 de marzo",
      ),
    /TIME_UNSUPPORTED_PRECISION/,
  );
  assert.throws(
    () =>
      validateTime(
        {
          precision: "day",
          value: "2026-02-31",
          end: null,
          quote: "31 de febrero de 2026",
        },
        "31 de febrero de 2026",
      ),
    /TIME_UNSUPPORTED_PRECISION/,
  );
});

test("date evidence must be literal and unknown cannot carry a hidden precise date", () => {
  assert.throws(
    () =>
      validateTime(
        { precision: "day", value: "2026-11-12", end: null, quote: "mañana" },
        "La semana que viene.",
      ),
    /TIME_QUOTE_NOT_IN_SOURCE/,
  );
  assert.throws(
    () => validateTime({ ...unknownTime, value: "2026-11-01" }, "Texto"),
    /TIME_UNKNOWN_HAS_VALUE/,
  );
});

test("the date value must agree with the literal evidence, including a time-zone anchored tomorrow", () => {
  assert.throws(
    () =>
      validateTime(
        {
          precision: "month_day",
          value: "--07-08",
          end: null,
          quote: "4 de marzo",
        },
        "4 de marzo",
      ),
    /TIME_VALUE_NOT_SUPPORTED/,
  );
  assert.throws(
    () =>
      validateTime(
        {
          precision: "day",
          value: "2026-11-21",
          end: null,
          quote: "20 de noviembre de 2026",
        },
        "20 de noviembre de 2026",
      ),
    /TIME_VALUE_NOT_SUPPORTED/,
  );
  const time = {
    precision: "day" as const,
    value: "2026-11-13",
    end: null,
    quote: "mañana",
  };
  validateTime(time, "mañana", {
    receivedAt: "2026-11-11T23:30:00Z",
    zone: "Europe/Madrid",
  });
  assert.throws(
    () =>
      validateTime({ ...time, value: "2026-11-12" }, "mañana", {
        receivedAt: "2026-11-11T23:30:00Z",
        zone: "Europe/Madrid",
      }),
    /TIME_RELATIVE_MISMATCH/,
  );
});

test("a paraphrased time quote is repaired only through literal supporting evidence", () => {
  const time = {
    precision: "day" as const,
    value: "2026-11-16",
    end: null,
    quote: "lunes 16 noviembre 2026",
  };
  const literal = "Para el lunes 16 de noviembre de 2026 tengo deberes.";
  assert.equal(
    canonicalTime(time, literal, literal, {
      receivedAt: "2026-11-11T10:00:00Z",
      zone: "Europe/Madrid",
    }).quote,
    literal,
  );
  assert.equal(
    canonicalTime({ ...time, value: "2026-11-17" }, literal, literal, {
      receivedAt: "2026-11-11T10:00:00Z",
      zone: "Europe/Madrid",
    }).value,
    "2026-11-16",
  );
  assert.throws(
    () =>
      canonicalTime(
        { ...time, value: "2026-11-17", quote: "lunes" },
        "lunes",
        "lunes",
        {
          receivedAt: "2026-11-11T10:00:00Z",
          zone: "Europe/Madrid",
        },
      ),
    /TIME_RELATIVE_MISMATCH/,
  );
});

test("generated precision is reduced to the supported month or recurring birthday", () => {
  const anchor = { receivedAt: "2026-11-11T10:00:00Z", zone: "Europe/Madrid" };
  const month = canonicalTime(
    {
      precision: "day",
      value: "2026-11-01",
      end: null,
      quote: "desde noviembre de 2026",
    },
    "Desde noviembre de 2026 prefiero silencio.",
    "Desde noviembre de 2026 prefiero silencio.",
    anchor,
  );
  assert.equal(month.precision, "month");
  assert.equal(month.value, "2026-11");
  const birthday = canonicalTime(
    { precision: "day", value: "2026-03-04", end: null, quote: "4 de marzo" },
    "Pablo cumple años el 4 de marzo.",
    "Pablo cumple años el 4 de marzo.",
    anchor,
  );
  assert.equal(birthday.precision, "month_day");
  assert.equal(birthday.value, "--03-04");
});

test("partial dates and intervals cannot substitute a different month, year or endpoint", () => {
  assert.throws(
    () =>
      validateTime(
        {
          precision: "month",
          value: "2025-11",
          end: null,
          quote: "noviembre de 2026",
        },
        "noviembre de 2026",
      ),
    /TIME_VALUE_NOT_SUPPORTED/,
  );
  assert.throws(
    () =>
      validateTime(
        { precision: "year", value: "2025", end: null, quote: "2026" },
        "2026",
      ),
    /TIME_VALUE_NOT_SUPPORTED/,
  );
  validateTime(
    {
      precision: "interval",
      value: "2026-11-10",
      end: "2026-11-12",
      quote: "del 10 de noviembre de 2026 al 12 de noviembre de 2026",
    },
    "del 10 de noviembre de 2026 al 12 de noviembre de 2026",
  );
  assert.throws(
    () =>
      validateTime(
        {
          precision: "interval",
          value: "2026-11-10",
          end: "2026-11-13",
          quote: "del 10 de noviembre de 2026 al 12 de noviembre de 2026",
        },
        "del 10 de noviembre de 2026 al 12 de noviembre de 2026",
      ),
    /TIME_VALUE_NOT_SUPPORTED/,
  );
});

test("a date in a separate topic cannot silently date an undated memory", () => {
  const source = "Me gustó la tarta de limón. Hoy terminé un libro.";
  const time = {
    precision: "day" as const,
    value: "2026-11-11",
    end: null,
    quote: "Hoy",
  };
  const anchor = { receivedAt: "2026-11-11T10:00:00Z", zone: "Europe/Madrid" };
  assert.deepEqual(
    canonicalTime(time, "Me gustó la tarta de limón.", source, anchor),
    unknownTime,
  );
  assert.equal(
    canonicalTime(time, "Hoy terminé un libro.", source, anchor).value,
    "2026-11-11",
  );
  const clarification = "La tarta la probé hoy.";
  assert.equal(
    canonicalTime(
      { ...time, quote: "hoy" },
      "Me gustó la tarta de limón.",
      source + "\nAclaración: " + clarification,
      { ...anchor, clarification },
    ).value,
    "2026-11-11",
  );
});

test("a model's wrong tomorrow is canonicalized from the source time zone across midnight", () => {
  const source = "Mañana a las 8:10 recojo el paquete.";
  const time = canonicalTime(
    {
      precision: "day",
      value: "2026-11-12",
      end: null,
      quote: "Mañana a las 8:10",
    },
    source,
    source,
    { receivedAt: "2026-11-11T23:30:00Z", zone: "Europe/Madrid" },
  );
  assert.equal(time.value, "2026-11-13");
  assert.equal(
    canonicalTime({ ...time, value: "2026-11-13" }, source, source, {
      receivedAt: "2026-11-11T23:30:00Z",
      zone: "Atlantic/Canary",
    }).value,
    "2026-11-12",
  );
});

test("an explicit ISO date retains day precision instead of degrading to its year", () => {
  const source = "La entrega es 2026-12-18.";
  const time = canonicalTime(
    { precision: "day", value: "2026-12-18", end: null, quote: "2026-12-18" },
    source,
    source,
    { receivedAt: "2026-11-11T10:00:00Z", zone: "Europe/Madrid" },
  );
  assert.equal(time.precision, "day");
  assert.equal(time.value, "2026-12-18");
});
