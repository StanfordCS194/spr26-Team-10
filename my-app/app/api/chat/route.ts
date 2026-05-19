import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  buildCitationSource,
  uniqueCitationSources,
  type CitationSource,
  type FormReferenceRow,
} from "@/lib/citations";

export const runtime = "edge";
export const maxDuration = 30;

type LanguageCode = "en" | "es" | "zh" | "ar" | "fr";

export type ChatMessageMetadata = {
  sources?: CitationSource[];
};

export type ChatUIMessage = UIMessage<ChatMessageMetadata>;

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
type DocumentContextResult = {
  context: string;
  searchText: string;
  formKey?: string;
};

function inferFormKey(value: string): string | undefined {
  const text = value.toLowerCase();

  if (
    text.includes("i-765") ||
    text.includes("i765") ||
    text.includes("employment authorization document") ||
    (text.includes("employment authorization") && text.includes("uscis"))
  ) {
    return "i-765";
  }

  if (
    text.includes("ss-5") ||
    text.includes("social security card") ||
    text.includes("social security number card") ||
    text.includes("number-card")
  ) {
    return "ss-5";
  }

  if (text.includes("supplemental security income") || text.includes("ssi")) {
    return "ssi";
  }

  if (text.includes("medicare") || text.includes("cms-")) {
    const cmsMatch = text.match(/\bcms[-\s]?(40b|1763|l564)\b/);
    return cmsMatch ? `cms-${cmsMatch[1]}` : "medicare";
  }

  if (text.includes("w-4") || text.includes("fw4")) {
    return "w-4";
  }

  if (text.includes("i-9") || text.includes("employment eligibility verification")) {
    return "i-9";
  }

  return undefined;
}

async function fetchDocumentContext(
  documentId: string,
): Promise<DocumentContextResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("documents")
    .select("file_name, form_type, form_description, ocr_text, ai_extraction")
    .eq("id", documentId)
    .single();

  if (error || !data) return { context: "", searchText: "" };

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

  const context = lines.join("\n");
  const searchText = [
    data.file_name,
    data.form_type,
    data.form_description,
    raw.slice(0, 2_000),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    context,
    searchText,
    formKey: inferFormKey(searchText || context),
  };
}

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "any",
  "are",
  "can",
  "could",
  "docs",
  "document",
  "documents",
  "does",
  "for",
  "form",
  "from",
  "have",
  "how",
  "into",
  "need",
  "needed",
  "needs",
  "please",
  "should",
  "that",
  "the",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "you",
  "your",
]);

function getSearchTerms(value: string, maxTerms: number): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const term of value
    .split(/\s+/)
    .map((word) => word.replace(/[^\w-]/g, ""))
    .filter((word) => word.length > 2)) {
    const normalized = term.toLowerCase();
    if (STOP_WORDS.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    terms.push(term);
    if (terms.length >= maxTerms) break;
  }

  return terms;
}

function scoreReferenceRow(
  row: FormReferenceRow,
  weightedTerms: { term: string; weight: number }[],
  formKey?: string,
): number {
  const haystack = [row.section_title, row.content]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;
  let termsMatched = 0;

  for (const { term, weight } of weightedTerms) {
    // Count occurrences — a chunk that says "documents" 5 times is more relevant
    // than one that mentions it once in passing. Cap at 3× to avoid flooding.
    const occurrences = (haystack.match(new RegExp(term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
    if (occurrences > 0) {
      score += weight * Math.min(occurrences, 3);
      termsMatched++;
    }
  }

  // Penalise rows that only hit 1 of several terms — likely a coincidental match
  const uniqueTerms = new Set(weightedTerms.map((t) => t.term)).size;
  if (uniqueTerms >= 3 && termsMatched === 1) score *= 0.4;

  // Strong bonus for rows from the user's own form type — cross-form rows that
  // coincidentally mention the same words (e.g. "race" in a Medicare form) must
  // score dramatically higher to beat the user's actual form.
  if (formKey && row.form_key?.toLowerCase() === formKey.toLowerCase()) score += 20;

  if (row.source_url) score += 1;
  if (row.section_title) score += 0.5;

  return score;
}

async function fetchReferenceRows(
  terms: string[],
  formKey?: string,
): Promise<FormReferenceRow[]> {
  const supabase = getSupabase();
  const cols =
    "id, source, source_url, source_title, section_title, page_number, form_key, content";
  const contentFilter =
    terms.length > 0
      ? terms.map((w) => `content.ilike.%${w}%`).join(",")
      : null;

  // Phase 1: when we know the form type, filter strictly by it so only pages
  // from that specific form are returned, then rank by question relevance.
  if (formKey) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase.from("form_reference").select(cols).eq("form_key", formKey);
    if (contentFilter) q = q.or(contentFilter);
    const { data, error } = await q.limit(20);
    if (!error && data && data.length > 0) return data as FormReferenceRow[];
    // form_key column may not exist in this environment — fall through
  }

  // Phase 2: broad content search across all forms
  if (!contentFilter) return [];

  const { data, error } = await supabase
    .from("form_reference")
    .select(cols)
    .or(contentFilter)
    .limit(20);

  if (!error && data) return data as FormReferenceRow[];

  // Final fallback for legacy schema without metadata columns
  const { data: fallback } = await supabase
    .from("form_reference")
    .select("id, source, content")
    .or(contentFilter)
    .limit(20);

  return (fallback ?? []) as FormReferenceRow[];
}

// Pull the top relevant sections from form_reference using document-aware search.
async function fetchFormContext(
  userQuery: string,
  documentSearchText: string,
  formKey?: string,
): Promise<{ context: string; sources: CitationSource[] }> {
  const questionTerms = getSearchTerms(userQuery, 8);
  const documentTerms = getSearchTerms(documentSearchText, 6);
  // Use all terms for fetching but weight the query heavily for ranking
  const terms = [...new Set([...questionTerms, ...documentTerms])];

  // Question terms get 4× weight; document terms are secondary context (1×)
  const weightedTerms = [
    ...questionTerms.map((term) => ({ term, weight: 4 })),
    ...documentTerms.map((term) => ({ term, weight: 1 })),
  ];

  function rankRows(candidates: FormReferenceRow[]) {
    return candidates
      .map((row) => ({ row, score: scoreReferenceRow(row, weightedTerms, formKey) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ row }) => row);
  }

  // Always fetch both form-specific rows AND question-only cross-form rows in
  // parallel. The question might be about a related topic (e.g. immigration
  // rules) that's better covered by a different document than the uploaded form.
  const [formRows, crossRows] = await Promise.all([
    formKey ? fetchReferenceRows(terms, formKey) : Promise.resolve([]),
    questionTerms.length > 0 ? fetchReferenceRows(questionTerms) : Promise.resolve([]),
  ]);

  const merged = [
    ...formRows,
    ...crossRows.filter((r) => !formRows.some((f) => f.id === r.id)),
  ];

  const rankedRows = rankRows(merged);

  if (rankedRows.length === 0) {
    return { context: "", sources: [] };
  }

  console.log(
    "[citations] top ranked rows:",
    rankedRows.map((row, i) => ({
      rank: i + 1,
      source: row.source,
      source_title: row.source_title,
      section_title: row.section_title,
      form_key: row.form_key,
      page_number: row.page_number,
      snippet: (row.content ?? "").slice(0, 200),
    })),
    ". original query:", userQuery,
  );

  const context = rankedRows
    .map((row) => {
      const title = row.section_title || row.source_title || row.source;
      return `[${title}]\n${row.content}`;
    })
    .join("\n\n---\n\n");
  const sources = uniqueCitationSources(rankedRows.map(buildCitationSource)).slice(
    0,
    3,
  );

  return { context, sources };
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

async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  citations?: CitationSource[],
) {
  const supabase = getSupabase();
  const row: Record<string, unknown> = { session_id: sessionId, role, content };
  if (citations?.length) row.message_meta = { citations };
  const { error } = await supabase.from("messages").insert(row);
  if (error) console.warn("[saveMessage] error:", error.message);
  else {
    console.log(
      "[saveMessage] saved",
      role,
      "message, citations:",
      citations?.length ?? 0,
    );
  }
}

export async function POST(req: Request) {
  const { messages, language, documentId, sessionId: incomingSessionId } =
    (await req.json()) as {
      messages: ChatUIMessage[];
      language?: LanguageCode;
      documentId?: string;
      sessionId?: string;
    };

  const lang = language ?? "en";

  // Get the last user message for context retrieval
  const lastUserMessage =
    [...messages]
      .reverse()
      .find((m) => m.role === "user")
      ?.parts.filter((p: { type: string }) => p.type === "text")
      .map((p: { type: string; text?: string }) => p.text ?? "")
      .join(" ")
      .replace(/['"]/g, "")
      .trim() ?? "";
  const [documentResult, sessionId] = await Promise.all([
    documentId
      ? fetchDocumentContext(documentId)
      : Promise.resolve<DocumentContextResult>({
          context: "",
          searchText: "",
        }),
    documentId
      ? incomingSessionId
        ? Promise.resolve(incomingSessionId)
        : getOrCreateSession(documentId, lang)
      : Promise.resolve(null),
  ]);

  const formResult = await fetchFormContext(
    lastUserMessage,
    documentResult.searchText,
    documentResult.formKey,
  );
  const documentContext = documentResult.context;

  const { context: formContext, sources: citationSources } = formResult ?? {
    context: "",
    sources: [],
  };

  // Save the user message to DB if we have a session
  if (sessionId && lastUserMessage) {
    await saveMessage(sessionId, "user", lastUserMessage);
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: buildSystemPrompt(lang, documentContext, formContext),
    messages: await convertToModelMessages(messages),
    onFinish: async ({ text }: { text: string }) => {
      console.log(
        "[onFinish] assistant message done, citations:",
        citationSources.length,
      );
      if (sessionId && text) {
        await saveMessage(sessionId, "assistant", text, citationSources);
      }
    },
  });

  return result.toUIMessageStreamResponse<ChatUIMessage>({
    originalMessages: messages,
    messageMetadata: ({ part }) => {
      if (part.type === "finish" && citationSources.length > 0) {
        return { sources: citationSources };
      }
    },
    onError: (error: unknown) => {
      if (error instanceof Error) return error.message;
      if (typeof error === "string") return error;
      return "Something went wrong while generating a response.";
    },
  });
}
