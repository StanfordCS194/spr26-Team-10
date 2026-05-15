import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

type LanguageCode = "en" | "es" | "zh" | "ar" | "fr";

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  es: "Spanish",
  zh: "Chinese (Simplified)",
  ar: "Arabic",
  fr: "French",
};

const MAX_DOCUMENT_TEXT_IN_PROMPT = 14_000;
const TITLE_MAX_LENGTH = 60;

async function fetchDocumentContext(
  supabase: SupabaseClient,
  documentId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("documents")
    .select("file_name, form_type, form_description, ocr_text, ai_extraction")
    .eq("id", documentId)
    .maybeSingle();

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
    lines.push(`Text from the user's upload (model summary):\n${clipped}`);
  } else {
    lines.push(
      "(No stored document summary yet — use the filename and form hints above, and ask the user to name specific lines or sections if needed.)",
    );
  }

  return lines.join("\n");
}

async function fetchFormContext(
  supabase: SupabaseClient,
  query: string,
): Promise<string> {
  if (!query.trim()) return "";
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

async function saveMessage(
  supabase: SupabaseClient,
  sessionId: string,
  role: "user" | "assistant",
  content: string,
) {
  await supabase
    .from("messages")
    .insert({ session_id: sessionId, role, content });
}

/** Touch updated_at (and optionally set title) so the sidebar resorts by recency. */
async function bumpSession(
  supabase: SupabaseClient,
  sessionId: string,
  patch: { title?: string } = {},
) {
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString(), ...patch })
    .eq("id", sessionId);
}

function makeTitle(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= TITLE_MAX_LENGTH) return cleaned;
  return `${cleaned.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`;
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
        "The user has an active uploaded document. A \"User's uploaded document\" section below summarizes what the app knows about that file (name, inferred form type, and any stored summary text from the upload step).",
        "When that section is present, you ARE working in context of that upload — do not say you cannot see or access their document. Use the filename, form hints, and any stored summary provided. If the summary is missing or thin, say what you can infer from the filename and general form knowledge, and invite them to quote a line or box number.",
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as {
    messages: UIMessage[];
    language?: LanguageCode;
    sessionId?: string;
  };

  const { messages, sessionId } = body;
  const lang = body.language ?? "en";

  if (!sessionId) {
    return Response.json(
      { error: "sessionId is required" },
      { status: 400 },
    );
  }

  // RLS gates ownership — a session that isn't ours returns null.
  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("id, document_id, title, language")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) {
    return new Response("Chat session not found", { status: 404 });
  }

  const lastUserMessage =
    [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.parts.filter((p: { type: string }) => p.type === "text")
      .map((p: { type: string; text?: string }) => p.text ?? "")
      .join(" ") ?? "";

  const [formContext, documentContext] = await Promise.all([
    fetchFormContext(supabase, lastUserMessage),
    session.document_id
      ? fetchDocumentContext(supabase, session.document_id)
      : Promise.resolve(""),
  ]);

  if (lastUserMessage) {
    await saveMessage(supabase, sessionId, "user", lastUserMessage);
    await bumpSession(
      supabase,
      sessionId,
      session.title ? {} : { title: makeTitle(lastUserMessage) },
    );
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: buildSystemPrompt(lang, documentContext, formContext),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }: { text: string }) => {
      if (text) {
        await saveMessage(supabase, sessionId, "assistant", text);
        await bumpSession(supabase, sessionId);
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
