import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { projectId } from "./helpers.js";

const environment = await initializeTestEnvironment({
  projectId,
  firestore: {
    host: "127.0.0.1",
    port: 8087,
    rules: await readFile("../firestore.rules", "utf8"),
  },
});
after(async () => {
  await environment.cleanup();
});

test("server fixture writes succeed while all clients are denied canonical reads and writes", async () => {
  const paths = [
    "accounts/owner",
    "accounts/owner/sources/source",
    "accounts/owner/memories/memory",
    "accounts/owner/operations/receipt",
    "accounts/owner/runtime/capture",
    "accounts/owner/usage/day",
    "accounts/other/memories/memory",
    "privateConfiguration/owner",
    "privateConfiguration/search",
    "indexes/projection",
    "operations/receipt",
    "credentials/metadata",
    "unknown/path",
  ];
  await environment.withSecurityRulesDisabled(async (context) => {
    for (const path of paths) {
      await assertSucceeds(
        setDoc(doc(context.firestore(), path), { fixture: true }),
      );
    }
  });
  for (const context of [
    environment.unauthenticatedContext(),
    environment.authenticatedContext("owner"),
    environment.authenticatedContext("other"),
  ]) {
    const firestore = context.firestore();
    for (const path of paths) {
      const reference = doc(firestore, path);
      await assertFails(getDoc(reference));
      await assertFails(setDoc(reference, { fixture: false }));
      await assertFails(updateDoc(reference, { fixture: false }));
      await assertFails(deleteDoc(reference));
    }
    await assertFails(
      getDocs(collection(firestore, "accounts/owner/memories")),
    );
  }
});
