import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { InterpretationError } from "../ai/contracts.ts";
import type { StructuredModel } from "../ai/contracts.ts";

/** Evaluation only: official Codex CLI, ChatGPT login, no tools, no API key/provider config. */
export class SubscriptionModel implements StructuredModel {
  calls = 0;
  readonly model = "gpt-6.1-sol";
  readonly reasoning: "high" | "medium";
  private readonly executable: string;
  private readonly directory: string;
  private constructor(
    executable: string,
    directory: string,
    reasoning: "high" | "medium",
  ) {
    this.executable = executable;
    this.directory = directory;
    this.reasoning = reasoning;
  }

  static async open(reasoning: "high" | "medium" = "high") {
    if (
      ["DEBUG", "NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING"].some(
        (name) => process.env[name],
      )
    )
      throw new InterpretationError("SUBSCRIPTION_TRACING_FORBIDDEN");
    const executable = process.env.KIOKU_CODEX_EXECUTABLE;
    if (!executable?.endsWith("codex.exe"))
      throw new InterpretationError("SUBSCRIPTION_EXECUTABLE_REQUIRED");
    const model = new SubscriptionModel(
      executable,
      await mkdtemp(join(tmpdir(), "kioku-subscription-eval-")),
      reasoning,
    );
    const status = await model.run(["login", "status"]);
    if (!/Logged in using ChatGPT/u.test(status.stderr + status.stdout))
      throw new InterpretationError("SUBSCRIPTION_CHATGPT_LOGIN_REQUIRED");
    return model;
  }

  async call<T>(
    stage: string,
    instructions: string,
    data: unknown,
    schema: z.ZodType<T>,
    _maxTokens?: number,
  ): Promise<T> {
    if (++this.calls > 48)
      throw new InterpretationError("SUBSCRIPTION_CALL_LIMIT");
    const stem = join(this.directory, `call-${this.calls}`);
    const schemaPath = `${stem}.schema.json`;
    const answerPath = `${stem}.answer.json`;
    await writeFile(schemaPath, JSON.stringify(z.toJSONSchema(schema)));
    const result = await this.run(
      [
        "exec",
        "--ignore-user-config",
        "--ephemeral",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--disable",
        "shell_tool",
        "--disable",
        "multi_agent",
        "--disable",
        "multi_agent_v2",
        "--disable",
        "enable_mcp_apps",
        "-c",
        'web_search="disabled"',
        "-c",
        `model_reasoning_effort="${this.reasoning}"`,
        "--model",
        this.model,
        "--output-schema",
        schemaPath,
        "--output-last-message",
        answerPath,
        "--json",
        "-",
      ],
      JSON.stringify({
        task: "Synthetic structured inference only. Follow instructions on data. Return only the requested JSON. Never use tools, access files, execute commands, delegate work or perform external actions.",
        stage,
        instructions,
        data,
      }),
    );
    const events: { type?: string; item?: { type?: string } }[] = result.stdout
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    if (
      events.some(
        (event) =>
          event.item?.type &&
          !["agent_message", "reasoning"].includes(event.item.type),
      )
    )
      throw new InterpretationError("SUBSCRIPTION_TOOLS_FORBIDDEN");
    return schema.parse(JSON.parse(await readFile(answerPath, "utf8")));
  }

  private run(
    args: string[],
    input?: string,
  ): Promise<{ stdout: string; stderr: string }> {
    const environment = { ...process.env };
    for (const name of [
      "OPENAI_API_KEY",
      "OPENAI_BASE_URL",
      "CODEX_API_KEY",
      "AZURE_OPENAI_API_KEY",
      "AZURE_OPENAI_ENDPOINT",
    ])
      delete environment[name];
    return new Promise((resolve, reject) => {
      const child = spawn(this.executable, args, {
        cwd: this.directory,
        env: environment,
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "",
        stderr = "",
        timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, 120_000);
      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
        if (stdout.length > 1_048_576) child.kill();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
        if (stderr.length > 1_048_576) child.kill();
      });
      child.once("error", () => {
        clearTimeout(timer);
        reject(new InterpretationError("SUBSCRIPTION_LAUNCH_UNAVAILABLE"));
      });
      child.once("close", (code) => {
        clearTimeout(timer);
        if (code !== 0)
          reject(
            new InterpretationError(
              timedOut
                ? "SUBSCRIPTION_TIMEOUT"
                : /(?:invalid|unsupported|invalid_json_schema)[\s\S]{0,160}schema|schema[\s\S]{0,160}(?:invalid|unsupported|required)/iu.test(
                      stderr + stdout,
                    )
                  ? "SUBSCRIPTION_SCHEMA_UNSUPPORTED"
                  : /usage limit|quota exceeded|rate limit/iu.test(
                        stderr + stdout,
                      )
                    ? "SUBSCRIPTION_LIMIT"
                    : "SUBSCRIPTION_INFERENCE_FAILED",
            ),
          );
        else resolve({ stdout, stderr });
      });
      child.stdin.end(input);
    });
  }
}
