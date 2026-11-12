import { createInterface } from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { stdin, stdout } from "node:process";
import { MemoryEngine } from "./engine.ts";
import type { Turn } from "./domain.ts";
import { JsonMemoryRepository } from "./repository.ts";
import { openRuntime, reportError } from "./runtime.ts";

async function main(): Promise<void> {
  if (!process.argv.includes("--live")) {
    console.log(
      "Prototipo M0: usa --live para conectar OpenAI. Solo datos ficticios; límite acumulado: 2 USD.",
    );
    return;
  }
  const runtime = await openRuntime(true);
  const engine = new MemoryEngine(
    new JsonMemoryRepository("local-data/m0/interactive-v3"),
    runtime.intelligence,
  );
  const terminal = createInterface({ input: stdin, output: stdout });
  let pending: Turn | null = null;
  console.log(
    "M0, solo datos ficticios. /contar texto, /preguntar texto, /aclarar texto, /olvidar ID, /salir.",
  );
  try {
    for (;;) {
      const line = (await terminal.question("Kioku > ")).trim();
      if (line === "/salir") break;
      const separator = line.indexOf(" ");
      const command = line.slice(0, separator);
      const text = separator >= 0 ? line.slice(separator + 1) : "";
      try {
        if (command === "/contar") {
          const turn = {
            id: randomUUID(),
            text,
            receivedAt: new Date().toISOString(),
            zone: "Europe/Madrid",
          };
          const result = await engine.tell(turn);
          pending = result.status === "needs_clarification" ? turn : null;
          console.log(result.clarification ?? `${result.status} · ${turn.id}`);
        } else if (command === "/aclarar" && pending) {
          const result = await engine.tell(pending, text);
          console.log(
            result.clarification ?? `${result.status} · ${pending.id}`,
          );
          if (result.status !== "needs_clarification") pending = null;
        } else if (command === "/preguntar") {
          const result = await engine.ask(text, new Date().toISOString());
          console.log(result.answer.answer);
          console.log(
            `Fuentes: ${result.answer.sourceIds.join(", ") || "ninguna"}`,
          );
        } else if (command === "/olvidar") {
          await engine.forget(text);
          console.log("Fuente y recuerdos derivados retirados del prototipo.");
        } else
          console.log("Usa /contar, /preguntar, /aclarar, /olvidar o /salir.");
      } catch (error) {
        reportError(error);
      }
    }
  } finally {
    terminal.close();
    await runtime.close();
  }
}

main().catch(reportError);
