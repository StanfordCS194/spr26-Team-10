import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ChatSessionListRow = {
  id: string;
  document_id: string | null;
  title: string | null;
  language: string;
  created_at: string;
  updated_at: string;
  documents: { file_name: string | null; form_type: string | null } | null;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .select(
      "id, document_id, title, language, created_at, updated_at, documents(file_name, form_type)",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return Response.json(
      { error: "Could not load chat sessions", details: error.message },
      { status: 500 },
    );
  }

  const rows = (data ?? []) as unknown as ChatSessionListRow[];
  const sessions = rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    language: row.language,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documentName: row.documents?.file_name ?? null,
    formType: row.documents?.form_type ?? null,
  }));

  return Response.json({ sessions });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { documentId?: string; language?: string } = {};
  try {
    body = (await req.json()) as { documentId?: string; language?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const documentId = body.documentId;
  const language = body.language ?? "en";
  if (!documentId) {
    return Response.json({ error: "documentId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      document_id: documentId,
      user_id: user.id,
      language,
    })
    .select("id, document_id, title, language, created_at, updated_at")
    .single();

  if (error || !data) {
    return Response.json(
      {
        error: "Could not create chat session",
        details: error?.message,
      },
      { status: 500 },
    );
  }

  return Response.json(
    {
      session: {
        id: data.id,
        documentId: data.document_id,
        title: data.title,
        language: data.language,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    },
    { status: 201 },
  );
}
