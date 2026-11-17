import { strToU8 } from "fflate";
import { syntheticDocx, syntheticPdf } from "../unit/reference-fixtures.js";
import { SourceError } from "../../src/references/contracts.js";

/** These bytes are generated fixtures, never read from the owner's files or internet. */
export const pilotFiles = [
  {
    title: "Itinerario ficticio.txt",
    format: "text",
    bytes: strToU8("Nara visitará el planetario ficticio el sábado."),
  },
  {
    title: "Notas ficticias.md",
    format: "markdown",
    bytes: strToU8("# Manual ficticio\nLira comprará un cuaderno violeta."),
  },
  { title: "Viaje ficticio.pdf", format: "pdf", bytes: syntheticPdf() },
  { title: "Manual ficticio.docx", format: "docx", bytes: syntheticDocx() },
] as const;

export function pilotWeb(url: string) {
  if (url !== "https://kioku.example.test/guia")
    throw new SourceError("unsupported");
  return {
    title: "Guía web ficticia",
    format: "html" as const,
    bytes: strToU8(
      "<main><h1>Guía ficticia de Nara</h1><p>El museo ficticio abre a las diez. La entrada cuesta tres fichas azules.</p></main>",
    ),
  };
}
