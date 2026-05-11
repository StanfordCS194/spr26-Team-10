"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppNav } from "@/components/navigation/app-nav";
import { StepSidebar, type Step } from "@/components/step-flow/step-sidebar/step-sidebar";
import { UploadCard } from "@/components/step-flow/upload-card/upload-card";
import { PageSplit } from "@/components/step-flow/page-split/page-split";
import { resolveLanguageForStep } from "@/lib/language-preference";
import styles from "../upload.module.css";

function UploadStepInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const languageFromUrl = searchParams.get("language");

  const selectedLanguage = useMemo(
    () => resolveLanguageForStep(languageFromUrl),
    [languageFromUrl],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const isRtl = selectedLanguage.code === "ar";

  const steps: Step[] = [
    {
      number: 1,
      title: "Upload your document",
      description:
        "Any government form: PDF, photo, or scan. We handle the rest.",
    },
    {
      number: 2,
      title: "Review the extraction",
      description: "Confirm what we read before you ask questions.",
    },
    {
      number: 3,
      title: "Ask anything",
      description: "Questions answered clearly, in your language.",
    },
  ];

  const handleContinue = async (file: File) => {
    setUploadError("");
    setIsUploading(true);

    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("language", selectedLanguage.code);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      // Read as text first so HTML error pages (timeout/5xx from the platform)
      // surface a real message instead of crashing JSON.parse.
      const rawBody = await response.text();
      let data: {
        documentId?: string;
        error?: string;
        details?: string;
        hint?: string;
      } = {};
      try {
        data = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        const snippet = rawBody.slice(0, 120).replace(/\s+/g, " ").trim();
        throw new Error(
          response.status === 504 || response.status === 408
            ? "The upload took too long and was cancelled by the server. Please try a smaller file."
            : `Server returned a non-JSON response (HTTP ${response.status}). ${snippet ? `Body starts with: ${snippet}` : ""}`,
        );
      }

      if (!response.ok || !data.documentId) {
        const message = [data.error, data.details, data.hint]
          .filter(Boolean)
          .join(". ");
        throw new Error(message || `Upload failed (HTTP ${response.status})`);
      }

      router.push(
        `/step/2?documentId=${encodeURIComponent(data.documentId)}&language=${encodeURIComponent(selectedLanguage.code)}`,
      );
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Could not upload document",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={styles.page}>
      <AppNav backLabel="Back to home" backTo="/" />
      <PageSplit
        left={
          <StepSidebar
            eyebrow="Get started"
            heading="Upload your<br>form to begin."
            body="We read your document and help you understand every field, deadline, and requirement in plain language, in your language."
            steps={steps}
            activeStep={1}
          />
        }
        right={
          <div className={styles.rightInner}>
            <p className={styles.stepLabel}>Step 1 of 3 · Upload your document</p>
            <UploadCard
              onContinue={handleContinue}
              isLoading={isUploading}
              errorMessage={uploadError || undefined}
              onFileChange={() => setUploadError("")}
            />
          </div>
        }
      />
    </div>
  );
}

function UploadStepFallback() {
  return (
    <div className={styles.page}>
      <p style={{ margin: "auto", padding: "var(--space-8)", color: "var(--color-text-secondary)" }}>
        Loading…
      </p>
    </div>
  );
}

export default function Step1Page() {
  return (
    <Suspense fallback={<UploadStepFallback />}>
      <UploadStepInner />
    </Suspense>
  );
}
