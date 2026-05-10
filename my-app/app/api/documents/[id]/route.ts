import { createServerSupabase } from "@/lib/supabase-server";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: "Missing document id" }, { status: 400 });
    }

    if (!UUID_RE.test(id)) {
      return Response.json({ error: "Invalid document id" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const [{ data: document, error: documentError }, { data: actionItems, error: actionItemsError }] =
      await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("action_items")
          .select("id, title, detail, sort_order")
          .eq("document_id", id)
          .order("sort_order", { ascending: true }),
      ]);

    if (documentError) {
      return Response.json(
        {
          error: "Could not load document",
          details: documentError.message,
          code: documentError.code,
        },
        { status: 500 },
      );
    }

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    if (actionItemsError) {
      return Response.json(
        {
          error: "Could not load action items",
          details: actionItemsError.message,
          code: actionItemsError.code,
        },
        { status: 500 },
      );
    }

    const extraction = document.ai_extraction as
      | { fields?: unknown[] }
      | null
      | undefined;
    const reviewFields = Array.isArray(extraction?.fields)
      ? extraction!.fields
      : [];

    return Response.json({
      document: {
        id: document.id,
        fileName: document.file_name,
        formType: document.form_type,
        formDescription: document.form_description,
        reviewFields,
        ocrPreview:
          typeof document.ocr_text === "string" ? document.ocr_text : "",
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
