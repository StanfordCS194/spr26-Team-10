import { createServerSupabase } from "@/lib/supabase-server";

type LanguageCode = "en" | "es" | "zh" | "ar" | "fr";

function inferFormMetadata(fileName: string) {
  const normalized = fileName.toLowerCase();
  if (normalized.includes("i-765") || normalized.includes("employment")) {
    return {
      formType: "Form I-765",
      formDescription: "Employment Authorization",
      ocrPreview:
        "Part 2, Question 3 requests your full legal name exactly as it appears on your official records.",
    };
  }

  return {
    formType: "Government Form",
    formDescription: "General Document",
    ocrPreview:
      "We extracted text from your upload. Ask follow-up questions in chat for field-by-field guidance.",
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const language = (formData.get("language") as LanguageCode | null) ?? "en";

    if (!(file instanceof File)) {
      return Response.json({ error: "Missing upload file" }, { status: 400 });
    }

    const { formType, formDescription, ocrPreview } = inferFormMetadata(file.name);
    const supabase = createServerSupabase();

    const { data: createdDoc, error: docError } = await supabase
      .from("documents")
      .insert({
        file_name: file.name,
        form_type: formType,
        form_description: formDescription,
        ocr_text: ocrPreview,
      })
      .select("id, file_name, form_type, form_description, ocr_text")
      .single();

    if (docError || !createdDoc) {
      return Response.json(
        {
          error: "Failed to save uploaded document metadata",
          details: docError?.message,
          hint:
            "Add SUPABASE_SERVICE_ROLE_KEY to my-app/.env.local (server only), or run sql/04_rls_policies_anon.sql in Supabase.",
        },
        { status: 500 },
      );
    }

    const actionItems = [
      {
        document_id: createdDoc.id,
        title: "Gather Required Documents",
        detail: "Copy of passport, visa, I-94",
        sort_order: 1,
      },
      {
        document_id: createdDoc.id,
        title: "Filing Fee",
        detail: "$410 (check or money order)",
        sort_order: 2,
      },
      {
        document_id: createdDoc.id,
        title: "Deadline",
        detail: "Submit before June 15, 2026",
        sort_order: 3,
      },
    ];

    await supabase.from("action_items").insert(actionItems);

    return Response.json({
      documentId: createdDoc.id,
      fileName: createdDoc.file_name,
      formType: createdDoc.form_type,
      formDescription: createdDoc.form_description,
      ocrPreview: createdDoc.ocr_text,
      language,
    });
  } catch {
    return Response.json(
      { error: "Unexpected upload processing error" },
      { status: 500 },
    );
  }
}
