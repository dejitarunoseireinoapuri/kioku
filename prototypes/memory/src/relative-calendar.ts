import type { MemoryTime } from "./domain.ts";

export interface CalendarAnchor {
  receivedAt: string;
  zone: string;
}

/** Resolve calendar periods at capture time, without adding an invented day to a month or year. */
export function relativeCalendarPeriod(
  quote: string,
  anchor: CalendarAnchor,
): Omit<MemoryTime, "quote"> | null {
  const phrase = quote
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .replace(/[.,;:!?]+$/u, "")
    .replace(/\s+/gu, " ")
    .replace(/^(?:a partir de|desde|durante|para|en) /u, "")
    .replace(/^(?:el|la) /u, "");
  const match =
    /^(?:(este|esta|proximo|proxima) (mes|ano|semana)|(mes|ano|semana) (que viene|proximo|proxima|pasado|pasada|actual))$/u.exec(
      phrase,
    );
  if (!match) return null;
  const unit = match[2] ?? match[3],
    modifier = match[1] ?? match[4];
  const offset =
    modifier === "pasado" || modifier === "pasada"
      ? -1
      : modifier === "este" || modifier === "esta" || modifier === "actual"
        ? 0
        : 1;
  const day = new Intl.DateTimeFormat("sv-SE", {
    timeZone: anchor.zone,
  }).format(new Date(anchor.receivedAt));
  const date = new Date(`${day}T12:00:00Z`);
  if (unit === "mes") {
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + offset);
    return {
      precision: "month",
      value: date.toISOString().slice(0, 7),
      end: null,
    };
  }
  if (unit === "ano")
    return {
      precision: "year",
      value: String(date.getUTCFullYear() + offset),
      end: null,
    };
  date.setUTCDate(
    date.getUTCDate() - ((date.getUTCDay() + 6) % 7) + offset * 7,
  );
  const end = new Date(date);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    precision: "interval",
    value: date.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}
