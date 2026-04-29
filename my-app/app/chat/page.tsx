"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { seedMessages } from "./messages";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import LanguageDropdown, {
  languages,
  LanguageOption,
} from "./LanguageDropdown";

const uiLabels: Record<
  LanguageOption["code"],
  {
    subtitle: string;
    currentDocument: string;
    actionItems: string;
    gatherDocs: string;
    filingFee: string;
    deadline: string;
    uploadNewDocument: string;
  }
> = {
  en: {
    subtitle: "Ask me anything about your document",
    currentDocument: "Current Document",
    actionItems: "Action Items",
    gatherDocs: "Gather Required Documents",
    filingFee: "Filing Fee",
    deadline: "Deadline",
    uploadNewDocument: "Upload New Document",
  },
  es: {
    subtitle: "Preguntame cualquier cosa sobre tu documento",
    currentDocument: "Documento Actual",
    actionItems: "Tareas",
    gatherDocs: "Reune los documentos requeridos",
    filingFee: "Tarifa de Presentacion",
    deadline: "Fecha Limite",
    uploadNewDocument: "Subir Nuevo Documento",
  },
  zh: {
    subtitle: "你可以问我任何与文件有关的问题",
    currentDocument: "当前文件",
    actionItems: "操作事项",
    gatherDocs: "准备所需文件",
    filingFee: "申请费用",
    deadline: "截止日期",
    uploadNewDocument: "上传新文件",
  },
  ar: {
    subtitle: "اسالني اي شيء عن مستندك",
    currentDocument: "المستند الحالي",
    actionItems: "عناصر العمل",
    gatherDocs: "جمع المستندات المطلوبة",
    filingFee: "رسوم التقديم",
    deadline: "الموعد النهائي",
    uploadNewDocument: "تحميل مستند جديد",
  },
  fr: {
    subtitle: "Posez-moi des questions sur votre document",
    currentDocument: "Document Actuel",
    actionItems: "Actions",
    gatherDocs: "Rassembler les documents requis",
    filingFee: "Frais de depot",
    deadline: "Date limite",
    uploadNewDocument: "Televerser un nouveau document",
  },
};

export default function ChatPage() {
  const [inputValue, setInputValue] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(
    languages[0],
  );
  const labels = uiLabels[selectedLanguage.code];
  const isRtl = selectedLanguage.code === "ar";

  const { messages, sendMessage, status, error, regenerate } = useChat({
    messages: seedMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isBusy = status === "submitted" || status === "streaming";

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isBusy) return;
    sendMessage(
      { text },
      { body: { language: selectedLanguage.code } },
    );
    setInputValue("");
  };

  return (
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="flex min-h-screen flex-col bg-[#F8F5F1] md:flex-row"
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
            onSelect={setSelectedLanguage}
          />
        </div>

        <div className="mb-4 rounded-xl border border-[#efe6df] bg-[#fbf8f5] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {labels.currentDocument}
          </p>
          <p className="text-sm font-semibold text-[var(--navy)]">
            analytics.png
          </p>
          <p className="text-xs text-gray-500">Employment Authorization</p>
        </div>

        <div className="rounded-2xl bg-[#1C2B3A] p-4 text-white">
          <p className="mb-3 text-sm font-semibold">{labels.actionItems}</p>
          <ol className="space-y-3 text-sm">
            <li>
              <p className="font-medium">{labels.gatherDocs}</p>
              <p className="text-xs text-slate-300">
                Copy of passport, visa, I-94
              </p>
            </li>
            <li>
              <p className="font-medium">{labels.filingFee}</p>
              <p className="text-xs text-slate-300">
                $410 (check or money order)
              </p>
            </li>
            <li>
              <p className="font-medium">{labels.deadline}</p>
              <p className="text-xs text-slate-300">
                Submit before June 15, 2026
              </p>
            </li>
          </ol>
        </div>

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
              onSelect={setSelectedLanguage}
            />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--navy)] sm:text-3xl">
            Understanding Your Form
          </h1>
          <p className="mt-1 text-sm text-gray-500">{labels.subtitle}</p>
        </header>

        <div className="border-b border-[#efe6df] bg-white px-4 py-3 md:hidden">
          <div className="mb-3 rounded-xl border border-[#efe6df] bg-[#fbf8f5] p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              {labels.currentDocument}
            </p>
            <p className="text-sm font-semibold text-[var(--navy)]">
              analytics.png
            </p>
            <p className="text-xs text-gray-500">Employment Authorization</p>
          </div>
          <div className="rounded-xl bg-[#1C2B3A] p-3 text-white">
            <p className="mb-2 text-sm font-semibold">{labels.actionItems}</p>
            <ol className="space-y-2 text-xs">
              <li>{labels.gatherDocs}</li>
              <li>{labels.filingFee}</li>
              <li>{labels.deadline}</li>
            </ol>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-[#F8F5F1]">
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-6"
            aria-busy={isBusy}
            aria-live="polite"
          >
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onSuggestionClick={(value) => setInputValue(value)}
              />
            ))}

            {status === "submitted" && (
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
            )}

            {error && (
              <div className="mb-3 flex flex-col items-start gap-2">
                <div className="rounded-2xl border border-[#f6d4cb] bg-[#fff5f2] px-4 py-3 text-sm text-[var(--coral)] shadow-sm">
                  Something went wrong. Please try again.
                </div>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="rounded-full border border-[#f6d4cb] bg-white px-3 py-1 text-xs font-medium text-[var(--coral)] transition hover:bg-[#fff5f2]"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            isLoading={isBusy}
          />
        </div>
      </section>

      <aside className="hidden w-[320px] shrink-0 border-l border-[#efe6df] bg-white p-6 xl:block">
        <div className="rounded-2xl border border-dashed border-[#d9cdc2] bg-[#faf7f3] p-4 text-sm text-gray-500">
          Document viewer panel (coming next)
        </div>
      </aside>
    </main>
  );
}
