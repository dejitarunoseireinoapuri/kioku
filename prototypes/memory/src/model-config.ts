import { MemoryError } from "./domain.ts";

// Fixed comparison profiles, verified in official model documentation on 2026-11-12.
const profiles = new Map([
  [
    "gpt-5.4-2026-03-05",
    {
      model: "gpt-5.4-2026-03-05",
      baseInput: 2.5 / 1e6,
      inputCeiling: 2.5 / 1e6,
      output: 15 / 1e6,
    },
  ],
  [
    "gpt-6.1-sol",
    {
      model: "gpt-6.1-sol",
      baseInput: 2 / 1e6,
      inputCeiling: 2.5 / 1e6,
      output: 10 / 1e6,
    },
  ],
]);
const position = process.argv.indexOf("--model");
const requested =
  position < 0 ? "gpt-5.4-2026-03-05" : process.argv[position + 1];
const selected = profiles.get(requested ?? "");
if (!selected) throw new MemoryError("MODEL_PROFILE_INVALID");
export const modelProfile = Object.freeze(selected);
