import type { Auth } from "firebase-admin/auth";
import { AccountError } from "../account/contracts.js";
import type { VerifiedIdentity } from "../account/contracts.js";

const rejected = new Set([
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/user-disabled",
  "auth/user-not-found",
  "auth/argument-error",
]);

export async function verifyIdentity(
  auth: Auth,
  header: string | undefined,
): Promise<VerifiedIdentity> {
  if (!header?.startsWith("Bearer ") || header.length > 8192) {
    throw new AccountError("unauthenticated");
  }
  try {
    const token = await auth.verifyIdToken(header.slice(7), true);
    return {
      uid: token.uid,
      email: token.email,
      emailVerified: token.email_verified === true,
      provider: token.firebase.sign_in_provider,
    };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : undefined;
    throw new AccountError(
      typeof code === "string" && rejected.has(code)
        ? "unauthenticated"
        : "unavailable",
    );
  }
}
