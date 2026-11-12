import test from "node:test";
import assert from "node:assert/strict";
import { validateAttribution } from "../src/capture-evidence.ts";
import type { Item } from "../src/domain.ts";
import { unknownTime } from "../src/temporal.ts";

const item: Item = {
  text: "Sora dijo que viajaría a Lisboa.",
  quote: "Sora me dijo que viajaría a Lisboa.",
  kind: "intention",
  entities: ["Sora"],
  time: unknownTime,
  provenance: "reported",
  attribution: "Sora",
  attributionEvidence: "Sora me dijo",
  eventStatus: "planned",
  lifecycle: "current",
};
test("a reported attribution needs its literal source evidence and cannot become an owner's implicit attribution", () => {
  validateAttribution(item, item.quote);
  assert.throws(
    () =>
      validateAttribution({ ...item, attributionEvidence: null }, item.quote),
    /EVIDENCE_REQUIRED/,
  );
  assert.throws(
    () =>
      validateAttribution(
        { ...item, attributionEvidence: "Sora confirmó" },
        item.quote,
      ),
    /QUOTE_INVALID/,
  );
  assert.throws(
    () => validateAttribution({ ...item, attribution: "Nami" }, item.quote),
    /NOT_IN_EVIDENCE/,
  );
  assert.throws(
    () => validateAttribution({ ...item, provenance: "personal" }, item.quote),
    /PERSONAL_ATTRIBUTION/,
  );
  validateAttribution(
    {
      ...item,
      provenance: "personal",
      attribution: null,
      attributionEvidence: null,
    },
    item.quote,
  );
});
