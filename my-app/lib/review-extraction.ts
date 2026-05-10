import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { ReviewField } from "@/types/review-field";

export type { ReviewField, ReviewFieldIcon } from "@/types/review-field";

export const reviewFieldIconSchema = z.enum([
  "file",
  "user",
  "map",
  "calendar",
  "money",
  "alert",
]);

const extractionSchema = z.object({
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
          .describe("What the app understood — one line when possible"),
        icon: reviewFieldIconSchema.describe(
          "file=form/doc type, user=who it is for, map=jurisdiction/place, calendar=dates, money=fees, alert=deadlines/warnings",
        ),
      }),
    )
    .min(3)
    .max(7),
});

export type AiExtractionPayload = {
  fields: ReviewField[];
  generatedAt: string;
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  zh: "Chinese (Simplified)",
  ar: "Arabic",
  fr: "French",
};

/**
 * Uses the same OpenAI model family as chat to propose structured review rows
 * from filename + heuristic metadata only (no real OCR required).
 */
export async function extractReviewFieldsFromUploadContext(input: {
  fileName: string;
  formType: string;
  formDescription: string;
  ocrText: string;
  language: string;
}): Promise<ReviewField[]> {
  const languageName = LANGUAGE_NAMES[input.language] ?? LANGUAGE_NAMES.en;

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: extractionSchema,
    prompt: [
      "You help build a review screen for formly.ai, an app that helps people understand government forms.",
      "You do NOT have real OCR text yet. You only have:",
      `- File name: ${input.fileName}`,
      `- Heuristic form type: ${input.formType}`,
      `- Heuristic description: ${input.formDescription}`,
      `- Placeholder / summary text (may be generic): ${input.ocrText || "(none)"}`,
      "",
      `Write every field "label" and "value" in ${languageName}.`,
      "",
      "Return 4 to 7 structured fields the user should confirm before chatting.",
      "Include things like: document type, likely agency or program, what the form is generally for, important deadlines or dates if reasonably inferable from the filename/hints, fees if relevant, and one row for key warnings (e.g. time-sensitive) when plausible.",
      "",
      "Safety:",
      "- Never invent a real person's name, street address, SSN, passport number, or case number.",
      "- If something is unknown, say so plainly (e.g. \"Not available until the document is read\" or \"Unknown from filename only\").",
      "- Do not claim you read the document; you only inferred from metadata.",
      "",
      "icon rules:",
      "- file: form or document category",
      "- user: who the form is for (taxpayer, applicant, etc.) — use only generic wording if unknown",
      "- map: jurisdiction, country, or location context",
      "- calendar: dates, deadlines, tax year",
      "- money: fees, payments",
      "- alert: risks, strict deadlines, or \"verify this\" items",
    ].join("\n"),
  });

  return object.fields.map((f) => ({
    key: f.key.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
    label: f.label.trim(),
    value: f.value.trim(),
    icon: f.icon,
  }));
}
