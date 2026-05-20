import { Buffer } from "node:buffer";
import { after } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import type { AiExtractionPayload, ReviewField } from "@/types/review-field";
import {
  dedupeFieldKeys,
  extractDocumentAndReviewFromUpload,
} from "@/lib/upload-llm-extraction";

export const runtime = "nodejs";
export const maxDuration = 60;

type LanguageCode = "en" | "es" | "zh" | "ar" | "fr";

function inferFormMetadata(fileName: string) {
  const normalized = fileName.toLowerCase();
  if (normalized.includes("i-765") || normalized.includes("employment")) {
    return {
      formType: "Form I-765",
      formDescription: "Employment Authorization",
      heuristicHint:
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
      heuristicHint:
        "This upload appears to be a Form 1040 family tax document. The assistant can help interpret line items and schedules; use the filename and visible form text for specifics.",
    };
  }

  return {
    formType: "Government Form",
    formDescription: "General Document",
    heuristicHint:
      "We will read your document and help you understand fields, deadlines, and requirements in plain language.",
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

    const { formType, formDescription, heuristicHint } = inferFormMetadata(file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileMeta = { name: file.name, type: file.type };

    const supabase = createServerSupabase();

    const { data: createdDoc, error: docError } = await supabase
      .from("documents")
      .insert({
        file_name: file.name,
        form_type: formType,
        form_description: formDescription,
        ocr_text: heuristicHint,
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

    // Upload the original file to Supabase Storage so users can view it later
    const storageKey = `${createdDoc.id}/${file.name}`;
    const { error: storageError } = await supabase.storage
      .from("documents")
      .upload(storageKey, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (storageError) {
      console.warn("[upload] storage upload failed:", storageError.message);
    } else {
      await supabase
        .from("documents")
        .update({ storage_path: storageKey })
        .eq("id", createdDoc.id);
    }

    const documentId = createdDoc.id;

    after(async () => {
      try {
        console.log("[upload] after() block started for", documentId);
        const sb = createServerSupabase();
        let documentSummary: string;
        let reviewFields: ReviewField[];

        try {
          const extracted = await extractDocumentAndReviewFromUpload({
            buffer: fileBuffer,
            meta: fileMeta,
            language,
            formType,
            formDescription,
            heuristicHint,
          });
          documentSummary = extracted.documentSummary;
          reviewFields = extracted.fields;
          console.log("[upload] LLM extraction succeeded for", documentId);
        } catch (e) {
          console.warn("[upload] LLM extraction failed (after), using heuristics only:", e);
          documentSummary = heuristicHint;
          reviewFields = dedupeFieldKeys([
            {
              key: "document_type",
              label: "Document",
              value: `${formType} — extraction unavailable; confirm details from your file.`,
              icon: "file",
            },
            {
              key: "purpose",
              label: "Purpose",
              value: formDescription,
              icon: "user",
            },
            {
              key: "next_step",
              label: "Next step",
              value:
                "Check that OPENAI_API_KEY is set on the server, then re-upload or refresh the review step.",
              icon: "alert",
            },
          ]);
        }

        const payload: AiExtractionPayload = {
          fields: reviewFields,
          generatedAt: new Date().toISOString(),
        };

        const { error: updateErr } = await sb
          .from("documents")
          .update({
            ocr_text: documentSummary,
            ai_extraction: payload as unknown as Record<string, unknown>,
          })
          .eq("id", documentId);

        if (updateErr) {
          console.warn("[upload] document update failed (after):", updateErr.message);
        } else {
          console.log("[upload] extraction complete for", documentId);
        }
      } catch (e) {
        console.warn("[upload] deferred pipeline failed (after):", e);
      }
    });

    return Response.json({
      documentId: createdDoc.id,
      fileName: createdDoc.file_name,
      formType: createdDoc.form_type,
      formDescription: createdDoc.form_description,
      documentText: createdDoc.ocr_text,
      language,
      reviewFields: [] as ReviewField[],
    });
  } catch (err) {
    console.error("[upload] unexpected error:", err);
    return Response.json(
      {
        error: "Unexpected upload processing error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
