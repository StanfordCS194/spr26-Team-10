import type { LanguageOption } from "@/app/chat/LanguageDropdown";

export type ReviewLabels = {
  sidebarEyebrow: string;
  sidebarHeading: string;
  sidebarBody: string;
  stepLabel: string;
  docMeta: string;
  fieldLabel: string;
  hint: string;
  back: string;
  confirm: string;
};

export const reviewLabels: Record<LanguageOption["code"], ReviewLabels> = {
  en: {
    sidebarEyebrow: "Step 2 of 3",
    sidebarHeading: "We read your<br>form.",
    sidebarBody:
      "Review what our AI extracted from your document. Confirm the text looks correct, or flag it if something looks off before continuing.",
    stepLabel: "Step 2 of 3 · Review extraction",
    docMeta: "uploaded just now",
    fieldLabel: "Extracted text",
    hint: "Confirm the extraction looks correct, or flag it if something looks wrong.",
    back: "Back",
    confirm: "Confirm and ask questions",
  },
  es: {
    sidebarEyebrow: "Paso 2 de 3",
    sidebarHeading: "Leímos tu<br>formulario.",
    sidebarBody:
      "Revisa lo que extrajo la IA. Confirma que el texto es correcto o márcalo si algo parece mal antes de continuar.",
    stepLabel: "Paso 2 de 3 · Revisar extracción",
    docMeta: "subido hace un momento",
    fieldLabel: "Texto extraído",
    hint: "Confirma que la extracción es correcta o márcala si algo parece mal.",
    back: "Atrás",
    confirm: "Confirmar y hacer preguntas",
  },
  zh: {
    sidebarEyebrow: "第 2 步，共 3 步",
    sidebarHeading: "我们已阅读<br>您的表格。",
    sidebarBody:
      "请核对 AI 从文件中提取的文字。确认无误后再继续，如有问题请先标记。",
    stepLabel: "第 2 步 · 核对提取内容",
    docMeta: "刚刚上传",
    fieldLabel: "提取的文字",
    hint: "请确认提取内容正确；如有错误请标记。",
    back: "返回",
    confirm: "确认并提问",
  },
  ar: {
    sidebarEyebrow: "الخطوة 2 من 3",
    sidebarHeading: "لقد قرأنا<br>نموذجك.",
    sidebarBody:
      "راجع ما استخرجته الذكاء الاصطناعي. أكّد أن النص صحيح، أو علّم إن كان هناك خطأ قبل المتابعة.",
    stepLabel: "الخطوة 2 من 3 · مراجعة الاستخراج",
    docMeta: "تم الرفع للتو",
    fieldLabel: "النص المستخرج",
    hint: "أكّد أن الاستخراج يبدو صحيحًا، أو علّم إن كان هناك خطأ.",
    back: "رجوع",
    confirm: "تأكيد وطرح الأسئلة",
  },
  fr: {
    sidebarEyebrow: "Étape 2 sur 3",
    sidebarHeading: "Nous avons lu<br>votre formulaire.",
    sidebarBody:
      "Vérifiez ce que notre IA a extrait. Confirmez que le texte est correct, ou signalez un problème avant de continuer.",
    stepLabel: "Étape 2 sur 3 · Vérifier l’extraction",
    docMeta: "téléversé à l’instant",
    fieldLabel: "Texte extrait",
    hint: "Confirmez que l’extraction est correcte, ou signalez une erreur.",
    back: "Retour",
    confirm: "Confirmer et poser des questions",
  },
};
