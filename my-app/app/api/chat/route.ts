import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "edge";
export const maxDuration = 30;

type LanguageCode = "en" | "es" | "zh" | "ar" | "fr";

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  es: "Spanish",
  zh: "Chinese (Simplified)",
  ar: "Arabic",
  fr: "French",
};

function getSupabase() {
  return createServerSupabase();
}

const MAX_DOCUMENT_TEXT_IN_PROMPT = 14_000;

/** Load the uploaded document row so the model can answer in context of this user's file. */
async function fetchDocumentContext(documentId: string): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("documents")
    .select("file_name, form_type, form_description, ocr_text, ai_extraction")
    .eq("id", documentId)
    .single();

  if (error || !data) return "";

  const lines: string[] = [];
  lines.push(`File name: ${data.file_name}`);
  if (data.form_type) lines.push(`Inferred form type: ${data.form_type}`);
  if (data.form_description) {
    lines.push(`Inferred description: ${data.form_description}`);
  }

  const extraction = data.ai_extraction as
    | {
        fields?: { label: string; value: string; key?: string }[];
        generatedAt?: string;
      }
    | null
    | undefined;
  if (extraction?.fields?.length) {
    lines.push("User-confirmed AI extraction summary (from review step):");
    for (const row of extraction.fields) {
      lines.push(`- ${row.label}: ${row.value}`);
    }
  }

  const raw = (data.ocr_text ?? "").trim();
  if (raw) {
    const clipped =
      raw.length > MAX_DOCUMENT_TEXT_IN_PROMPT
        ? `${raw.slice(0, MAX_DOCUMENT_TEXT_IN_PROMPT)}\n\n[Text truncated for length.]`
        : raw;
    lines.push(`Text associated with this upload (OCR or summary):\n${clipped}`);
  } else {
    lines.push(
      "(No OCR or extracted text is stored for this upload yet — use the filename and form hints above, and ask the user to name specific lines or sections if needed.)",
    );
  }

  return lines.join("\n");
}

// Pull the top relevant sections from form_reference using full-text search
async function fetchFormContext(query: string): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("form_reference")
    .select("source, content")
    .textSearch("content", query, { type: "websearch", config: "english" })
    .limit(3);

  if (error || !data || data.length === 0) return "";

  return data
    .map((row) => `[${row.source}]\n${row.content}`)
    .join("\n\n---\n\n");
}

// Save a single message to the messages table
async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  const supabase = getSupabase();
  await supabase.from("messages").insert({ session_id: sessionId, role, content });
}

// Get or create a chat session for a document
async function getOrCreateSession(
  documentId: string,
  language: string
): Promise<string> {
  const supabase = getSupabase();

  // Reuse existing session for this document
  const { data: existing } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing.id;

  // Create a new session
  const { data: created, error } = await supabase
    .from("chat_sessions")
    .insert({ document_id: documentId, language })
    .select("id")
    .single();

  if (error || !created) throw new Error("Failed to create chat session");
  return created.id;
}

function buildSystemPrompt(
  language: LanguageCode,
  documentContext: string,
  formReferenceContext: string,
): string {
  const languageName = LANGUAGE_NAMES[language] ?? "English";

  const base = [
    "You are formly.ai, a friendly assistant that helps people understand U.S. government forms (immigration, tax, benefits, etc.).",
    "Explain in plain language. Be concrete: name the part/line/field of the form when you can.",
    "If you do not know something or the user has not provided enough context, say so honestly and suggest what to check.",
    "Do not give legal advice or guarantee outcomes; recommend consulting a qualified professional for legal questions.",
    `Reply in ${languageName}, regardless of the language of the user's question. Keep responses concise (a short paragraph or a brief list).`,
  ].join(" ");

  const docBlock = documentContext
    ? [
        "The user has an active uploaded document. A \"User's uploaded document\" section below summarizes what the app knows about that file (name, inferred form type, and any stored OCR or summary text).",
        "When that section is present, you ARE working in context of that upload — do not say you cannot see or access their document. Use the filename, form hints, and any OCR text provided. If OCR is missing or thin, say what you can infer from the filename and general form knowledge, and invite them to quote a line or box number.",
      ].join(" ")
    : "";

  const refBlock = formReferenceContext
    ? `Use the following reference snippets from official government sources when they help (they supplement the user's document, they do not replace it):\n\n${formReferenceContext}`
    : "";

  const parts = [base, docBlock].filter(Boolean);
  if (documentContext) {
    parts.push(`User's uploaded document:\n${documentContext}`);
  }
  if (refBlock) parts.push(refBlock);

  return parts.join("\n\n");
}

export async function POST(req: Request) {
  const { messages, language, documentId, sessionId: incomingSessionId } =
    (await req.json()) as {
      messages: UIMessage[];
      language?: LanguageCode;
      documentId?: string;
      sessionId?: string;
    };

  const lang = language ?? "en";

  // Get the last user message for context retrieval
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.parts
      .filter((p: { type: string }) => p.type === "text")
      .map((p: { type: string; text?: string }) => p.text ?? "")
      .join(" ") ?? "";

  // Load user's document text, RAG snippets, and resolve/create session in parallel
  const [formContext, sessionId, documentContext] = await Promise.all([
    fetchFormContext(lastUserMessage),
    documentId
      ? (incomingSessionId
          ? Promise.resolve(incomingSessionId)
          : getOrCreateSession(documentId, lang))
      : Promise.resolve(null),
    documentId ? fetchDocumentContext(documentId) : Promise.resolve(""),
  ]);

  // Save the user message to DB if we have a session
  if (sessionId && lastUserMessage) {
    await saveMessage(sessionId, "user", lastUserMessage);
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: buildSystemPrompt(lang, documentContext, formContext),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }: { text: string }) => {
      // Save the assistant response once streaming completes
      if (sessionId && text) {
        await saveMessage(sessionId, "assistant", text);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error: unknown) => {
      if (error instanceof Error) return error.message;
      if (typeof error === "string") return error;
      return "Something went wrong while generating a response.";
    },
  });
}
