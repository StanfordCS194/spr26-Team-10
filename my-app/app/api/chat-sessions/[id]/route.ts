import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SessionRow = {
  id: string;
  document_id: string | null;
  title: string | null;
  language: string;
  created_at: string;
  updated_at: string;
  documents: { file_name: string | null; form_type: string | null } | null;
};

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid session id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // RLS gates this — wrong owner just returns null.
  const { data: sessionData, error: sessionError } = await supabase
    .from("chat_sessions")
    .select(
      "id, document_id, title, language, created_at, updated_at, documents(file_name, form_type)",
    )
    .eq("id", id)
    .maybeSingle();

  if (sessionError) {
    return Response.json(
      { error: "Could not load chat session", details: sessionError.message },
      { status: 500 },
    );
  }
  if (!sessionData) {
    return Response.json({ error: "Chat session not found" }, { status: 404 });
  }

  const session = sessionData as unknown as SessionRow;

  const { data: messageData, error: messagesError } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return Response.json(
      { error: "Could not load messages", details: messagesError.message },
      { status: 500 },
    );
  }

  const messages = (messageData ?? []) as MessageRow[];

  return Response.json({
    session: {
      id: session.id,
      documentId: session.document_id,
      title: session.title,
      language: session.language,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      documentName: session.documents?.file_name ?? null,
      formType: session.documents?.form_type ?? null,
    },
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    })),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid session id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { error } = await supabase.from("chat_sessions").delete().eq("id", id);

  if (error) {
    return Response.json(
      { error: "Could not delete chat session", details: error.message },
      { status: 500 },
    );
  }

  return new Response(null, { status: 204 });
}
