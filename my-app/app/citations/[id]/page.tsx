import { redirect } from "next/navigation";
import { buildCitationSource } from "@/lib/citations";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function CitationRedirectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  // form_reference is public reference data — admin client bypasses RLS so the
  // redirect resolves even for signed-out viewers following a citation link.
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("form_reference")
    .select("id, source, content")
    .eq("id", id)
    .single();

  if (!data) redirect("/step/3");

  const citation = buildCitationSource(data);
  redirect(citation.href ?? "/step/3");
}
