import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: "Missing document id" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const [{ data: document, error: documentError }, { data: actionItems, error: actionItemsError }] =
      await Promise.all([
        supabase
          .from("documents")
          .select("id, file_name, form_type, form_description")
          .eq("id", id)
          .single(),
        supabase
          .from("action_items")
          .select("id, title, detail, sort_order")
          .eq("document_id", id)
          .order("sort_order", { ascending: true }),
      ]);

    if (documentError || !document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    if (actionItemsError) {
      return Response.json(
        { error: "Could not load action items" },
        { status: 500 },
      );
    }

    return Response.json({
      document: {
        id: document.id,
        fileName: document.file_name,
        formType: document.form_type,
        formDescription: document.form_description,
      },
      actionItems: (actionItems ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        detail: item.detail,
        sortOrder: item.sort_order,
      })),
    });
  } catch {
    return Response.json(
      { error: "Unexpected document fetch error" },
      { status: 500 },
    );
  }
}
