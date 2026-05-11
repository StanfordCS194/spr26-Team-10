"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconFileText,
  IconCheck,
  IconAlertCircle,
  IconUser,
  IconMapPin,
  IconCalendar,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import { AppNav } from "@/components/navigation/app-nav";
import { StepSidebar, type Step } from "@/components/step-flow/step-sidebar/step-sidebar";
import { PageSplit } from "@/components/step-flow/page-split/page-split";
import type { LanguageOption } from "@/app/chat/LanguageDropdown";
import type { ReviewField, ReviewFieldIcon } from "@/types/review-field";
import { reviewLabels } from "@/lib/review-labels";
import { resolveLanguageForStep } from "@/lib/language-preference";
import reviewStyles from "../review-step.module.css";

const EXTRACTION_KEY = "extraction";

const ICONS: Record<
  ReviewFieldIcon,
  ComponentType<{
    size?: number;
    stroke?: number;
    className?: string;
    "aria-hidden"?: boolean;
  }>
> = {
  file: IconFileText,
  user: IconUser,
  map: IconMapPin,
  calendar: IconCalendar,
  money: IconCurrencyDollar,
  alert: IconAlertCircle,
};

const VALID_ICONS: ReviewFieldIcon[] = [
  "file",
  "user",
  "map",
  "calendar",
  "money",
  "alert",
];

function normalizeReviewFields(raw: unknown): ReviewField[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row, i) => {
    const r = row as Partial<ReviewField>;
    const icon: ReviewFieldIcon =
      typeof r.icon === "string" && VALID_ICONS.includes(r.icon as ReviewFieldIcon)
        ? (r.icon as ReviewFieldIcon)
        : "file";
    return {
      key: typeof r.key === "string" ? r.key : `field_${i}`,
      label: typeof r.label === "string" ? r.label : "Field",
      value: typeof r.value === "string" ? r.value : "",
      icon,
    };
  });
}

function FieldValue({ text }: { text: string }) {
  const long = text.length > 100 || text.includes("\n");
  if (long) {
    return (
      <div className={reviewStyles.fieldValueMultiline}>{text}</div>
    );
  }
  return <p className={reviewStyles.fieldValue}>{text}</p>;
}

function ReviewStepInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");
  const languageFromUrl = searchParams.get("language");

  const selectedLanguage = useMemo(
    (): LanguageOption =>
      resolveLanguageForStep(languageFromUrl),
    [languageFromUrl],
  );

  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [reviewFields, setReviewFields] = useState<ReviewField[]>([]);
  const [ocrPreview, setOcrPreview] = useState("");
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  const isRtl = selectedLanguage.code === "ar";
  const rv = reviewLabels[selectedLanguage.code];

  useEffect(() => {
    if (!documentId) {
      router.replace("/step/1");
      return;
    }

    const docId = documentId;

    let cancelled = false;

    async function load() {
      setLoadState("loading");
      setLoadError("");
      try {
        const response = await fetch(`/api/documents/${encodeURIComponent(docId)}`);
        const data = (await response.json()) as {
          document?: {
            fileName?: string;
            reviewFields?: unknown;
            ocrPreview?: string;
          };
          error?: string;
          details?: string;
        };

        if (!response.ok || !data.document) {
          const message = [data.error, data.details].filter(Boolean).join(": ");
          throw new Error(message || "Could not load document");
        }

        if (cancelled) return;

        const doc = data.document;
        setUploadedFileName(doc.fileName ?? "Document");
        setReviewFields(normalizeReviewFields(doc.reviewFields));
        setOcrPreview(
          typeof doc.ocrPreview === "string" ? doc.ocrPreview : "",
        );
        setConfirmed({});
        setFlagged({});
        setLoadState("ready");
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Could not load document",
          );
          setLoadState("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [documentId, router]);

  /** AI review rows are written shortly after upload via `after()`; poll until they appear. */
  useEffect(() => {
    if (loadState !== "ready" || !documentId || reviewFields.length > 0) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 28;
    const intervalMs = 2500;

    const id = window.setInterval(async () => {
      if (cancelled) return;
      attempts += 1;
      if (attempts > maxAttempts) {
        window.clearInterval(id);
        return;
      }
      try {
        const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`);
        const data = (await response.json()) as {
          document?: { reviewFields?: unknown };
        };
        if (cancelled || !response.ok || !data.document) return;
        const next = normalizeReviewFields(data.document.reviewFields);
        if (next.length > 0) {
          setReviewFields(next);
          window.clearInterval(id);
        }
      } catch {
        /* ignore transient errors while waiting for background extraction */
      }
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [loadState, documentId, reviewFields.length]);

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

  const toggleConfirm = useCallback((key: string) => {
    setConfirmed((prev) => ({ ...prev, [key]: !prev[key] }));
    setFlagged((prev) => ({ ...prev, [key]: false }));
  }, []);

  const toggleFlag = useCallback((key: string) => {
    setFlagged((prev) => ({ ...prev, [key]: !prev[key] }));
    setConfirmed((prev) => ({ ...prev, [key]: false }));
  }, []);

  const previewText =
    ocrPreview.trim() ||
    "We could not show a preview. You can still confirm to continue, or go back and try another file.";

  const rowsForUi = useMemo((): ReviewField[] => {
    if (reviewFields.length > 0) return reviewFields;
    return [
      {
        key: EXTRACTION_KEY,
        label: rv.fieldLabel,
        value: previewText,
        icon: "file",
      },
    ];
  }, [reviewFields, rv.fieldLabel, previewText]);

  const allRowsConfirmed = rowsForUi.every((row) => !!confirmed[row.key]);

  if (loadState === "loading" || !documentId) {
    return (
      <div dir={isRtl ? "rtl" : "ltr"} className={reviewStyles.page}>
        <AppNav backLabel="Back to home" backTo="/" />
        <PageSplit
          left={
            <StepSidebar
              eyebrow={rv.sidebarEyebrow}
              heading={rv.sidebarHeading}
              body={rv.sidebarBody}
              steps={steps}
              activeStep={2}
            />
          }
          right={
            <div className={reviewStyles.rightInner}>
              <p className={reviewStyles.stepLabel}>{rv.stepLabel}</p>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                Loading document…
              </p>
            </div>
          }
        />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div dir={isRtl ? "rtl" : "ltr"} className={reviewStyles.page}>
        <AppNav backLabel="Back to home" backTo="/" />
        <PageSplit
          left={
            <StepSidebar
              eyebrow={rv.sidebarEyebrow}
              heading={rv.sidebarHeading}
              body={rv.sidebarBody}
              steps={steps}
              activeStep={2}
            />
          }
          right={
            <div className={reviewStyles.rightInner}>
              <p className={reviewStyles.stepLabel}>{rv.stepLabel}</p>
              <p style={{ color: "#d70015", fontSize: "var(--text-sm)" }} role="alert">
                {loadError}
              </p>
              <div className={reviewStyles.actions} style={{ marginTop: "var(--space-6)" }}>
                <button
                  type="button"
                  className={reviewStyles.backBtn}
                  onClick={() =>
                    router.push(
                      `/step/1?language=${encodeURIComponent(selectedLanguage.code)}`,
                    )
                  }
                >
                  {rv.back}
                </button>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={reviewStyles.page}>
      <AppNav backLabel="Back to home" backTo="/" />
      <PageSplit
        left={
          <StepSidebar
            eyebrow={rv.sidebarEyebrow}
            heading={rv.sidebarHeading}
            body={rv.sidebarBody}
            steps={steps}
            activeStep={2}
          />
        }
        right={
          <div className={reviewStyles.rightInner}>
            <p className={reviewStyles.stepLabel}>{rv.stepLabel}</p>

            <div className={reviewStyles.docBadge}>
              <div className={reviewStyles.docBadgeIcon}>
                <IconFileText size={16} stroke={1.5} aria-hidden />
              </div>
              <div>
                <p className={reviewStyles.docBadgeName}>
                  {uploadedFileName || "Document"}
                </p>
                <p className={reviewStyles.docBadgeMeta}>{rv.docMeta}</p>
              </div>
            </div>

            <div className={reviewStyles.fieldList}>
              {rowsForUi.map((row) => {
                const Icon = ICONS[row.icon] ?? IconFileText;
                const isConfirmed = !!confirmed[row.key];
                const isFlagged = !!flagged[row.key];
                return (
                  <div
                    key={row.key}
                    className={`${reviewStyles.fieldRow} ${isConfirmed ? reviewStyles.fieldRowConfirmed : ""} ${isFlagged ? reviewStyles.fieldRowFlagged : ""}`}
                  >
                    <div className={reviewStyles.fieldIcon}>
                      <Icon size={14} stroke={1.5} aria-hidden />
                    </div>
                    <div className={reviewStyles.fieldContent}>
                      <p className={reviewStyles.fieldLabel}>{row.label}</p>
                      <FieldValue text={row.value} />
                    </div>
                    <div className={reviewStyles.fieldActions}>
                      <button
                        type="button"
                        className={`${reviewStyles.iconBtn} ${isConfirmed ? reviewStyles.iconBtnConfirmed : ""}`}
                        onClick={() => toggleConfirm(row.key)}
                        aria-label={isConfirmed ? "Unconfirm" : "Confirm"}
                        title="Looks correct"
                      >
                        <IconCheck size={13} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={`${reviewStyles.iconBtn} ${isFlagged ? reviewStyles.iconBtnFlagged : ""}`}
                        onClick={() => toggleFlag(row.key)}
                        aria-label={
                          isFlagged ? "Unflag" : "Flag as incorrect"
                        }
                        title="Something looks off"
                      >
                        <IconAlertCircle size={13} aria-hidden />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!allRowsConfirmed ? (
              <p className={reviewStyles.hint}>{rv.hint}</p>
            ) : null}

            <div className={reviewStyles.actions}>
              <button
                type="button"
                className={reviewStyles.backBtn}
                onClick={() =>
                  router.push(
                    `/step/1?language=${encodeURIComponent(selectedLanguage.code)}`,
                  )
                }
              >
                {rv.back}
              </button>
              <button
                type="button"
                className={reviewStyles.confirmBtn}
                disabled={!allRowsConfirmed}
                onClick={() =>
                  router.push(
                    `/step/3?documentId=${encodeURIComponent(documentId)}&language=${encodeURIComponent(selectedLanguage.code)}`,
                  )
                }
              >
                {rv.confirm}
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
}

function ReviewStepFallback() {
  return (
    <div className={reviewStyles.page}>
      <p
        style={{
          margin: "auto",
          padding: "var(--space-8)",
          color: "var(--color-text-secondary)",
        }}
      >
        Loading…
      </p>
    </div>
  );
}

export default function Step2Page() {
  return (
    <Suspense fallback={<ReviewStepFallback />}>
      <ReviewStepInner />
    </Suspense>
  );
}
