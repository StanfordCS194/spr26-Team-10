import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

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

function buildSystemPrompt(language: LanguageCode): string {
  const languageName = LANGUAGE_NAMES[language] ?? "English";

  return [
    "You are formly.ai, a friendly assistant that helps people understand U.S. government forms (immigration, tax, benefits, etc.).",
    "Explain in plain language. Be concrete: name the part/line/field of the form when you can.",
    "If you do not know something or the user has not provided enough context, say so honestly and suggest what to check.",
    "Do not give legal advice or guarantee outcomes; recommend consulting a qualified professional for legal questions.",
    `Reply in ${languageName}, regardless of the language of the user's question. Keep responses concise (a short paragraph or a brief list).`,
  ].join(" ");
}

export async function POST(req: Request) {
  const { messages, language } = (await req.json()) as {
    messages: UIMessage[];
    language?: LanguageCode;
  };

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: buildSystemPrompt(language ?? "en"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      if (error instanceof Error) return error.message;
      if (typeof error === "string") return error;
      return "Something went wrong while generating a response.";
    },
  });
}
