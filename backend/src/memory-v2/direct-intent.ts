import { normalizeQuestion } from "#memory-v2/ai/query-input";
import type { Route } from "./route-contracts.js";

const personalPlans =
  /^(?:qu[eé] (?:quiero hacer|tengo que hacer|tengo pendiente|planes tengo|citas tengo|tareas tengo))(?: para (?:hoy|ma[nñ]ana|esta semana|la pr[oó]xima semana))?$/iu;
const modifier =
  "(?:azul|verde|roj[oa]|violeta|morad[oa]|negr[oa]|blanc[oa]|gris|amarill[oa]|naranja|pequeñ[oa]|grande)";
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
const attributed =
  /^(?:[Qq]u[eé] me (?:dijo|recomend[oó]|aconsej[oó]|explic[oó]) (?:ayer|hoy) (?:(?:mi|el|la) (?:profesor(?:a)?|m[eé]dic[oa]|psiquiatra|tutor(?:a)?)(?: fictici[oa])?(?: [\p{Lu}][\p{Ll}\p{M}]{1,24})?|[\p{Lu}][\p{Ll}\p{M}]{1,24}))$/u;

/** Only complete clauses in the explicitly chosen mode can bypass intent inference. */
export function directIntent(
  input: Pick<Route, "mode" | "text">,
): "ask" | "tell" | null {
  if (input.text.length > 160 || /[\r\n\t]/u.test(input.text)) return null;
  const text = input.text.normalize("NFC").trim();
  if (input.mode === "tell") return itemLocation.test(text) ? "tell" : null;
  const question = normalizeQuestion(text).match(/^¿([^¿?]+)\?$/u)?.[1];
  if (!question) return null;
  return personalPlans.test(question) ||
    objectQuestion.test(question) ||
    attributed.test(question)
    ? "ask"
    : null;
}
