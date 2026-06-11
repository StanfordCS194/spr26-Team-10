import { createClient } from "@/lib/supabase/server";
import {
  uniqueCitationSources,
  type CitationSource,
} from "@/lib/citations";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) return Response.json({ sources: [] });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ sources: [] }, { status: 401 });
  }

  // RLS scopes messages to sessions the caller owns.
  const { data, error } = await supabase
    .from("messages")
    .select("id, message_meta")
    .eq("session_id", sessionId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.log("[citations] no message found:", error?.message);
    return Response.json({ sources: [] });
  }
  const meta = data.message_meta as { citations?: CitationSource[] } | null;
  const sources = uniqueCitationSources(meta?.citations ?? []);
  return Response.json({ sources, messageId: data.id });
}
