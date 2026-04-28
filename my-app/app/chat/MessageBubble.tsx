// Chat message bubble component.
// Renders AI and user messages differently based on the role prop.

import { Message } from "./messages";

export default function MessageBubble({
  message,
  onSuggestionClick,
}: {
  message: Message;
  onSuggestionClick?: (value: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[75%] rounded-2xl bg-[#1C2B3A] px-5 py-4 text-sm leading-6 text-white shadow-sm">
          <p>{message.text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 flex gap-3">
      {/* Coral avatar */}
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--coral)]" />

      <div className="max-w-[78%] rounded-2xl border border-[#efe6df] bg-white px-4 py-4 text-sm leading-6 text-[var(--navy)] shadow-sm">
        <p>{message.text}</p>

        {/* Suggestion chips */}
        {message.suggestions && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {message.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestionClick?.(s)}
                className="rounded-xl border border-[#efe6df] bg-white px-3 py-2 text-left text-[13px] text-[var(--navy)] transition hover:bg-[#faf7f3]"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {message.annotations && (
          <div className="mt-4 space-y-2">
            {message.annotations.map((annotation) => (
              <div
                key={annotation.title}
                className="rounded-xl border border-[#efe3be] bg-[#fff9e8] px-3 py-2"
              >
                <span className="rounded-full bg-[#ffd87a] px-2 py-0.5 text-[10px] font-semibold text-[#8a5a00]">
                  {annotation.tag}
                </span>
                <p className="mt-1 text-[13px] font-semibold text-[var(--navy)]">
                  {annotation.title}
                </p>
                <p className="mt-0.5 text-xs text-[#7a6a45]">{annotation.detail}</p>
              </div>
            ))}
          </div>
        )}

        {/* Citation chip */}
        {message.citation && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#f6d4cb] bg-[#fff5f2] px-3 py-1 text-xs text-[var(--coral)]">
            Source: {message.citation}
          </div>
        )}
      </div>
    </div>
  );
}
