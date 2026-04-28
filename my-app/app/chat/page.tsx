import { messages } from "./messages";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import LanguageDropdown from "./LanguageDropdown";

export default function ChatPage() {
  return (
    <main className="flex min-h-screen bg-[#F8F5F1]">
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#efe6df] bg-white p-4">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--coral)] text-white">
              ✦
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--navy)]">formly.ai</p>
              <p className="text-xs text-gray-500">Your guide</p>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <LanguageDropdown />
        </div>

        <div className="mb-4 rounded-xl border border-[#efe6df] bg-[#fbf8f5] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Current Document
          </p>
          <p className="text-sm font-semibold text-[var(--navy)]">analytics.png</p>
          <p className="text-xs text-gray-500">Employment Authorization</p>
        </div>

        <div className="rounded-2xl bg-[#1C2B3A] p-4 text-white">
          <p className="mb-3 text-sm font-semibold">Action Items</p>
          <ol className="space-y-3 text-sm">
            <li>
              <p className="font-medium">Gather Required Documents</p>
              <p className="text-xs text-slate-300">Copy of passport, visa, I-94</p>
            </li>
            <li>
              <p className="font-medium">Filing Fee</p>
              <p className="text-xs text-slate-300">$410 (check or money order)</p>
            </li>
            <li>
              <p className="font-medium">Deadline</p>
              <p className="text-xs text-slate-300">Submit before June 15, 2026</p>
            </li>
          </ol>
        </div>

        <button className="mt-auto rounded-xl border border-[#efe6df] bg-[#fbf8f5] px-4 py-3 text-sm font-medium text-[var(--navy)]">
          Upload New Document
        </button>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[#efe6df] bg-white px-6 py-4">
          <h1 className="text-3xl font-semibold text-[var(--navy)]">
            Understanding Your Form
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ask me anything about your document
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col bg-[#F8F5F1]">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
          <ChatInput />
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
