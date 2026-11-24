import { normalizeQuestion } from "#memory-v2/ai/query-input";
import type { Route } from "./route-contracts.js";
import { requestedLiteral } from "./literal-query.js";

const personalPlans =
  /^(?:qu[eé] (?:quiero hacer|tengo que hacer|tengo pendiente|planes tengo|citas tengo|tareas tengo))(?: para (?:hoy|ma[nñ]ana|esta semana|la pr[oó]xima semana))?$/iu;
const color =
  "(?:azul|verde|roj[oa]|violeta|morad[oa]|negr[oa]|blanc[oa]|gris|amarill[oa]|naranja)";
const modifier = `(?:${color}|pequeñ[oa]|grande)`;
const object =
  "(?:paraguas|br[uú]jula|carpeta|llave|mochila|cuaderno|libro|cartera|abrigo|maleta|bicicleta|m[oó]vil|pasaporte|documento|reloj|bolso|cargador|mando|tel[eé]fono|ordenador)";
const item = `(?:mi|el|la) ${object}(?: ${modifier})?`;
const objectQuestion = new RegExp(
  `^(?:d[oó]nde (?:est[aá]|guard[eé]|dej[eé])|de qu[eé] color es) ${item}$`,
  "iu",
);
const place =
  "(?:caj[oó]n|armario|recibidor|cocina|comedor|sal[oó]n|habitaci[oó]n|mesa|estante|estanter[ií]a|garaje|coche|bolso|mochila|caja|maleta)";
const itemLocation = new RegExp(
  `^(?:${item} (?:est[aá]|se encuentra)|(?:guard[eé]|dej[eé]|he guardado|he dejado) ${item}) en (?:mi|el|la) ${place}(?: ${modifier})?[.]?$`,
  "iu",
);
const ownObject = `mi (?<object>${object})(?: (?<color>${color}))?`;
const currentLocation = new RegExp(
  `^${ownObject} (?:est[aá]|se encuentra) en (?<place>(?:el|la) ${place}(?: ${modifier})?)[.]?$`,
  "iu",
);
const whereIs = new RegExp(`^¿d[oó]nde est[aá] ${ownObject}\\?$`, "iu");
const colorFact = new RegExp(
  `^mi (?<object>${object}) es (?:de color )?(?<color>${color})[.]?$`,
  "iu",
);
const colorQuestion = new RegExp(
  `^¿?(?:(?:me puedes decir|puedes decirme|podr[ií]as decirme) )?` +
    `(?:de qu[eé] color es|qu[eé] color tiene|cu[aá]l es el color de) mi (?<object>${object})\\??$`,
  "iu",
);

export interface LocationObject {
  object: string;
  color: string | null;
}

function objectFromMatch(groups: Record<string, string>): LocationObject {
  const color = groups.color ? locationKey(groups.color) : null;
  return {
    object: locationKey(groups.object!),
    color: color?.replace(/^(roj|morad|negr|blanc|amarill)a$/u, "$1o") ?? null,
  };
}

export function locationKey(text: string) {
  return text
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0301]/gu, "")
    .normalize("NFC");
}

export function parseCurrentLocation(
  text: string,
): (LocationObject & { place: string }) | null {
  const match = boundedClause(text)?.match(currentLocation)?.groups;
  return match ? { ...objectFromMatch(match), place: match.place! } : null;
}

export function parseLocationQuestion(text: string): LocationObject | null {
  const clause = boundedClause(text);
  const match = clause
    ? normalizeQuestion(clause).match(whereIs)?.groups
    : null;
  return match ? objectFromMatch(match) : null;
}

export function parseObjectFact(text: string) {
  const colorMatch = boundedClause(text)?.match(colorFact)?.groups;
  return colorMatch
    ? { ...objectFromMatch(colorMatch), place: null }
    : parseCurrentLocation(text);
}

export function parseColorQuestion(text: string): LocationObject | null {
  const clause = boundedClause(text);
  const match = clause
    ? normalizeQuestion(clause).match(colorQuestion)?.groups
    : null;
  return match ? objectFromMatch(match) : null;
}

function boundedClause(text: string) {
  return text.length <= 160 && !/[\r\n\t]/u.test(text)
    ? text.normalize("NFC").trim()
    : null;
}
const attributed =
  /^(?:[Qq]u[eé] me (?:dijo|recomend[oó]|aconsej[oó]|explic[oó]) (?:ayer|hoy) (?:(?:mi|el|la) (?:profesor(?:a)?|m[eé]dic[oa]|psiquiatra|tutor(?:a)?)(?: fictici[oa])?(?: [\p{Lu}][\p{Ll}\p{M}]{1,24})?|[\p{Lu}][\p{Ll}\p{M}]{1,24}))$/u;

/** Only complete clauses in the explicitly chosen mode can bypass intent inference. */
export function directIntent(
  input: Pick<Route, "mode" | "text">,
): "ask" | "tell" | null {
  const text = boundedClause(input.text);
  if (!text) return null;
  if (input.mode === "tell")
    return itemLocation.test(text) || colorFact.test(text) ? "tell" : null;
  const normalized = normalizeQuestion(text);
  if (requestedLiteral(text) || colorQuestion.test(normalized)) return "ask";
  const question = normalized.match(/^¿([^¿?]+)\?$/u)?.[1];
  if (!question) return null;
  return personalPlans.test(question) ||
    objectQuestion.test(question) ||
    attributed.test(question)
    ? "ask"
    : null;
}
