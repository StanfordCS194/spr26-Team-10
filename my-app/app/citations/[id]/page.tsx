import { redirect } from "next/navigation";
import { buildCitationSource } from "@/lib/citations";
import { createServerSupabase } from "@/lib/supabase-server";

export default async function CitationRedirectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("form_reference")
    .select("id, source, content")
    .eq("id", id)
    .single();

  if (!data) redirect("/step/3");

  const citation = buildCitationSource(data);
  redirect(citation.href ?? "/step/3");
}
