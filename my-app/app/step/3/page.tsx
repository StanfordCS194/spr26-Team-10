"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  IconArrowUp,
  IconChevronRight,
  IconCircleDot,
  IconFileText,
  IconSparkles,
  IconUpload,
} from "@tabler/icons-react";
import { AppNav } from "@/components/dazl/app-nav/app-nav";
import MessageBubble from "@/app/chat/MessageBubble";
import LanguageDropdown, {
  languages,
  LanguageOption,
} from "@/app/chat/LanguageDropdown";
import styles from "@/app/chat/chat-dazl.module.css";

type SidebarActionItem = {
  id: string;
  title: string;
  detail: string | null;
  sortOrder: number;
};

type SidebarDocument = {
  id: string;
  fileName: string;
  formType: string | null;
  formDescription: string | null;
};

type UiLabels = {
  subtitle: string;
  currentDocument: string;
  actionItems: string;
  uploadNewDocument: string;
  understandingTitle: string;
  emptyChatPrompt: string;
  noDocumentTitle: string;
  noDocumentBody: string;
  goUpload: string;
  loadingDocument: string;
  loadFailed: string;
  retry: string;
  noActionItems: string;
  errorChat: string;
  chatPlaceholder: string;
  chatWaiting: string;
  chatDisabledPlaceholder: string;
  footerHint: string;
  inputLabel: string;
  chatHeroTitle: string;
  aiPillLabel: string;
  stepBadgeLabel: string;
  emptyHeading: string;
  emptySubtext: string;
  suggestQ1: string;
  suggestQ2: string;
  suggestQ3: string;
};

const uiLabels: Record<LanguageOption["code"], UiLabels> = {
  en: {
    subtitle: "Plain language. Your language. No jargon.",
    currentDocument: "Current document",
    actionItems: "Action items",
    uploadNewDocument: "Upload new document",
    understandingTitle: "Understanding your form",
    emptyChatPrompt:
      "Ask your first question about this document to start the chat.",
    noDocumentTitle: "No document loaded",
    noDocumentBody:
      "Upload a document from the home page to unlock chat and sidebar details.",
    goUpload: "Go to upload",
    loadingDocument: "Loading document…",
    loadFailed: "Could not load document details.",
    retry: "Retry",
    noActionItems: "No action items yet.",
    errorChat: "Something went wrong. Please try again.",
    chatPlaceholder: "Ask a question about your form…",
    chatWaiting: "Waiting for response…",
    chatDisabledPlaceholder: "Upload a document first to ask questions.",
    footerHint:
      "Responses are grounded in your document. Always verify important details.",
    inputLabel: "Your question",
    chatHeroTitle: "Ask anything about your form",
    aiPillLabel: "AI-powered",
    stepBadgeLabel: "Step 3 of 3 · Ask anything",
    emptyHeading: "Ready to help",
    emptySubtext:
      "Your form has been read and verified. Ask me anything. I will answer in plain language.",
    suggestQ1: "What documents do I need to gather?",
    suggestQ2: "What does this line mean?",
    suggestQ3: "Can I file an extension?",
  },
  es: {
    subtitle: "Lenguaje claro. Tu idioma. Sin jerga.",
    currentDocument: "Documento actual",
    actionItems: "Tareas",
    uploadNewDocument: "Subir nuevo documento",
    understandingTitle: "Entender tu formulario",
    emptyChatPrompt:
      "Haz tu primera pregunta sobre este documento para iniciar el chat.",
    noDocumentTitle: "No hay documento",
    noDocumentBody:
      "Sube un documento desde la página principal para activar el chat y la barra lateral.",
    goUpload: "Ir a subir",
    loadingDocument: "Cargando documento…",
    loadFailed: "No se pudieron cargar los datos del documento.",
    retry: "Reintentar",
    noActionItems: "Aún no hay tareas.",
    errorChat: "Algo salió mal. Inténtalo de nuevo.",
    chatPlaceholder: "Haz una pregunta sobre tu formulario…",
    chatWaiting: "Esperando respuesta…",
    chatDisabledPlaceholder: "Primero sube un documento para preguntar.",
    footerHint:
      "Las respuestas se basan en tu documento. Verifica siempre los datos importantes.",
    inputLabel: "Tu pregunta",
    chatHeroTitle: "Pregunta lo que quieras sobre tu formulario",
    aiPillLabel: "Con IA",
    stepBadgeLabel: "Paso 3 de 3 · Pregunta lo que quieras",
    emptyHeading: "Listo para ayudarte",
    emptySubtext:
      "Tu formulario fue leído y verificado. Pregunta lo que necesites. Responderé en lenguaje claro.",
    suggestQ1: "¿Qué documentos necesito reunir?",
    suggestQ2: "¿Qué significa esta línea?",
    suggestQ3: "¿Puedo pedir una prórroga?",
  },
  zh: {
    subtitle: "清晰易懂。用你的语言。没有术语障碍。",
    currentDocument: "当前文件",
    actionItems: "待办事项",
    uploadNewDocument: "上传新文件",
    understandingTitle: "理解你的表格",
    emptyChatPrompt: "提出第一个问题以开始对话。",
    noDocumentTitle: "尚未加载文件",
    noDocumentBody: "请从首页上传文件以启用聊天和侧边栏信息。",
    goUpload: "去上传",
    loadingDocument: "正在加载文件…",
    loadFailed: "无法加载文件信息。",
    retry: "重试",
    noActionItems: "暂无待办。",
    errorChat: "出错了，请重试。",
    chatPlaceholder: "输入与表格相关的问题…",
    chatWaiting: "等待回复中…",
    chatDisabledPlaceholder: "请先上传文件再提问。",
    footerHint: "回答基于你的文件，重要信息请务必自行核实。",
    inputLabel: "你的问题",
    chatHeroTitle: "尽管问与表格相关的问题",
    aiPillLabel: "AI 辅助",
    stepBadgeLabel: "第 3 步 · 自由提问",
    emptyHeading: "已准备好协助你",
    emptySubtext:
      "你的表格已读取并核对。随时提问，我会用清晰的中文回答。",
    suggestQ1: "我需要准备哪些材料？",
    suggestQ2: "这一栏是什么意思？",
    suggestQ3: "我可以申请延期吗？",
  },
  ar: {
    subtitle: "لغة واضحة. لغتك. بلا مصطلحات معقدة.",
    currentDocument: "المستند الحالي",
    actionItems: "مهام",
    uploadNewDocument: "تحميل مستند جديد",
    understandingTitle: "فهم النموذج",
    emptyChatPrompt: "اطرح أول سؤال حول هذا المستند لبدء المحادثة.",
    noDocumentTitle: "لا يوجد مستند",
    noDocumentBody:
      "حمّل مستندًا من الصفحة الرئيسية لتفعيل الدردشة والشريط الجانبي.",
    goUpload: "الانتقال للتحميل",
    loadingDocument: "جارٍ تحميل المستند…",
    loadFailed: "تعذر تحميل تفاصيل المستند.",
    retry: "إعادة المحاولة",
    noActionItems: "لا توجد مهام بعد.",
    errorChat: "حدث خطأ. حاول مرة أخرى.",
    chatPlaceholder: "اطرح سؤالاً عن النموذج…",
    chatWaiting: "في انتظار الرد…",
    chatDisabledPlaceholder: "حمّل مستندًا أولاً لطرح الأسئلة.",
    footerHint: "الإجابات مبنية على مستندك. تحقق دائمًا من التفاصيل المهمة.",
    inputLabel: "سؤالك",
    chatHeroTitle: "اسأل أي شيء عن نموذجك",
    aiPillLabel: "مدعوم بالذكاء الاصطناعي",
    stepBadgeLabel: "الخطوة 3 من 3 · اسأل بحرية",
    emptyHeading: "جاهز للمساعدة",
    emptySubtext:
      "تمت قراءة نموذجك والتحقق منه. اسأل عن أي شيء. سأجيب بلغة بسيطة.",
    suggestQ1: "ما المستندات التي أحتاجها؟",
    suggestQ2: "ماذا يعني هذا السطر؟",
    suggestQ3: "هل يمكنني طلب تمديد؟",
  },
  fr: {
    subtitle: "Langage simple. Votre langue. Pas de jargon.",
    currentDocument: "Document actuel",
    actionItems: "Actions",
    uploadNewDocument: "Téléverser un nouveau document",
    understandingTitle: "Comprendre votre formulaire",
    emptyChatPrompt:
      "Posez votre première question sur ce document pour démarrer.",
    noDocumentTitle: "Aucun document",
    noDocumentBody:
      "Téléversez un document depuis l’accueil pour activer le chat et la barre latérale.",
    goUpload: "Aller au téléversement",
    loadingDocument: "Chargement du document…",
    loadFailed: "Impossible de charger les détails du document.",
    retry: "Réessayer",
    noActionItems: "Pas encore d’actions.",
    errorChat: "Une erreur s’est produite. Réessayez.",
    chatPlaceholder: "Posez une question sur votre formulaire…",
    chatWaiting: "En attente de la réponse…",
    chatDisabledPlaceholder:
      "Téléversez d’abord un document pour poser des questions.",
    footerHint:
      "Les réponses s’appuient sur votre document. Vérifiez toujours les détails importants.",
    inputLabel: "Votre question",
    chatHeroTitle: "Posez n’importe quelle question sur votre formulaire",
    aiPillLabel: "Assisté par l’IA",
    stepBadgeLabel: "Étape 3 sur 3 · Posez vos questions",
    emptyHeading: "Prêt à vous aider",
    emptySubtext:
      "Votre formulaire a été lu et vérifié. Posez vos questions. Je réponds en langage clair.",
    suggestQ1: "Quels documents dois-je rassembler ?",
    suggestQ2: "Que signifie cette ligne ?",
    suggestQ3: "Puis-je demander une prolongation ?",
  },
};

function SidebarDocSkeleton() {
  return (
    <div className={styles.annotationStack} aria-hidden>
      <div
        className={styles.sidebarSkeletonRow}
        style={{ width: "55%" }}
      />
      <div
        className={styles.sidebarSkeletonRow}
        style={{ width: "90%" }}
      />
    </div>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId") ?? undefined;

  const languageFromUrl = searchParams.get("language");
  const selectedLanguage = useMemo(
    () =>
      languages.find((l) => l.code === languageFromUrl) ?? languages[0],
    [languageFromUrl],
  );

  const [inputValue, setInputValue] = useState("");
  const [sidebarDocument, setSidebarDocument] =
    useState<SidebarDocument | null>(null);
  const [sidebarActionItems, setSidebarActionItems] = useState<
    SidebarActionItem[]
  >([]);
  const [sidebarError, setSidebarError] = useState("");
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarFetchKey, setSidebarFetchKey] = useState(0);

  const labels = uiLabels[selectedLanguage.code];
  const isRtl = selectedLanguage.code === "ar";

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleLanguageSelect = (lang: LanguageOption) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("language", lang.code);
    if (documentId) next.set("documentId", documentId);
    router.replace(`/step/3?${next.toString()}`, { scroll: false });
  };

  const { messages, sendMessage, status, error, regenerate } = useChat({
    messages: [],
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";
  const showTyping = isBusy;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTyping]);

  useEffect(() => {
    const loadFailedLabel = uiLabels[selectedLanguage.code].loadFailed;
    let cancelled = false;

    async function loadSidebar() {
      if (!documentId) {
        setSidebarDocument(null);
        setSidebarActionItems([]);
        setSidebarError("");
        setSidebarLoading(false);
        return;
      }

      setSidebarLoading(true);
      setSidebarError("");
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        const data = (await response.json()) as {
          document?: SidebarDocument;
          actionItems?: SidebarActionItem[];
          error?: string;
        };

        if (!response.ok || !data.document) {
          throw new Error(data.error ?? loadFailedLabel);
        }

        if (!cancelled) {
          setSidebarDocument(data.document);
          setSidebarActionItems(data.actionItems ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setSidebarError(
            e instanceof Error ? e.message : loadFailedLabel,
          );
          setSidebarDocument(null);
          setSidebarActionItems([]);
        }
      } finally {
        if (!cancelled) setSidebarLoading(false);
      }
    }

    void loadSidebar();
    return () => {
      cancelled = true;
    };
  }, [documentId, selectedLanguage.code, sidebarFetchKey]);

  const handleSend = (text?: string) => {
    const raw = (text ?? inputValue).trim();
    if (!raw || isBusy || !documentId) return;
    sendMessage(
      { text: raw },
      {
        body: {
          documentId,
          language: selectedLanguage.code,
        },
      },
    );
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const documentTitle =
    sidebarDocument?.fileName ?? labels.noDocumentTitle;
  const documentSubtitle =
    sidebarDocument?.formDescription ??
    sidebarDocument?.formType ??
    "";

  const suggestedQuestions = [
    labels.suggestQ1,
    labels.suggestQ2,
    labels.suggestQ3,
  ];

  const hasConversation = messages.length > 0 || showTyping;

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={styles.page}>
      <AppNav
        backLabel="Back to home"
        backTo="/"
        rightSlot={
          <LanguageDropdown
            variant="nav"
            selected={selectedLanguage}
            onSelect={handleLanguageSelect}
          />
        }
      />

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <p className={styles.sidebarEyebrow}>{labels.currentDocument}</p>
            <div className={styles.docCard}>
              <div className={styles.docCardIcon}>
                <IconFileText size={16} stroke={1.5} aria-hidden />
              </div>
              <div className={styles.docCardInfo}>
                {sidebarLoading ? (
                  <SidebarDocSkeleton />
                ) : (
                  <>
                    <p className={styles.docCardName}>{documentTitle}</p>
                    <p className={styles.docCardType}>
                      {documentSubtitle ||
                        (!documentId ? labels.noDocumentBody : "\u00a0")}
                    </p>
                  </>
                )}
              </div>
            </div>
            {!documentId ? (
              <Link
                href="/step/1"
                className={styles.uploadNewBtn}
                style={{ marginTop: "var(--space-3)" }}
              >
                {labels.goUpload}
              </Link>
            ) : null}
          </div>

          <div className={styles.sidebarSection}>
            <p className={styles.sidebarEyebrow}>{labels.actionItems}</p>
            <div className={styles.actionList}>
              {sidebarLoading ? (
                <SidebarDocSkeleton />
              ) : sidebarActionItems.length > 0 ? (
                sidebarActionItems.map((item) => (
                  <div key={item.id} className={styles.actionItem}>
                    <IconCircleDot
                      size={13}
                      stroke={1.5}
                      className={styles.actionIcon}
                      aria-hidden
                    />
                    <div>
                      <p className={styles.actionLabel}>{item.title}</p>
                      {item.detail ? (
                        <p className={styles.actionValue}>{item.detail}</p>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p
                  className={styles.actionValue}
                  style={{ padding: "var(--space-2)" }}
                >
                  {labels.noActionItems}
                </p>
              )}
            </div>
          </div>

          {sidebarError ? (
            <div className={styles.sidebarSection}>
              <p
                className={styles.actionLabel}
                style={{ color: "#d70015" }}
                role="alert"
              >
                {sidebarError}
              </p>
              <button
                type="button"
                className={styles.uploadNewBtn}
                onClick={() => setSidebarFetchKey((k) => k + 1)}
              >
                {labels.retry}
              </button>
            </div>
          ) : null}

          <div className={styles.sidebarFooter}>
            <Link href="/step/1" className={styles.uploadNewBtn}>
              <IconUpload size={13} aria-hidden />
              {labels.uploadNewDocument}
            </Link>
          </div>
        </aside>

        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.aiPill}>
                <IconSparkles size={11} aria-hidden />
                {labels.aiPillLabel}
              </div>
              <h1 className={styles.chatHeading}>{labels.chatHeroTitle}</h1>
              <p className={styles.chatSubtitle}>{labels.subtitle}</p>
            </div>
            <p className={styles.stepBadge}>{labels.stepBadgeLabel}</p>
          </div>

          <div
            className={styles.messages}
            aria-busy={isBusy}
            aria-live="polite"
          >
            {!documentId ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <IconSparkles size={22} stroke={1.5} aria-hidden />
                </div>
                <h2 className={styles.emptyHeading}>{labels.noDocumentTitle}</h2>
                <p className={styles.emptyText}>{labels.noDocumentBody}</p>
                <Link href="/step/1" className={styles.suggestionBtn}>
                  {labels.goUpload}
                  <IconChevronRight size={12} aria-hidden />
                </Link>
              </div>
            ) : !hasConversation ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <IconSparkles size={22} stroke={1.5} aria-hidden />
                </div>
                <h2 className={styles.emptyHeading}>{labels.emptyHeading}</h2>
                <p className={styles.emptyText}>{labels.emptySubtext}</p>
                <div className={styles.suggestions}>
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={styles.suggestionBtn}
                      onClick={() => handleSend(q)}
                    >
                      {q}
                      <IconChevronRight size={12} aria-hidden />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {documentId && hasConversation
              ? messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    onSuggestionClick={(value) => setInputValue(value)}
                  />
                ))
              : null}

            {documentId && showTyping ? (
              <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                <div className={styles.bubbleAvatar}>
                  <IconSparkles size={11} aria-hidden />
                </div>
                <div className={styles.typingDots} aria-label={labels.chatWaiting}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}

            {error ? (
              <div className={styles.annotationStack}>
                <div
                  className={styles.annotationCard}
                  style={{
                    borderColor: "#d70015",
                    background: "#fff2f2",
                  }}
                  role="alert"
                >
                  <p className={styles.annotationDetail} style={{ color: "#d70015" }}>
                    {labels.errorChat}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.suggestionBtn}
                  onClick={() => regenerate()}
                >
                  {labels.retry}
                </button>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputArea}>
            <span className="sr-only">{labels.inputLabel}</span>
            <div className={styles.inputBox}>
              <textarea
                ref={textareaRef}
                className={styles.textarea}
                placeholder={
                  !documentId
                    ? labels.chatDisabledPlaceholder
                    : labels.chatPlaceholder
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={!documentId || isBusy}
                aria-label={labels.inputLabel}
              />
              <button
                type="button"
                className={styles.sendBtn}
                onClick={() => handleSend()}
                disabled={!documentId || !inputValue.trim() || isBusy}
                aria-label="Send message"
              >
                <IconArrowUp size={14} aria-hidden />
              </button>
            </div>
            <p className={styles.disclaimer}>{labels.footerHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPageFallback() {
  return (
    <div className={styles.page}>
      <p
        className={styles.disclaimer}
        style={{ margin: "auto", padding: "var(--space-8)" }}
      >
        Loading…
      </p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageFallback />}>
      <ChatPageContent />
    </Suspense>
  );
}
