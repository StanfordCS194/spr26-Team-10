"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppNav } from "@/components/navigation/app-nav";
import {
  StepSidebar,
  type Step,
} from "@/components/step-flow/step-sidebar/step-sidebar";
import { UploadCard } from "@/components/step-flow/upload-card/upload-card";
import { PageSplit } from "@/components/step-flow/page-split/page-split";
import { resolveLanguageForStep } from "@/lib/language-preference";
import styles from "../upload.module.css";

const STEP_1_COPY = {
  en: {
    navBack: "Back to home",
    eyebrow: "Get started",
    heading: "Upload your<br>form to begin.",
    body: "We read your document and help you understand every field, deadline, and requirement in plain language, in your language.",
    stepLabel: "Step 1 of 3 · Upload your document",
    uploadErrorFallback: "Could not upload document",
    loading: "Loading…",
    timeoutError:
      "The upload took too long and was cancelled by the server. Please try a smaller file.",
    nonJsonError: "Server returned a non-JSON response",
    uploadFailed: "Upload failed",
    steps: [
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
    ],
    uploadCard: {
      dropZoneAriaLabel: "Drop zone — click or drag to upload",
      readyToUpload: "ready to upload",
      dropTitle: "Drop your file here",
      dropSubtitle: "Drag and drop your form to get started",
      chooseManually: "or choose manually",
      chooseFile: "Choose file from device",
      uploading: "Uploading…",
      uploadAndContinue: "Upload and continue",
      encrypted: "Encrypted",
      notStored: "Not stored",
      private: "Private",
    },
  },

  es: {
    navBack: "Volver al inicio",
    eyebrow: "Comenzar",
    heading: "Sube tu<br>formulario para empezar.",
    body: "Leemos tu documento y te ayudamos a entender cada campo, fecha límite y requisito en lenguaje claro, en tu idioma.",
    stepLabel: "Paso 1 de 3 · Sube tu documento",
    uploadErrorFallback: "No se pudo subir el documento",
    loading: "Cargando…",
    timeoutError:
      "La subida tardó demasiado y el servidor la canceló. Prueba con un archivo más pequeño.",
    nonJsonError: "El servidor devolvió una respuesta que no es JSON",
    uploadFailed: "La subida falló",
    steps: [
      {
        number: 1,
        title: "Sube tu documento",
        description:
          "Cualquier formulario del gobierno: PDF, foto o escaneo. Nosotros nos encargamos del resto.",
      },
      {
        number: 2,
        title: "Revisa la extracción",
        description: "Confirma lo que leímos antes de hacer preguntas.",
      },
      {
        number: 3,
        title: "Pregunta lo que quieras",
        description: "Respuestas claras, en tu idioma.",
      },
    ],
    uploadCard: {
      dropZoneAriaLabel:
        "Zona para soltar archivos — haz clic o arrastra para subir",
      readyToUpload: "listo para subir",
      dropTitle: "Suelta tu archivo aquí",
      dropSubtitle: "Arrastra y suelta tu formulario para empezar",
      chooseManually: "o elige manualmente",
      chooseFile: "Elegir archivo del dispositivo",
      uploading: "Subiendo…",
      uploadAndContinue: "Subir y continuar",
      encrypted: "Cifrado",
      notStored: "No guardado",
      private: "Privado",
    },
  },

  fr: {
    navBack: "Retour à l’accueil",
    eyebrow: "Commencer",
    heading: "Téléversez votre<br>formulaire pour commencer.",
    body: "Nous lisons votre document et vous aidons à comprendre chaque champ, échéance et exigence en langage simple, dans votre langue.",
    stepLabel: "Étape 1 sur 3 · Téléversez votre document",
    uploadErrorFallback: "Impossible de téléverser le document",
    loading: "Chargement…",
    timeoutError:
      "Le téléversement a pris trop de temps et a été annulé par le serveur. Essayez avec un fichier plus petit.",
    nonJsonError: "Le serveur a renvoyé une réponse non JSON",
    uploadFailed: "Le téléversement a échoué",
    steps: [
      {
        number: 1,
        title: "Téléversez votre document",
        description:
          "Tout formulaire administratif : PDF, photo ou scan. Nous nous occupons du reste.",
      },
      {
        number: 2,
        title: "Vérifiez l’extraction",
        description:
          "Confirmez ce que nous avons lu avant de poser vos questions.",
      },
      {
        number: 3,
        title: "Posez vos questions",
        description: "Des réponses claires, dans votre langue.",
      },
    ],
    uploadCard: {
      dropZoneAriaLabel:
        "Zone de dépôt — cliquez ou glissez-déposez pour téléverser",
      readyToUpload: "prêt à être téléversé",
      dropTitle: "Déposez votre fichier ici",
      dropSubtitle: "Glissez-déposez votre formulaire pour commencer",
      chooseManually: "ou choisissez manuellement",
      chooseFile: "Choisir un fichier sur l’appareil",
      uploading: "Téléversement…",
      uploadAndContinue: "Téléverser et continuer",
      encrypted: "Chiffré",
      notStored: "Non conservé",
      private: "Privé",
    },
  },

  zh: {
    navBack: "返回首页",
    eyebrow: "开始",
    heading: "上传你的<br>表格以开始。",
    body: "我们会阅读你的文件，并用你的语言、用简单清楚的方式帮助你理解每个字段、截止日期和要求。",
    stepLabel: "第 1 步，共 3 步 · 上传你的文件",
    uploadErrorFallback: "无法上传文件",
    loading: "正在加载…",
    timeoutError: "上传时间过长，服务器已取消。请尝试较小的文件。",
    nonJsonError: "服务器返回了非 JSON 响应",
    uploadFailed: "上传失败",
    steps: [
      {
        number: 1,
        title: "上传你的文件",
        description: "任何政府表格：PDF、照片或扫描件。其余交给我们处理。",
      },
      {
        number: 2,
        title: "检查提取结果",
        description: "在提问前确认我们读取到的内容。",
      },
      {
        number: 3,
        title: "随时提问",
        description: "用你的语言获得清楚的回答。",
      },
    ],
    uploadCard: {
      dropZoneAriaLabel: "拖放区域 — 点击或拖动以上传",
      readyToUpload: "已准备好上传",
      dropTitle: "将文件拖到这里",
      dropSubtitle: "拖放你的表格即可开始",
      chooseManually: "或手动选择",
      chooseFile: "从设备选择文件",
      uploading: "正在上传…",
      uploadAndContinue: "上传并继续",
      encrypted: "已加密",
      notStored: "不保存",
      private: "私密",
    },
  },

  ar: {
    navBack: "العودة إلى الصفحة الرئيسية",
    eyebrow: "ابدأ",
    heading: "ارفع<br>نموذجك للبدء.",
    body: "نقرأ مستندك ونساعدك على فهم كل حقل وموعد نهائي ومتطلب بلغة بسيطة، وبلغتك.",
    stepLabel: "الخطوة 1 من 3 · ارفع مستندك",
    uploadErrorFallback: "تعذر رفع المستند",
    loading: "جارٍ التحميل…",
    timeoutError:
      "استغرق الرفع وقتًا طويلًا وتم إلغاؤه من الخادم. جرّب ملفًا أصغر.",
    nonJsonError: "أرجع الخادم استجابة ليست بصيغة JSON",
    uploadFailed: "فشل الرفع",
    steps: [
      {
        number: 1,
        title: "ارفع مستندك",
        description:
          "أي نموذج حكومي: ملف PDF أو صورة أو مسح ضوئي. نحن نتولى الباقي.",
      },
      {
        number: 2,
        title: "راجع الاستخراج",
        description: "أكد ما قرأناه قبل أن تطرح أسئلتك.",
      },
      {
        number: 3,
        title: "اسأل أي شيء",
        description: "إجابات واضحة، وبلغتك.",
      },
    ],
    uploadCard: {
      dropZoneAriaLabel: "منطقة الرفع — انقر أو اسحب الملف للرفع",
      readyToUpload: "جاهز للرفع",
      dropTitle: "أفلت ملفك هنا",
      dropSubtitle: "اسحب نموذجك وأفلته للبدء",
      chooseManually: "أو اختر يدويًا",
      chooseFile: "اختر ملفًا من الجهاز",
      uploading: "جارٍ الرفع…",
      uploadAndContinue: "ارفع وتابع",
      encrypted: "مشفر",
      notStored: "غير محفوظ",
      private: "خاص",
    },
  },
};

function UploadStepInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const languageFromUrl = searchParams.get("language");

  const selectedLanguage = useMemo(
    () => resolveLanguageForStep(languageFromUrl),
    [languageFromUrl],
  );

  const copy =
    STEP_1_COPY[selectedLanguage.code as keyof typeof STEP_1_COPY] ??
    STEP_1_COPY.en;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const isRtl = selectedLanguage.code === "ar";

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
            ? copy.timeoutError
            : `${copy.nonJsonError} (HTTP ${response.status}). ${
                snippet ? `Body starts with: ${snippet}` : ""
              }`,
        );
      }

      if (!response.ok || !data.documentId) {
        const message = [data.error, data.details, data.hint]
          .filter(Boolean)
          .join(". ");

        throw new Error(
          message || `${copy.uploadFailed} (HTTP ${response.status})`,
        );
      }

      router.push(
        `/step/2?documentId=${encodeURIComponent(
          data.documentId,
        )}&language=${encodeURIComponent(selectedLanguage.code)}`,
      );
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : copy.uploadErrorFallback,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      lang={selectedLanguage.code}
      dir={isRtl ? "rtl" : "ltr"}
      className={styles.page}
    >
      <AppNav backLabel={copy.navBack} backTo="/" />

      <PageSplit
        left={
          <StepSidebar
            eyebrow={copy.eyebrow}
            heading={copy.heading}
            body={copy.body}
            steps={copy.steps as Step[]}
            activeStep={1}
          />
        }
        right={
          <div className={styles.rightInner}>
            <p className={styles.stepLabel}>{copy.stepLabel}</p>

            <UploadCard
              copy={copy.uploadCard}
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

export default function Step1Page() {
  return (
    <Suspense fallback={<UploadStepFallback />}>
      <UploadStepInner />
    </Suspense>
  );
}
