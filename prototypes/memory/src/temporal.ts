import { z } from "zod";
import { MemoryError } from "./domain.ts";
import type { MemoryTime } from "./domain.ts";

export const unknownTime: MemoryTime = {
  precision: "unknown",
  value: null,
  end: null,
  quote: null,
};
const monthNames =
  "enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre";
const relative =
  /\b(hoy|ayer|anteayer|mañana|pasado mañana|lunes|martes|miércoles|jueves|viernes|sábado|domingo)\b/iu;

/** Canonicalize precision and values from literal evidence bound to the item or its clarification. */
export function canonicalTime(
  input: MemoryTime,
  literalQuote: string,
  source: string,
  anchor: { receivedAt: string; zone: string; clarification?: string | null },
): MemoryTime {
  let time = input;
  if (
    time.quote !== null &&
    !source.includes(time.quote) &&
    literalQuote.length <= 300 &&
    source.includes(literalQuote)
  ) {
    time = { ...time, quote: literalQuote };
  }
  if (time.precision === "unknown") {
    validateTime(time, source, anchor);
    return time;
  }
  if (!time.quote || !source.includes(time.quote))
    throw new MemoryError("TIME_QUOTE_NOT_IN_SOURCE");
  // Another topic's date is not evidence for this item. A clarification can supply missing context.
  if (
    !literalQuote.includes(time.quote) &&
    !anchor.clarification?.includes(time.quote)
  )
    return { ...unknownTime };
  const evidence = time.quote;
  const dates = dateParts(evidence);
  if (dates.length === 1) {
    const date = dates[0]!;
    const value = date.year
      ? date.year + "-" + date.month + "-" + date.day
      : "--" + date.month + "-" + date.day;
    time = {
      precision: date.year ? "day" : "month_day",
      value,
      end: null,
      quote: evidence,
    };
  } else if (dates.length === 0) {
    const found = [
      ...evidence.matchAll(
        new RegExp(
          "(" + monthNames + ")(?:\\s+(?:de\\s+)?((?:19|20)\\d{2}))?",
          "giu",
        ),
      ),
    ];
    if (found.length === 1) {
      const match = found[0]!;
      const month = String(
        months.indexOf(match[1]!.toLowerCase()) + 1,
      ).padStart(2, "0");
      time = {
        precision: "month",
        value: match[2] ? match[2] + "-" + month : "--" + month,
        end: null,
        quote: evidence,
      };
    } else if (!relative.test(evidence)) {
      const years = [...evidence.matchAll(/\b(?:19|20)\d{2}\b/gu)];
      time =
        years.length === 1 && found.length === 0
          ? {
              precision: "year",
              value: years[0]![0],
              end: null,
              quote: evidence,
            }
          : { ...unknownTime, quote: evidence };
    }
  }
  if (dates.length === 0 && time.precision === "day") {
    const relativeDay = anchoredRelativeDay(evidence, anchor);
    if (relativeDay !== null) time = { ...time, value: relativeDay, end: null };
  }
  validateTime(time, source, anchor);
  return time;
}

function anchoredRelativeDay(
  quote: string,
  anchor: { receivedAt: string; zone: string },
): string | null {
  const match =
    /^(anteayer|pasado mañana|ayer|mañana|hoy)(?=\s|[.,;:]|$)/iu.exec(
      quote.trim(),
    );
  if (!match) return null;
  const offsets: Record<string, number> = {
    anteayer: -2,
    "pasado mañana": 2,
    ayer: -1,
    mañana: 1,
    hoy: 0,
  };
  const day = new Intl.DateTimeFormat("sv-SE", {
    timeZone: anchor.zone,
  }).format(new Date(anchor.receivedAt));
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsets[match[1]!.toLowerCase()]!);
  return date.toISOString().slice(0, 10);
}

const months =
  "enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split(
    " ",
  );
function dateParts(quote: string) {
  const named = new RegExp(
    `(\\d{1,2})\\s+de\\s+(${monthNames})(?:\\s+(?:de\\s+)?((?:19|20)\\d{2}))?`,
    "giu",
  );
  const parts = [...quote.matchAll(named)].map((match) => ({
    day: match[1]!.padStart(2, "0"),
    month: String(months.indexOf(match[2]!.toLowerCase()) + 1).padStart(2, "0"),
    year: match[3] ?? null,
  }));
  for (const match of quote.matchAll(
    /\b((?:19|20)\d{2})-(\d{2})-(\d{2})\b/gu,
  )) {
    parts.push({ year: match[1]!, month: match[2]!, day: match[3]! });
  }
  return parts;
}

/** Partial dates remain partial. This guard is deliberately conservative about unsupported precision. */
export function validateTime(
  time: MemoryTime,
  source: string,
  anchor?: { receivedAt: string; zone: string },
): void {
  if (time.quote !== null && !source.includes(time.quote))
    throw new MemoryError("TIME_QUOTE_NOT_IN_SOURCE");
  if (time.precision === "unknown") {
    if (time.value !== null || time.end !== null)
      throw new MemoryError("TIME_UNKNOWN_HAS_VALUE");
    return;
  }
  if (!time.quote || !time.value)
    throw new MemoryError("TIME_EVIDENCE_REQUIRED");
  const evidence = time.quote;
  const hasYear = /\b(?:19|20)\d{2}\b/u.test(evidence);
  const hasMonth = new RegExp(`\\b(${monthNames})\\b`, "iu").test(evidence);
  const hasDay =
    /\b(?:[1-9]|[12]\d|3[01])\s+de\s+/iu.test(evidence) ||
    /\d{4}-\d{2}-\d{2}/u.test(evidence);
  const checks = {
    day:
      z.iso.date().safeParse(time.value).success &&
      ((hasYear && hasDay) ||
        (relative.test(evidence) && !(hasMonth && hasDay && !hasYear))),
    month:
      /^(?:\d{4}-|--)(0[1-9]|1[0-2])$/u.test(time.value) &&
      hasMonth &&
      (time.value.startsWith("--") || hasYear),
    year: /^\d{4}$/u.test(time.value) && hasYear,
    month_day:
      /^--\d{2}-\d{2}$/u.test(time.value) && hasMonth && hasDay && !hasYear,
    interval:
      /^\d{4}-\d{2}-\d{2}$/u.test(time.value) &&
      time.end !== null &&
      hasYear &&
      hasDay,
  };
  if (!checks[time.precision])
    throw new MemoryError("TIME_UNSUPPORTED_PRECISION");
  const dates = dateParts(evidence);
  const explicitYears: string[] = [
    ...evidence.matchAll(/\b(?:19|20)\d{2}\b/gu),
  ].map((match) => match[0]);
  if (time.precision === "year" && !explicitYears.includes(time.value)) {
    throw new MemoryError("TIME_VALUE_NOT_SUPPORTED");
  }
  if (time.precision === "month") {
    const pattern = new RegExp(
      `(${monthNames})(?:\\s+(?:de\\s+)?((?:19|20)\\d{2}))?`,
      "giu",
    );
    const values = [...evidence.matchAll(pattern)].map((match) => {
      const month = String(
        months.indexOf(match[1]!.toLowerCase()) + 1,
      ).padStart(2, "0");
      return match[2] ? `${match[2]}-${month}` : `--${month}`;
    });
    if (!values.includes(time.value))
      throw new MemoryError("TIME_VALUE_NOT_SUPPORTED");
  }
  if (
    time.precision === "month_day" &&
    !dates.some((date) => time.value === `--${date.month}-${date.day}`)
  ) {
    throw new MemoryError("TIME_VALUE_NOT_SUPPORTED");
  }
  if (
    time.precision === "month_day" &&
    !z.iso.date().safeParse(`2000-${time.value.slice(2)}`).success
  ) {
    throw new MemoryError("TIME_INVALID_DATE");
  }
  if (time.precision === "interval") {
    const exact = dates
      .filter((date) => date.year)
      .map((date) => `${date.year}-${date.month}-${date.day}`);
    exact.push(...(evidence.match(/\d{4}-\d{2}-\d{2}/gu) ?? []));
    if (
      !time.end ||
      !z.iso.date().safeParse(time.end).success ||
      !exact.includes(time.value) ||
      !exact.includes(time.end) ||
      time.end < time.value
    )
      throw new MemoryError("TIME_VALUE_NOT_SUPPORTED");
  }
  if (time.precision === "day" && hasYear && hasDay) {
    const exact = dates
      .filter((date) => date.year)
      .map((date) => `${date.year}-${date.month}-${date.day}`);
    exact.push(...(evidence.match(/\d{4}-\d{2}-\d{2}/gu) ?? []));
    if (!exact.includes(time.value))
      throw new MemoryError("TIME_VALUE_NOT_SUPPORTED");
  }
  if (time.precision === "day" && anchor && !hasYear) {
    const phrase = evidence.toLowerCase();
    const offset = phrase.includes("anteayer")
      ? -2
      : phrase.includes("pasado mañana")
        ? 2
        : /\bayer\b/u.test(phrase)
          ? -1
          : /\bmañana\b/u.test(phrase)
            ? 1
            : /\bhoy\b/u.test(phrase)
              ? 0
              : null;
    if (offset !== null) {
      const day = new Intl.DateTimeFormat("sv-SE", {
        timeZone: anchor.zone,
      }).format(new Date(anchor.receivedAt));
      const expected = new Date(`${day}T12:00:00Z`);
      expected.setUTCDate(expected.getUTCDate() + offset);
      if (time.value !== expected.toISOString().slice(0, 10))
        throw new MemoryError("TIME_RELATIVE_MISMATCH");
    }
    const weekdayNames = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];
    const normalized = phrase.normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const weekday = weekdayNames.findIndex((name) =>
      new RegExp(`\\b${name}\\b`, "u").test(normalized),
    );
    if (weekday >= 0) {
      const valueDate = new Date(`${time.value}T12:00:00Z`);
      const localDay = new Intl.DateTimeFormat("sv-SE", {
        timeZone: anchor.zone,
      }).format(new Date(anchor.receivedAt));
      const days = Math.abs(
        (valueDate.getTime() - new Date(`${localDay}T12:00:00Z`).getTime()) /
          86_400_000,
      );
      if (valueDate.getUTCDay() !== weekday || days > 14)
        throw new MemoryError("TIME_RELATIVE_MISMATCH");
    }
  }
  if (time.precision !== "interval" && time.end !== null)
    throw new MemoryError("TIME_UNEXPECTED_END");
  if (
    time.precision === "day" &&
    !Number.isFinite(Date.parse(`${time.value}T12:00:00Z`))
  ) {
    throw new MemoryError("TIME_INVALID_DATE");
  }
}
