import { z } from "zod";

export const limits = Object.freeze({
  bytes: 10 * 1024 * 1024,
  characters: 200_000,
  pages: 200,
  chunks: 128,
  chunk: 2000,
  sources: 100,
});
export type SourceIssue =
  | "invalid"
  | "unsupported"
  | "no-text"
  | "too-large"
  | "interrupted"
  | "unavailable"
  | "denied"
  | "conflict"
  | "retired";
export class SourceError extends Error {
  readonly issue: SourceIssue;
  constructor(issue: SourceIssue) {
    super(issue);
    this.issue = issue;
  }
}
export const formatSchema = z.enum(["text", "markdown", "pdf", "docx", "html"]);
export type SourceFormat = z.infer<typeof formatSchema>;
export const locatorSchema = z.strictObject({
  kind: z.enum(["page", "paragraph", "line", "section"]),
  number: z.int().min(1).max(200_000),
});
export const chunkSchema = z.strictObject({
  index: z.int().min(0).max(127),
  text: z.string().min(1).max(limits.chunk),
  locator: locatorSchema,
});
export const documentSchema = z.strictObject({
  format: formatSchema,
  extractorVersion: z.literal(1),
  coverage: z.enum(["text", "partial"]),
  chunks: z.array(chunkSchema).min(1).max(limits.chunks),
});
export type ExtractedDocument = z.infer<typeof documentSchema>;
export type TextBlock = {
  text: string;
  locator: z.infer<typeof locatorSchema>;
};
export const importSchema = z.strictObject({
  apiVersion: z.literal(1),
  requestId: z.uuid(),
  title: z.string().trim().min(1).max(200),
  format: formatSchema,
  bytes: z
    .string()
    .min(1)
    .max(Math.ceil(limits.bytes / 3) * 4),
});
export type ImportCommand = z.infer<typeof importSchema>;

export function decodeSource(command: ImportCommand): Uint8Array {
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(
      command.bytes,
    )
  )
    throw new SourceError("invalid");
  const bytes = Buffer.from(command.bytes, "base64");
  if (bytes.length === 0 || bytes.length > limits.bytes)
    throw new SourceError("too-large");
  return new Uint8Array(bytes);
}
