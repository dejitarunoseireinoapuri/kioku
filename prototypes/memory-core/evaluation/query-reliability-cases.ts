import type { Draft } from "../src/contracts.ts";
import { harness } from "../fixtures/harness.ts";
import type { Harness } from "../fixtures/harness.ts";
import { content, unknownTime } from "../fixtures/scenarios.ts";

export const queryAt = "2026-11-20T11:00:00Z";
export const queryZone = "Europe/Madrid";
export interface QueryReliabilityCase {
  id: string;
  question: string;
  previous?: string[];
  family: string;
  setup(): { h: Harness; expectedIds: string[] };
  expected: "answered" | "not_found" | "clarify";
  required?: string[];
}

function fresh() {
  const h = harness();
  h.advance(Date.parse(queryAt) - h.runtime.now());
  return h;
}
function fact(text: string): Draft {
  return {
    text,
    zone: queryZone,
    units: [
      {
        key: "a",
        content: { ...content(text), text, proposition: text, kind: "fact" },
        time: unknownTime,
        existing: null,
      },
    ],
    fragments: [{ start: 0, end: text.length, role: "primary", owners: ["a"] }],
    relations: [],
  };
}
function speech(h: Harness, future = false) {
  const before =
    "El 19 de noviembre de 2026, la profesora ficticia Ada me recomendó ";
  const advice = future
    ? "visitar el museo el 22 de noviembre de 2026."
    : "practicar piano veinte minutos.";
  const text = before + advice;
  const draft = fact(text);
  draft.units[0]!.content.attribution = "profesora ficticia Ada";
  draft.units[0]!.time = {
    precision: "day",
    value: future ? "2026-11-22" : "2026-11-19",
    end: null,
    fragment: future ? 2 : 0,
  };
  if (future) draft.units[0]!.content.kind = "intention";
  draft.fragments = [
    {
      start: 0,
      end: before.length,
      role: future ? "context" : "time",
      owners: ["a"],
    },
    {
      start: before.length,
      end: text.length,
      role: future ? "time" : "primary",
      owners: ["a"],
    },
  ];
  if (future) {
    const dateStart = text.indexOf("el 22");
    draft.fragments = [
      { start: 0, end: before.length, role: "context", owners: ["a"] },
      { start: before.length, end: dateStart, role: "primary", owners: ["a"] },
      { start: dateStart, end: text.length, role: "time", owners: ["a"] },
    ];
  }
  return h.save(draft).refs[0]!.id;
}
const teacher = () => {
  const h = fresh();
  const id = speech(h);
  h.save(fact("El tutor ficticio Bruno me sugirió comprar una carpeta azul."));
  return { h, expectedIds: [id] };
};
const umbrella = () => {
  const h = fresh();
  const id = h.save(fact("Mi paraguas violeta está en el cajón del recibidor."))
    .refs[0]!.id;
  h.save(fact("Mi paraguas verde está en el coche."));
  return { h, expectedIds: [id] };
};
const futureSpeech = () => {
  const h = fresh();
  return { h, expectedIds: [speech(h, true)] };
};

export const queryReliabilityCases: QueryReliabilityCase[] = [
  ...[
    "Dime lo que me dijo ayer la profesora Ada",
    "¿Qué me dijo ayer la profesora Ada?",
    "Recuérdame qué me recomendó ayer Ada",
    "Cuéntame lo que me aconsejó ayer la profesora",
    "Me gustaría saber qué me dijo ayer Ada",
    "¿Cuál fue la recomendación de ayer de la profesora?",
  ].map((question, i) => ({
    id: `speech-${i + 1}`,
    family: "request-paraphrase",
    question,
    setup: teacher,
    expected: "answered" as const,
    required: ["piano", "veinte|20"],
  })),
  {
    id: "speech-context",
    family: "context",
    question: "¿Qué me dijo ayer la profesora Ada?",
    previous: ["Dime lo que me dijo ayer la profesora Ada"],
    setup: teacher,
    expected: "answered",
    required: ["piano", "veinte|20"],
  },
  {
    id: "speech-unrelated-context",
    family: "context",
    question: "Dime lo que me dijo ayer la profesora Ada",
    previous: ["¿Dónde está mi paraguas verde?"],
    setup: teacher,
    expected: "answered",
    required: ["piano", "veinte|20"],
  },
  {
    id: "speech-event-vs-record",
    family: "dates",
    question: "¿Qué me dijo hoy la profesora Ada?",
    setup: () => ({ ...teacher(), expectedIds: [] }),
    expected: "not_found",
  },
  {
    id: "speech-future-advice",
    family: "dates",
    question: "Dime qué me recomendó ayer la profesora Ada",
    setup: futureSpeech,
    expected: "answered",
    required: ["museo", "22"],
  },
  {
    id: "umbrella-imperative",
    family: "location",
    question: "Dime dónde tengo el paraguas violeta",
    setup: umbrella,
    expected: "answered",
    required: ["caj[oó]n", "recibidor"],
  },
  {
    id: "umbrella-interrogative",
    family: "location",
    question: "¿Dónde está mi paraguas violeta?",
    setup: umbrella,
    expected: "answered",
    required: ["caj[oó]n", "recibidor"],
  },
  {
    id: "umbrella-partial",
    family: "partial-answer",
    question: "¿Dónde está mi paraguas violeta y de qué marca es?",
    setup: umbrella,
    expected: "answered",
    required: ["recibidor", "marca", "no|desconoz|consta"],
  },
  {
    id: "umbrella-brand-absent",
    family: "true-absence",
    question: "¿De qué marca es mi paraguas violeta?",
    setup: () => ({ ...umbrella(), expectedIds: [] }),
    expected: "not_found",
  },
  {
    id: "umbrella-ellipsis",
    family: "context",
    question: "¿Y dónde está?",
    previous: ["¿Qué sabes de mi paraguas violeta?"],
    setup: umbrella,
    expected: "answered",
    required: ["recibidor"],
  },
  {
    id: "empty-context-not-fact",
    family: "true-absence",
    question: "¿Y dónde está?",
    previous: ["¿Está mi paraguas violeta en el recibidor?"],
    setup: () => ({ h: fresh(), expectedIds: [] }),
    expected: "not_found",
  },
  {
    id: "forgotten-not-restored",
    family: "forget",
    question: "Dime qué me dijo ayer la profesora Ada",
    setup: () => {
      const { h, expectedIds } = teacher();
      const unit = h.store.read().units[expectedIds[0]!]!;
      h.erase([{ id: unit.id, revision: unit.revision }]);
      return { h, expectedIds: [] };
    },
    expected: "not_found",
  },
];
