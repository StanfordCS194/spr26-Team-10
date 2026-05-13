"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  IconArrowUp,
  IconChevronRight,
  IconCircleDot,
  IconFileText,
  IconSparkles,
  IconUpload,
} from "@tabler/icons-react";
import { AppNav } from "@/components/navigation/app-nav";
import MessageBubble from "@/app/chat/MessageBubble";
import ChatHistorySidebar from "@/app/chat/ChatHistorySidebar";
import type { LanguageOption } from "@/app/chat/LanguageDropdown";
import { resolveLanguageForStep } from "@/lib/language-preference";
import styles from "@/app/chat/chat-panel.module.css";

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
  yourChats: string;
  newChat: string;
  noChats: string;
  loadingChats: string;
  chatsLoadFailed: string;
  deleteChatConfirm: string;
  deleteChatLabel: string;
  untitledChat: string;
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
    yourChats: "Your chats",
    newChat: "New chat",
    noChats: "No chats yet. Ask a question to start one.",
    loadingChats: "Loading chats…",
    chatsLoadFailed: "Could not load your chats.",
    deleteChatConfirm: "Delete this chat permanently?",
    deleteChatLabel: "Delete chat",
    untitledChat: "Untitled chat",
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
    yourChats: "Tus chats",
    newChat: "Nuevo chat",
    noChats: "Aún no tienes chats. Haz una pregunta para empezar.",
    loadingChats: "Cargando chats…",
    chatsLoadFailed: "No se pudieron cargar tus chats.",
    deleteChatConfirm: "¿Eliminar este chat permanentemente?",
    deleteChatLabel: "Eliminar chat",
    untitledChat: "Chat sin título",
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
    yourChats: "你的对话",
    newChat: "新建对话",
    noChats: "还没有对话，提个问题开始吧。",
    loadingChats: "正在加载对话…",
    chatsLoadFailed: "无法加载对话列表。",
    deleteChatConfirm: "永久删除此对话？",
    deleteChatLabel: "删除对话",
    untitledChat: "未命名对话",
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
    yourChats: "محادثاتك",
    newChat: "محادثة جديدة",
    noChats: "لا توجد محادثات بعد. اطرح سؤالاً للبدء.",
    loadingChats: "جارٍ تحميل المحادثات…",
    chatsLoadFailed: "تعذر تحميل محادثاتك.",
    deleteChatConfirm: "حذف هذه المحادثة نهائيًا؟",
    deleteChatLabel: "حذف المحادثة",
    untitledChat: "محادثة بدون عنوان",
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
    yourChats: "Vos discussions",
    newChat: "Nouvelle discussion",
    noChats: "Aucune discussion. Posez une question pour démarrer.",
    loadingChats: "Chargement des discussions…",
    chatsLoadFailed: "Impossible de charger vos discussions.",
    deleteChatConfirm: "Supprimer définitivement cette discussion ?",
    deleteChatLabel: "Supprimer la discussion",
    untitledChat: "Discussion sans titre",
  },
};

function SidebarDocSkeleton() {
  return (
    <div className={styles.annotationStack} aria-hidden>
      <div className={styles.sidebarSkeletonRow} style={{ width: "55%" }} />
      <div className={styles.sidebarSkeletonRow} style={{ width: "90%" }} />
    </div>
  );
}

type ChatThreadProps = {
  sessionId: string;
  language: LanguageOption["code"];
  labels: UiLabels;
  documentId: string | undefined;
};

function toUIMessage(row: {
  id: string;
  role: "user" | "assistant";
  content: string;
}): UIMessage {
  return {
    id: row.id,
    role: row.role,
    parts: [{ type: "text", text: row.content }],
  };
}

function ChatThread({
  sessionId,
  language,
  labels,
  documentId,
}: ChatThreadProps) {
  const [hydrated, setHydrated] = useState<UIMessage[] | null>(null);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setHydrated(null);
    setHydrationError(null);
    fetch(`/api/chat-sessions/${sessionId}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{
          messages: { id: string; role: "user" | "assistant"; content: string }[];
        }>;
      })
      .then((data) => {
        if (cancelled) return;
        setHydrated(data.messages.map(toUIMessage));
      })
      .catch(() => {
        if (cancelled) return;
        setHydrated([]);
        setHydrationError(labels.loadFailed);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, labels.loadFailed]);

  const { messages, sendMessage, status, error, regenerate } = useChat({
    messages: hydrated ?? [],
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";
  const showTyping = isBusy;
  const hasConversation = messages.length > 0 || showTyping;
  const isHydrating = hydrated === null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTyping]);

  const handleSend = useCallback(
    (text?: string) => {
      const raw = (text ?? inputValue).trim();
      if (!raw || isBusy) return;
      sendMessage(
        { text: raw },
        {
          body: {
            sessionId,
            language,
          },
        },
      );
      setInputValue("");
    },
    [inputValue, isBusy, language, sendMessage, sessionId],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    labels.suggestQ1,
    labels.suggestQ2,
    labels.suggestQ3,
  ];

  return (
    <>
      <div
        className={styles.messages}
        aria-busy={isBusy || isHydrating}
        aria-live="polite"
      >
        {isHydrating ? (
          <p className={styles.disclaimer} style={{ padding: "var(--space-4)" }}>
            {labels.loadingDocument}
          </p>
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

        {!isHydrating && hasConversation
          ? messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onSuggestionClick={(value) => setInputValue(value)}
              />
            ))
          : null}

        {!isHydrating && showTyping ? (
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

        {error || hydrationError ? (
          <div className={styles.annotationStack}>
            <div
              className={styles.annotationCard}
              style={{ borderColor: "#d70015", background: "#fff2f2" }}
              role="alert"
            >
              <p
                className={styles.annotationDetail}
                style={{ color: "#d70015" }}
              >
                {error ? labels.errorChat : hydrationError}
              </p>
            </div>
            {error ? (
              <button
                type="button"
                className={styles.suggestionBtn}
                onClick={() => regenerate()}
              >
                {labels.retry}
              </button>
            ) : null}
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
            disabled={isBusy || isHydrating}
            aria-label={labels.inputLabel}
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isBusy || isHydrating}
            aria-label="Send message"
          >
            <IconArrowUp size={14} aria-hidden />
          </button>
        </div>
        <p className={styles.disclaimer}>{labels.footerHint}</p>
      </div>
    </>
  );
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId") ?? undefined;
  const sessionId = searchParams.get("sessionId") ?? undefined;

  const selectedLanguage = useMemo(
    (): LanguageOption => resolveLanguageForStep(searchParams.get("language")),
    [searchParams],
  );

  const [sidebarDocument, setSidebarDocument] =
    useState<SidebarDocument | null>(null);
  const [sidebarActionItems, setSidebarActionItems] = useState<
    SidebarActionItem[]
  >([]);
  const [sidebarError, setSidebarError] = useState("");
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [sidebarFetchKey, setSidebarFetchKey] = useState(0);
  const [creatingSession, setCreatingSession] = useState(false);

  const labels = uiLabels[selectedLanguage.code];
  const isRtl = selectedLanguage.code === "ar";

  // Auto-create a chat session whenever we have a documentId but no sessionId
  // in the URL. The replace() call rewrites the URL so we land on a stable
  // /step/3?documentId=...&sessionId=... that the user can bookmark or share.
  useEffect(() => {
    if (!documentId || sessionId || creatingSession) return;
    let cancelled = false;
    setCreatingSession(true);

    fetch("/api/chat-sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        documentId,
        language: selectedLanguage.code,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ session: { id: string } }>;
      })
      .then(({ session }) => {
        if (cancelled) return;
        const params = new URLSearchParams({
          documentId,
          sessionId: session.id,
          language: selectedLanguage.code,
        });
        router.replace(`/step/3?${params.toString()}`);
      })
      .catch(() => {
        if (cancelled) return;
        setCreatingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId, sessionId, creatingSession, selectedLanguage.code, router]);

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
          setSidebarError(e instanceof Error ? e.message : loadFailedLabel);
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

  const documentTitle = sidebarDocument?.fileName ?? labels.noDocumentTitle;
  const documentSubtitle =
    sidebarDocument?.formDescription ?? sidebarDocument?.formType ?? "";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={styles.page}>
      <AppNav backLabel="Back to home" backTo="/" />

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <ChatHistorySidebar
              currentSessionId={sessionId ?? null}
              currentDocumentId={documentId ?? null}
              currentLanguage={selectedLanguage.code}
              labels={{
                heading: labels.yourChats,
                newChat: labels.newChat,
                empty: labels.noChats,
                loading: labels.loadingChats,
                loadFailed: labels.chatsLoadFailed,
                deleteConfirm: labels.deleteChatConfirm,
                deleteAria: labels.deleteChatLabel,
                untitled: labels.untitledChat,
              }}
            />
          </div>

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
                href={`/step/1?language=${encodeURIComponent(selectedLanguage.code)}`}
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
            <Link
              href={`/step/1?language=${encodeURIComponent(selectedLanguage.code)}`}
              className={styles.uploadNewBtn}
            >
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

          {!documentId ? (
            <div className={styles.messages}>
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <IconSparkles size={22} stroke={1.5} aria-hidden />
                </div>
                <h2 className={styles.emptyHeading}>{labels.noDocumentTitle}</h2>
                <p className={styles.emptyText}>{labels.noDocumentBody}</p>
                <Link
                  href={`/step/1?language=${encodeURIComponent(selectedLanguage.code)}`}
                  className={styles.suggestionBtn}
                >
                  {labels.goUpload}
                  <IconChevronRight size={12} aria-hidden />
                </Link>
              </div>
            </div>
          ) : !sessionId ? (
            <div className={styles.messages}>
              <p className={styles.disclaimer} style={{ padding: "var(--space-4)" }}>
                {labels.loadingDocument}
              </p>
            </div>
          ) : (
            <ChatThread
              key={sessionId}
              sessionId={sessionId}
              language={selectedLanguage.code}
              labels={labels}
              documentId={documentId}
            />
          )}
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
