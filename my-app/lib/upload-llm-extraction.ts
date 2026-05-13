import { Buffer } from "node:buffer";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import type { ModelMessage } from "ai";
import { z } from "zod";
import type { ReviewField, ReviewFieldIcon } from "@/types/review-field";

const EXTRACT_MODEL = "gpt-4o-mini";
const MAX_STORED_SUMMARY = 120_000;
const MAX_LLM_FILE_BYTES = 20 * 1024 * 1024;

export type UploadFileMeta = { name: string; type: string };

const reviewFieldIconSchema = z.enum([
  "file",
  "user",
  "map",
  "calendar",
  "money",
  "alert",
]);

const extractionSchema = z.object({
  documentSummary: z
    .string()
    .describe(
      "Plain-language summary of what the document is and the main readable content the user should know for follow-up chat. Do not invent PII (names, addresses, SSNs, case numbers). If text is unreadable, say so.",
    ),
  fields: z
    .array(
      z.object({
        key: z
          .string()
          .describe(
            "Unique snake_case id, e.g. document_type, agency, purpose",
          ),
        label: z.string().describe("Short label for the review row"),
        value: z
          .string()
          .describe("What you understood from the file — one line when possible"),
        icon: reviewFieldIconSchema.describe(
          "file=form/doc type, user=who it is for, map=jurisdiction/place, calendar=dates, money=fees, alert=deadlines/warnings",
        ),
      }),
    )
    .min(3)
    .max(7),
});

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  zh: "Chinese (Simplified)",
  ar: "Arabic",
  fr: "French",
};

function mimeFromMeta(meta: UploadFileMeta): string {
  if (meta.type) return meta.type;
  const n = meta.name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function canAttachFile(buffer: Buffer, mime: string): boolean {
  if (buffer.length === 0 || buffer.length > MAX_LLM_FILE_BYTES) return false;
  if (mime === "application/pdf") return true;
  if (mime.startsWith("image/") && mime !== "image/svg+xml") return true;
  return false;
}

function clipSummary(text: string): string {
  if (text.length <= MAX_STORED_SUMMARY) return text;
  return `${text.slice(0, MAX_STORED_SUMMARY)}\n\n[Summary truncated for storage limits.]`;
}

export function dedupeFieldKeys(fields: ReviewField[]): ReviewField[] {
  const seen = new Set<string>();
  return fields.map((f) => {
    let key = f.key;
    let n = 2;
    while (seen.has(key)) {
      key = `${f.key}_${n}`;
      n += 1;
    }
    seen.add(key);
    return { ...f, key };
  });
}

/**
 * One multimodal LLM call: reads the uploaded file (PDF or image) and returns
 * stored document summary text plus structured review rows for step 2.
 */
export async function extractDocumentAndReviewFromUpload(input: {
  buffer: Buffer;
  meta: UploadFileMeta;
  language: string;
  formType: string;
  formDescription: string;
  heuristicHint: string;
}): Promise<{ documentSummary: string; fields: ReviewField[] }> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY for document extraction");
  }

  const languageName = LANGUAGE_NAMES[input.language] ?? LANGUAGE_NAMES.en;
  const mime = mimeFromMeta(input.meta);
  const attach = canAttachFile(input.buffer, mime);

  const instruction = [
    "You help formly.ai, an app that helps people understand U.S. government and official forms.",
    "You are given the uploaded file (when attached) plus filename and heuristic hints.",
    "",
    "Heuristic hints (may be wrong — trust the file when it disagrees):",
    `- File name: ${input.meta.name}`,
    `- Suggested form type: ${input.formType}`,
    `- Suggested description: ${input.formDescription}`,
    `- Starter hint (if file is missing or unreadable): ${input.heuristicHint}`,
    "",
    `Write every field "label" and "value" in ${languageName}.`,
    "Return 4 to 7 structured fields the user should confirm before chatting.",
    "Include: document type / program, who it is for (generic wording), jurisdiction or agency if visible, dates or deadlines if visible, fees if visible, and one alert row for risks or \"verify this\" when plausible.",
    "",
    "documentSummary:",
    "- Plain language, for chat context.",
    "- Summarize what the document is and key visible requirements or sections.",
    "- Never invent real PII; quote only what is clearly visible.",
    "",
    "If the file was not attached (too large or unsupported type), infer only from the hints and say clearly that the file could not be read.",
  ].join("\n");

  const userContent = attach
    ? [
        { type: "text" as const, text: instruction },
        {
          type: "file" as const,
          data: input.buffer,
          mediaType: mime,
          filename: input.meta.name,
        },
      ]
    : [{ type: "text" as const, text: instruction }];

  const messages: ModelMessage[] = [{ role: "user", content: userContent }];

  const { object } = await generateObject({
    model: openai(EXTRACT_MODEL),
    schema: extractionSchema,
    messages,
  });

  const fields: ReviewField[] = object.fields.map((f) => ({
    key: f.key.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
    label: f.label.trim(),
    value: f.value.trim(),
    icon: f.icon as ReviewFieldIcon,
  }));

  return {
    documentSummary: clipSummary(object.documentSummary.trim()),
    fields: dedupeFieldKeys(fields),
  };
}
