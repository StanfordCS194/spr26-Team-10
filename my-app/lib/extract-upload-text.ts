import { Buffer } from "node:buffer";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { PDFParse } from "pdf-parse";

const VISION_MODEL = "gpt-4o-mini";
const MAX_STORED_CHARS = 120_000;

function mimeFromFile(file: File): string {
  if (file.type) return file.type;
  const n = file.name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

function isRasterImage(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t.startsWith("image/") && t !== "image/svg+xml") return true;
  const n = file.name.toLowerCase();
  return (
    n.endsWith(".png") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".webp") ||
    n.endsWith(".gif")
  );
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text ?? "").trim();
  } finally {
    await parser.destroy().catch(() => {});
  }
}

async function extractImageTextWithVision(
  file: File,
  buffer: Buffer,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return "";
  }

  const mime = mimeFromFile(file);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mime};base64,${base64}`;

  const { text } = await generateText({
    model: openai(VISION_MODEL),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: [
              "You are helping users understand a government or official form.",
              "Transcribe all readable text from this image in document order.",
              "Preserve line breaks where they help map to the form layout.",
              "If there is no readable text (blank or unreadable), reply with exactly: NO_TEXT",
              "Do not add commentary before or after the transcription.",
            ].join(" "),
          },
          { type: "image", image: dataUrl },
        ],
      },
    ],
  });

  const trimmed = text.trim();
  if (!trimmed || trimmed === "NO_TEXT") return "";
  return trimmed;
}

function clipForStorage(text: string): string {
  if (text.length <= MAX_STORED_CHARS) return text;
  return `${text.slice(0, MAX_STORED_CHARS)}\n\n[Text truncated at upload for storage limits.]`;
}

export type ExtractUploadTextResult = {
  /** Text stored into documents.ocr_text (after clipping). */
  ocrText: string;
  /** Raw extracted text before merging with filename hints (unclipped). */
  extractedRaw: string;
  source: "pdf" | "image-vision" | "none";
};

/**
 * Pulls text from an upload so chat can ground on real content before dedicated OCR ships.
 * PDFs: embedded text via pdf-parse. Photos: OpenAI vision when OPENAI_API_KEY is set.
 */
export async function extractUploadText(
  file: File,
  filenameHintText: string,
): Promise<ExtractUploadTextResult> {
  const buffer = Buffer.from(await file.arrayBuffer());

  let extracted = "";
  let source: ExtractUploadTextResult["source"] = "none";

  if (isPdf(file)) {
    try {
      extracted = await extractPdfText(buffer);
      if (extracted.length > 0) source = "pdf";
    } catch {
      extracted = "";
    }
  } else if (isRasterImage(file)) {
    try {
      extracted = await extractImageTextWithVision(file, buffer);
      if (extracted.length > 0) source = "image-vision";
    } catch {
      extracted = "";
    }
  }

  const hint = filenameHintText.trim();
  let ocrText: string;

  if (extracted.length >= 80) {
    ocrText = clipForStorage(extracted);
  } else if (extracted.length > 0) {
    ocrText = clipForStorage(
      hint
        ? `${hint}\n\n--- Extracted text (short or partial) ---\n${extracted}`
        : extracted,
    );
  } else {
    ocrText = hint;
  }

  return { ocrText, extractedRaw: extracted, source };
}
