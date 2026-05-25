import { createServerSupabase } from "@/lib/supabase-server";
import {
  uniqueCitationSources,
  type CitationSource,
} from "@/lib/citations";
export const runtime = "edge";
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) return Response.json({ sources: [] });
  const supabase = createServerSupabase();
  // Get the most recent assistant message for this session
  const { data, error } = await supabase
    .from("messages")
    .select("id, message_meta")
    .eq("session_id", sessionId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) {
    console.log("[citations] no message found:", error?.message);
    return Response.json({ sources: [] });
  }
  const meta = data.message_meta as { citations?: CitationSource[] } | null;
  const sources = uniqueCitationSources(meta?.citations ?? []);
  console.log("[citations] returning", sources.length, "sources for message", data.id);
  return Response.json({ sources, messageId: data.id });
}
