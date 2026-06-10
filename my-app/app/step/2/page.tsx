import { Suspense } from "react";
import { reviewLabels } from "@/lib/review-labels";
import reviewStyles from "../review-step.module.css";
import ReviewStep from "./ReviewStep";

type Step2PageProps = {
  searchParams: Promise<{ language?: string; documentId?: string }>;
};

export default async function Step2Page({ searchParams }: Step2PageProps) {
  const params = await searchParams;
  const lang = params.language;
  const rv = (lang && lang in reviewLabels)
    ? reviewLabels[lang as keyof typeof reviewLabels]
    : reviewLabels.en;

  return (
    <Suspense
      fallback={
        <div className={reviewStyles.page}>
          <p
            style={{
              margin: "auto",
              padding: "var(--space-8)",
              color: "var(--color-text-secondary)",
            }}
          >
            {rv.loadingDocument}
          </p>
        </div>
      }
    >
      <ReviewStep />
    </Suspense>
  );
}
