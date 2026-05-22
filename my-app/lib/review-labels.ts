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
  navBack: string;  
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;

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
    navBack: "Back to home", 
    step1Title: "Upload your document",
    step1Desc: "Any government form: PDF, photo, or scan. We handle the rest.",
    step2Title: "Review the extraction",
    step2Desc: "Confirm what we read before you ask questions.",
    step3Title: "Ask anything",
    step3Desc: "Questions answered clearly, in your language.",
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
    navBack: "Volver al inicio", 
    step1Title: "Sube tu documento",
    step1Desc: "Cualquier formulario oficial: PDF, foto o escaneo. Nosotros hacemos el resto.",
    step2Title: "Revisa la extracción",
    step2Desc: "Confirma lo que leímos antes de hacer preguntas.",
    step3Title: "Pregunta lo que quieras",
    step3Desc: "Preguntas respondidas claramente, en tu idioma.",
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
    navBack: "返回主页", 
    step1Title: "上传你的文件",
    step1Desc: "任何政府表格：PDF、照片或扫描件，我们来处理。",
    step2Title: "核对提取内容",
    step2Desc: "在提问之前确认我们读取的内容。",
    step3Title: "随时提问",
    step3Desc: "用你的语言，清晰回答问题。",
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
    navBack: "العودة إلى الرئيسية", 
    step1Title: "ارفع مستندك",
    step1Desc: "أي نموذج حكومي: PDF أو صورة أو مسح ضوئي. نحن نتولى الباقي.",
    step2Title: "راجع الاستخراج",
    step2Desc: "تأكد مما قرأناه قبل طرح الأسئلة.",
    step3Title: "اسأل أي شيء",
    step3Desc: "إجابات واضحة بلغتك.",
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
    navBack: "Retour à l'accueil", 
    step1Title: "Téléversez votre document",
    step1Desc: "Tout formulaire officiel : PDF, photo ou scan. On s'occupe du reste.",
    step2Title: "Vérifiez l'extraction",
    step2Desc: "Confirmez ce que nous avons lu avant de poser des questions.",
    step3Title: "Posez vos questions",
    step3Desc: "Des réponses claires, dans votre langue.",
  },
};
