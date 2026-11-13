import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { GoogleCredentialVault } from "../credential/google-vault.js";
import { OpenAiCredentialValidator } from "../credential/openai-validator.js";
import { PromoteCredential } from "../credential/promote-credential.js";
import {
  CREDENTIAL_PROJECT,
  SECRET_NAME,
  FirestoreCredentialStore,
} from "../firebase/credential-store.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (
    args.length !== 2 ||
    args[0] !== "--apply" ||
    !/^(0|[1-9][0-9]{0,5})$/.test(args[1] ?? "")
  ) {
    console.log(
      "Operator setup: --apply <expectedRevision>. Requires Google ADC, explicit approval and an existing owner/secret.",
    );
    return;
  }
  if (
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FUNCTIONS_EMULATOR
  ) {
    throw new Error("Mixed setup environment");
  }
  if (
    ["NODE_DEBUG", "GRPC_TRACE", "GOOGLE_SDK_NODE_LOGGING", "DEBUG"].some(
      (name) => process.env[name],
    )
  ) {
    throw new Error(
      "Secret setup requires diagnostics without request payload tracing",
    );
  }
  const envPath = fileURLToPath(
    new URL("../../../../.env.local", import.meta.url),
  );
  const key = parseEnv(await readFile(envPath, "utf8")).OPENAI_API_KEY;
  if (!key) throw new Error("Missing private credential");
  const app = initializeApp(
    { projectId: CREDENTIAL_PROJECT },
    "kioku-operator",
  );
  const db = getFirestore(app);
  const secrets = new SecretManagerServiceClient({
    apiEndpoint: "secretmanager.googleapis.com",
    universeDomain: "googleapis.com",
  });
  try {
    const [parent] = await secrets.getSecret(
      { name: `projects/${CREDENTIAL_PROJECT}/secrets/${SECRET_NAME}` },
      { timeout: 10_000, retry: null },
    );
    const regions = parent.replication?.userManaged?.replicas?.map(
      (replica) => replica.location,
    );
    if (regions?.length !== 1 || regions[0] !== "europe-west1")
      throw new Error("Unexpected secret location");
    const owner = await db.doc("privateConfiguration/owner").get();
    const uid: unknown = owner.get("uid");
    if (typeof uid !== "string" || owner.get("enabled") !== true)
      throw new Error("Missing authorized owner");
    const service = new PromoteCredential(
      new FirestoreCredentialStore(db),
      new GoogleCredentialVault(secrets),
      new OpenAiCredentialValidator(),
      Date.now,
    );
    const result = await service.execute({
      uid,
      expectedRevision: Number(args[1]),
      operationId: randomUUID(),
      key,
    });
    console.log(
      `Credential configured on server; revision ${result.revision}. No secret returned.`,
    );
  } finally {
    await secrets.close();
    await db.terminate();
    await deleteApp(app);
  }
}

main().catch(() => {
  console.error(
    "Credential setup did not complete. Existing configuration is preserved unless an uncertain commit succeeded; inspect safe server metadata before retrying.",
  );
  process.exitCode = 1;
});
