import type { Content, Draft, Reference } from "../src/contracts.ts";

export const unknownTime = {
  precision: "unknown",
  value: null,
  end: null,
  fragment: null,
} as const;

export function content(label: string): Content {
  return {
    text: `Quiero ${label}`,
    proposition: label,
    subject: "owner",
    kind: "intention",
    polarity: "positive",
    attribution: null,
    condition: null,
  };
}

/** Synthetic reviewed interpretations. These fixtures do not claim to interpret language. */
export function single(
  label: string,
  existing: Reference | null = null,
): Draft {
  const text = `Quiero ${label}`;
  return {
    text,
    zone: "Europe/Madrid",
    units: [{ key: "a", content: content(label), time: unknownTime, existing }],
    fragments: [{ start: 0, end: text.length, role: "primary", owners: ["a"] }],
    relations: [],
  };
}

export function twoPlans(
  first = "dibujar",
  second = "aprender ajedrez",
): Draft {
  const parts = [
    `Quiero ${first} `,
    "mañana",
    ` y quiero ${second} `,
    "en junio",
  ];
  let offset = 0;
  return {
    text: parts.join(""),
    zone: "Europe/Madrid",
    units: [
      {
        key: "a",
        content: content(first),
        existing: null,
        time: { precision: "day", value: "2026-05-11", end: null, fragment: 1 },
      },
      {
        key: "b",
        content: content(second),
        existing: null,
        time: { precision: "month", value: "2026-06", end: null, fragment: 3 },
      },
    ],
    fragments: parts.map((part, index) => {
      const start = offset;
      offset += part.length;
      return {
        start,
        end: offset,
        role: index % 2 ? "time" : "primary",
        owners: [index < 2 ? "a" : "b"],
      };
    }),
    relations: [],
  };
}

export function sharedContext(): Draft {
  const parts = [
    "Elena me dijo que ",
    "dibujará mañana",
    " y ",
    "estudiará en junio",
  ];
  let offset = 0;
  return {
    text: parts.join(""),
    zone: "Europe/Madrid",
    units: ["dibujará mañana", "estudiará en junio"].map((label, index) => ({
      key: index === 0 ? "a" : "b",
      content: { ...content(label), subject: "Elena", attribution: "Elena" },
      time: unknownTime,
      existing: null,
    })),
    fragments: parts.map((part, index) => {
      const start = offset;
      offset += part.length;
      return {
        start,
        end: offset,
        role: index % 2 ? "primary" : "context",
        owners: index % 2 ? [index === 1 ? "a" : "b"] : ["a", "b"],
      };
    }),
    relations: [],
  };
}

export function conditional(): Draft {
  const draft = single("leer Dune cuando Elena viaje");
  draft.units[0]!.content.condition = "cuando Elena viaje";
  return draft;
}
