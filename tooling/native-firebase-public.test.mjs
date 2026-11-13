import { test } from "node:test";
import assert from "node:assert/strict";
import { validateNativeFirebase } from "./native-firebase-public.mjs";

const data = {
    PROJECT_ID: "kioku-9454f",
    BUNDLE_ID: "io.github.dejitarunoseireinoapuri.kioku",
    API_KEY: "AIza" + "A".repeat(35),
};

test("public native Firebase configuration is accepted", () => {
    assert.equal(validateNativeFirebase(data), data);
});

test("private provider keys, unknown fields and wrong identities cannot enter the product", () => {
    for (const value of [
        null,
        { ...data, PROJECT_ID: "other" },
        { ...data, OPENAI_API_KEY: "synthetic" },
        { ...data, BUNDLE_ID: "other" },
        { ...data, API_KEY: "sk-" + "synthetic".repeat(5) },
        { ...data, CLIENT_ID: "sk-" + "synthetic".repeat(5) },
    ]) {
        assert.throws(() => validateNativeFirebase(value), {
            message: "Native Firebase configuration rejected; values omitted.",
        });
    }
});
