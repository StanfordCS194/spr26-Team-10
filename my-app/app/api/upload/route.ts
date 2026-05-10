import { createServerSupabase } from "@/lib/supabase-server";
import {
  extractReviewFieldsFromUploadContext,
  type ReviewField,
  type AiExtractionPayload,
} from "@/lib/review-extraction";

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

  if (
    normalized.includes("1040") ||
    normalized.includes("tax return") ||
    normalized.includes("irs")
  ) {
    return {
      formType: "Form 1040 series (IRS)",
      formDescription: "U.S. individual income tax",
      ocrPreview:
        "This upload appears to be a Form 1040 family tax document. The assistant can help interpret line items and schedules once real OCR is wired; for now use the filename and your questions.",
    };
  }

  return {
    formType: "Government Form",
    formDescription: "General Document",
    ocrPreview:
      "We extracted text from your upload. Ask follow-up questions in chat for field-by-field guidance.",
  };
}

function dedupeFieldKeys(fields: ReviewField[]): ReviewField[] {
  const seen = new Set<string>();
  return fields.map((f) => {
    let key = f.key;
    let n = 2;
    while (seen.has(key)) {
      key = `${f.key}_${n}`;
      n += 1;
    }
    seen.add(key);
    return { ...f, key };
  });
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

    let reviewFields: ReviewField[] = [];
    try {
      const rawFields = await extractReviewFieldsFromUploadContext({
        fileName: createdDoc.file_name,
        formType: createdDoc.form_type ?? formType,
        formDescription: createdDoc.form_description ?? formDescription,
        ocrText: createdDoc.ocr_text ?? ocrPreview,
        language,
      });
      reviewFields = dedupeFieldKeys(rawFields);

      const payload: AiExtractionPayload = {
        fields: reviewFields,
        generatedAt: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("documents")
        .update({ ai_extraction: payload as unknown as Record<string, unknown> })
        .eq("id", createdDoc.id);

      if (updateError) {
        console.warn(
          "[upload] ai_extraction column missing or update failed — run sql/05_documents_ai_extraction.sql",
          updateError.message,
        );
      }
    } catch (e) {
      console.warn("[upload] review field extraction failed:", e);
    }

    return Response.json({
      documentId: createdDoc.id,
      fileName: createdDoc.file_name,
      formType: createdDoc.form_type,
      formDescription: createdDoc.form_description,
      ocrPreview: createdDoc.ocr_text,
      language,
      reviewFields,
    });
  } catch {
    return Response.json(
      { error: "Unexpected upload processing error" },
      { status: 500 },
    );
  }
}
