import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import type { App } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { BackendRuntime } from "../firebase/runtime.js";
import { AccountError } from "../account/contracts.js";
import { GetConfiguration } from "../account/get-configuration.js";
import { verifyIdentity } from "../firebase/verify-identity.js";
import { FirestoreOwnerAccess } from "../firebase/owner-access.js";
import { FirestoreSourceControlStore } from "../firebase/source-control-store.js";
import { memoryProvider } from "../credential/memory-provider.js";
import { parseInput } from "../memory/contracts.js";
import { changeInput, detailsInput } from "./contracts.js";
import { ChangeMemory } from "./change.js";

export function controlCallables(
  app: App,
  db: Firestore,
  runtime: BackendRuntime,
) {
  const store = new FirestoreSourceControlStore(db);
  const change = new ChangeMemory(store);
  const access = new GetConfiguration(
    runtime.allowedEmail,
    new FirestoreOwnerAccess(db),
    Date.now,
  );
  const protect = (
    costly: boolean,
    action: (
      uid: string,
      data: unknown,
      reauthorize: () => Promise<void>,
    ) => Promise<unknown>,
  ) =>
    onCall(
      {
        region: "europe-west1",
        timeoutSeconds: costly ? 180 : 15,
        maxInstances: 1,
        concurrency: costly ? 4 : 8,
        enforceAppCheck: runtime.production,
        ...(runtime.production
          ? {
              serviceAccount:
                "kioku-runtime@kioku-9454f.iam.gserviceaccount.com",
              invoker: "public",
            }
          : {}),
      },
      async (request) => {
        try {
          if (!request.auth) throw new AccountError("unauthenticated");
          if (
            runtime.production &&
            !runtime.appIds.includes(request.app?.appId ?? "")
          )
            throw new AccountError("permission-denied");
          if (request.rawRequest.rawBody.byteLength > (costly ? 16_000 : 256))
            throw new AccountError("invalid-argument");
          const identity = await verifyIdentity(
            getAuth(app),
            request.rawRequest.get("Authorization"),
          );
          await access.execute(identity, { apiVersion: 1 });
          return await action(identity.uid, request.data, async () => {
            const current = await verifyIdentity(
              getAuth(app),
              request.rawRequest.get("Authorization"),
            );
            if (current.uid !== identity.uid)
              throw new AccountError("permission-denied");
            await access.execute(current, { apiVersion: 1 });
          });
        } catch (error) {
          if (error instanceof AccountError)
            throw new HttpsError(error.code, error.code);
          throw new HttpsError("unavailable", "unavailable");
        }
      },
    );
  return {
    getSourceDetails: protect(false, async (uid, data) => {
      const input = parseInput(detailsInput, data);
      return input.sourceId
        ? store.details(uid, input.sourceId)
        : { apiVersion: 1, memoryEpoch: await store.epoch(uid) };
    }),
    changeMemory: protect(true, async (uid, data, reauthorize) => {
      const input = parseInput(changeInput, data);
      return change.execute(
        uid,
        input,
        () =>
          memoryProvider(
            db,
            uid,
            input.forgetScope === "allOccurrences"
              ? "completeForget"
              : "standard",
          ),
        reauthorize,
      );
    }),
  };
}
