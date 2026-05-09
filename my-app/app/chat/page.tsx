"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import LanguageDropdown, {
  languages,
  LanguageOption,
} from "./LanguageDropdown";

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
  docViewerPlaceholder: string;
};

const uiLabels: Record<LanguageOption["code"], UiLabels> = {
  en: {
    subtitle: "Ask me anything about your document",
    currentDocument: "Current Document",
    actionItems: "Action Items",
    uploadNewDocument: "Upload New Document",
    understandingTitle: "Understanding Your Form",
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
    docViewerPlaceholder: "Document viewer panel (coming next)",
  },
  es: {
    subtitle: "Pregúntame lo que quieras sobre tu documento",
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
    docViewerPlaceholder: "Panel del documento (próximamente)",
  },
  zh: {
    subtitle: "尽管问与文件相关的问题",
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
    docViewerPlaceholder: "文件预览面板（即将推出）",
  },
  ar: {
    subtitle: "اسألني أي شيء عن مستندك",
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
    docViewerPlaceholder: "لوحة عرض المستند (قريبًا)",
  },
  fr: {
    subtitle: "Posez-moi des questions sur votre document",
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
    docViewerPlaceholder: "Panneau document (bientôt)",
  },
};

function SidebarDocSkeleton() {
  return (
    <div className="animate-pulse space-y-2" aria-hidden>
      <div className="h-3 w-24 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-200" />
      <div className="h-3 w-4/5 rounded bg-gray-200" />
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

  const handleLanguageSelect = (lang: LanguageOption) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("language", lang.code);
    if (documentId) next.set("documentId", documentId);
    router.replace(`/chat?${next.toString()}`, { scroll: false });
  };

  const { messages, sendMessage, status, error, regenerate } = useChat({
    messages: [],
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";

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

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isBusy || !documentId) return;
    sendMessage(
      { text },
      {
        body: {
          documentId,
          language: selectedLanguage.code,
        },
      },
    );
    setInputValue("");
  };

  const showTyping = isBusy;

  const documentTitle =
    sidebarDocument?.fileName ?? labels.noDocumentTitle;
  const documentSubtitle =
    sidebarDocument?.formDescription ??
    sidebarDocument?.formType ??
    "";

  const sidebarDocBlock = (
    <>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {labels.currentDocument}
      </p>
      {sidebarLoading ? (
        <SidebarDocSkeleton />
      ) : (
        <>
          <p className="text-sm font-semibold text-[var(--navy)]">
            {documentTitle}
          </p>
          {documentSubtitle ? (
            <p className="text-xs text-gray-500">{documentSubtitle}</p>
          ) : null}
        </>
      )}
    </>
  );

  const sidebarActionsBlock = (
    <>
      <p className="mb-3 text-sm font-semibold">{labels.actionItems}</p>
      {sidebarLoading ? (
        <SidebarDocSkeleton />
      ) : sidebarActionItems.length > 0 ? (
        <ol className="space-y-3 text-sm">
          {sidebarActionItems.map((item) => (
            <li key={item.id}>
              <p className="font-medium">{item.title}</p>
              {item.detail ? (
                <p className="text-xs text-slate-300">{item.detail}</p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-slate-300">{labels.noActionItems}</p>
      )}
    </>
  );

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="flex min-h-screen flex-col bg-[var(--cream)] md:flex-row"
    >
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[#efe6df] bg-white p-4 md:flex">
        <div className="mb-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/formly_nobackground.png"
              alt="formly.ai logo"
              width={120}
              height={96}
              className="h-auto w-[84px] shrink-0 object-contain"
            />
          </div>
        </div>

        <div className="mb-5">
          <LanguageDropdown
            selected={selectedLanguage}
            onSelect={handleLanguageSelect}
          />
        </div>

        <div className="mb-4 rounded-xl border border-[#efe6df] bg-[#fbf8f5] p-3">
          {sidebarDocBlock}
        </div>

        <div className="rounded-2xl bg-[#1C2B3A] p-4 text-white">
          {sidebarActionsBlock}
        </div>

        {sidebarError ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-red-600">{sidebarError}</p>
            <button
              type="button"
              onClick={() => setSidebarFetchKey((k) => k + 1)}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700"
            >
              {labels.retry}
            </button>
          </div>
        ) : null}

        <Link
          href="/"
          className="mt-auto rounded-xl border border-[#efe6df] bg-[#fbf8f5] px-4 py-3 text-center text-sm font-medium text-[var(--navy)]"
        >
          {labels.uploadNewDocument}
        </Link>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[#efe6df] bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="mb-3 flex items-center justify-between md:hidden">
            <div className="flex items-center">
              <Image
                src="/formly_nobackground.png"
                alt="formly.ai logo"
                width={106}
                height={84}
                className="h-auto w-[76px] shrink-0 object-contain"
              />
            </div>
            <LanguageDropdown
              selected={selectedLanguage}
              onSelect={handleLanguageSelect}
            />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--navy)] sm:text-3xl">
            {labels.understandingTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{labels.subtitle}</p>
        </header>

        <div className="border-b border-[#efe6df] bg-white px-4 py-3 md:hidden">
          <div className="mb-3 rounded-xl border border-[#efe6df] bg-[#fbf8f5] p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {labels.currentDocument}
            </p>
            {sidebarLoading ? (
              <SidebarDocSkeleton />
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--navy)]">
                  {documentTitle}
                </p>
                {documentSubtitle ? (
                  <p className="text-xs text-gray-500">{documentSubtitle}</p>
                ) : null}
              </>
            )}
          </div>
          <div className="rounded-xl bg-[#1C2B3A] p-3 text-white">
            <p className="mb-2 text-sm font-semibold">{labels.actionItems}</p>
            {sidebarLoading ? (
              <SidebarDocSkeleton />
            ) : sidebarActionItems.length > 0 ? (
              <ol className="space-y-2 text-xs">
                {sidebarActionItems.map((item) => (
                  <li key={item.id}>
                    <span className="font-medium">{item.title}</span>
                    {item.detail ? (
                      <span className="block text-slate-300">{item.detail}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-slate-300">{labels.noActionItems}</p>
            )}
          </div>
          {sidebarError ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-red-600">{sidebarError}</p>
              <button
                type="button"
                onClick={() => setSidebarFetchKey((k) => k + 1)}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700"
              >
                {labels.retry}
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-[var(--cream)]">
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6"
            aria-busy={isBusy}
            aria-live="polite"
          >
            {!documentId ? (
              <div className="mb-3 max-w-md rounded-2xl border border-[#efe6df] bg-white p-4 text-sm text-[var(--navy)] shadow-sm">
                <p className="font-semibold">{labels.noDocumentTitle}</p>
                <p className="mt-2 text-gray-600">{labels.noDocumentBody}</p>
                <Link
                  href="/"
                  className="mt-3 inline-flex rounded-xl bg-[var(--coral)] px-4 py-2 text-sm font-medium text-white"
                >
                  {labels.goUpload}
                </Link>
              </div>
            ) : null}

            {documentId && messages.length === 0 ? (
              <div className="mb-3 max-w-lg rounded-2xl border border-[#efe6df] bg-white p-4 text-sm text-gray-600 shadow-sm">
                {labels.emptyChatPrompt}
              </div>
            ) : null}

            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onSuggestionClick={(value) => setInputValue(value)}
              />
            ))}

            {showTyping ? (
              <div className="mb-3 flex gap-3" aria-label="Assistant is typing">
                <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--coral)]" />
                <div className="rounded-2xl border border-[#efe6df] bg-white px-4 py-3 text-sm text-gray-400 shadow-sm">
                  <span className="inline-flex gap-1">
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse [animation-delay:150ms]">
                      .
                    </span>
                    <span className="animate-pulse [animation-delay:300ms]">
                      .
                    </span>
                  </span>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="mb-3 flex flex-col items-start gap-2">
                <div className="rounded-2xl border border-[#f6d4cb] bg-[#fff5f2] px-4 py-3 text-sm text-[var(--coral)] shadow-sm">
                  {labels.errorChat}
                </div>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="rounded-full border border-[#f6d4cb] bg-white px-3 py-1 text-xs font-medium text-[var(--coral)] transition hover:bg-[#fff5f2]"
                >
                  {labels.retry}
                </button>
              </div>
            ) : null}
          </div>
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            isLoading={isBusy}
            disabled={!documentId}
            placeholder={
              !documentId
                ? labels.chatDisabledPlaceholder
                : labels.chatPlaceholder
            }
            waitingPlaceholder={labels.chatWaiting}
            footerHint={labels.footerHint}
          />
        </div>
      </section>

      <aside className="hidden w-[320px] shrink-0 border-l border-[#efe6df] bg-white p-6 xl:block">
        <div className="rounded-2xl border border-dashed border-[#d9cdc2] bg-[#faf7f3] p-4 text-sm text-gray-500">
          {labels.docViewerPlaceholder}
        </div>
      </aside>
    </main>
  );
}

function ChatPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] px-4">
      <p className="text-sm text-gray-500">Loading…</p>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageFallback />}>
      <ChatPageContent />
    </Suspense>
  );
}
