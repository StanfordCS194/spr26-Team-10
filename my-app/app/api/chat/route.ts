import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";

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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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

function buildSystemPrompt(language: LanguageCode, formContext: string): string {
  const languageName = LANGUAGE_NAMES[language] ?? "English";

  const base = [
    "You are formly.ai, a friendly assistant that helps people understand U.S. government forms (immigration, tax, benefits, etc.).",
    "Explain in plain language. Be concrete: name the part/line/field of the form when you can.",
    "If you do not know something or the user has not provided enough context, say so honestly and suggest what to check.",
    "Do not give legal advice or guarantee outcomes; recommend consulting a qualified professional for legal questions.",
    `Reply in ${languageName}, regardless of the language of the user's question. Keep responses concise (a short paragraph or a brief list).`,
  ].join(" ");

  if (!formContext) return base;

  return `${base}\n\nUse the following reference content from official government sources to ground your answer:\n\n${formContext}`;
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

  // Fetch relevant scraped content and resolve/create session in parallel
  const [formContext, sessionId] = await Promise.all([
    fetchFormContext(lastUserMessage),
    documentId
      ? (incomingSessionId
          ? Promise.resolve(incomingSessionId)
          : getOrCreateSession(documentId, lang))
      : Promise.resolve(null),
  ]);

  // Save the user message to DB if we have a session
  if (sessionId && lastUserMessage) {
    await saveMessage(sessionId, "user", lastUserMessage);
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: buildSystemPrompt(lang, formContext),
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
