import type { Draft } from "#memory-v2/src/contracts";
import type { Snapshot, Unit } from "#memory-v2/src/model";
import {
  locationKey,
  parseCurrentLocation,
  parseLocationQuestion,
} from "./direct-intent.js";
import type { LocationObject } from "./direct-intent.js";

type LocationFact = LocationObject & { place: string; unit: Unit };
type LocationAnswer =
  | { kind: "match"; place: string; unitId: string }
  | { kind: "ambiguous" | "absent" };

function sameObject(a: LocationObject, b: LocationObject) {
  return a.object === b.object && a.color === b.color;
}

function locationSubject(object: LocationObject) {
  return [object.object, object.color].filter(Boolean).join(" ");
}

/** Every live unit must be understood before ruling out a competing location. */
function verifiedLocations(state: Snapshot): LocationFact[] | null {
  if (Object.keys(state.relations).length) return null;
  const occurrences = Object.values(state.occurrences);
  const locations: LocationFact[] = [];
  for (const unit of Object.values(state.units)) {
    const { content, time } = unit;
    if (
      state.revocations[unit.id] ||
      content.kind !== "fact" ||
      content.polarity !== "positive" ||
      content.attribution !== null ||
      content.condition !== null ||
      time.precision !== "unknown" ||
      time.value !== null ||
      time.end !== null ||
      unit.timeEvidenceId !== null
    )
      return null;
    const location = parseCurrentLocation(content.text);
    if (
      !location ||
      content.subject !== locationSubject(location) ||
      content.proposition !== content.text
    )
      return null;
    const supports = occurrences.filter((row) => row.unitId === unit.id);
    if (
      !supports.length ||
      !supports.every((row) => {
        if (row.fragmentIds.length !== 1) return false;
        const fragment = state.fragments[row.fragmentIds[0]!];
        const source = state.sources[row.sourceId];
        if (
          !fragment ||
          !source ||
          fragment.sourceId !== source.id ||
          fragment.role !== "primary" ||
          fragment.owners.length !== 1 ||
          fragment.owners[0] !== unit.id ||
          fragment.start !== 0 ||
          fragment.end !== source.length ||
          fragment.text.length !== source.length
        )
          return false;
        const literal = parseCurrentLocation(fragment.text);
        return (
          literal !== null &&
          sameObject(literal, location) &&
          locationKey(literal.place) === locationKey(location.place)
        );
      })
    )
      return null;
    locations.push({ ...location, unit });
  }
  return locations;
}

function literalDraft(
  text: string,
  zone: string,
  object: LocationObject,
  existing?: Unit,
): Draft {
  return {
    text,
    zone,
    units: [
      {
        key: "location",
        content: existing?.content ?? {
          text,
          proposition: text,
          subject: locationSubject(object),
          kind: "fact",
          polarity: "positive",
          attribution: null,
          condition: null,
        },
        time: { precision: "unknown", value: null, end: null, fragment: null },
        existing: existing
          ? { id: existing.id, revision: existing.revision }
          : null,
      },
    ],
    fragments: [
      { start: 0, end: text.length, role: "primary", owners: ["location"] },
    ],
    relations: [],
  };
}

export function directLocationCapture(
  state: Snapshot,
  text: string,
  zone: string,
): Draft | null {
  const location = parseCurrentLocation(text);
  if (!location) return null;
  const catalog = verifiedLocations(state);
  if (!catalog) return null;
  const similar = catalog.filter((entry) => entry.object === location.object);
  if (
    similar.some(
      (entry) =>
        !sameObject(entry, location) && (!entry.color || !location.color),
    )
  )
    return null;
  const samePlaces = similar.filter(
    (entry) =>
      sameObject(entry, location) &&
      locationKey(entry.place) === locationKey(location.place),
  );
  if (samePlaces.length > 1) return null;
  return literalDraft(text, zone, location, samePlaces[0]?.unit);
}

export function directLocationAnswer(
  state: Snapshot,
  question: string,
): LocationAnswer | null {
  const target = parseLocationQuestion(question);
  if (!target) return null;
  const catalog = verifiedLocations(state);
  if (!catalog) return null;
  const matches = catalog.filter(
    (entry) =>
      entry.object === target.object &&
      (!target.color || !entry.color || entry.color === target.color),
  );
  if (!matches.length) return { kind: "absent" };
  if (
    matches.length !== 1 ||
    (target.color && matches[0]!.color !== target.color)
  )
    return { kind: "ambiguous" };
  const [result] = matches;
  return { kind: "match", place: result!.place, unitId: result!.unit.id };
}

export function directLocationCorrection(
  state: Snapshot,
  targetId: string,
  text: string,
  zone: string,
): Draft | null {
  const replacement = parseCurrentLocation(text);
  if (!replacement) return null;
  const catalog = verifiedLocations(state);
  if (!catalog) return null;
  const target = catalog.find((entry) => entry.unit.id === targetId);
  if (!target || !sameObject(target, replacement)) return null;
  if (
    catalog.some(
      (entry) =>
        entry.unit.id !== targetId &&
        entry.object === target.object &&
        (!target.color || !entry.color || sameObject(entry, target)),
    )
  )
    return null;
  return literalDraft(text, zone, replacement);
}
