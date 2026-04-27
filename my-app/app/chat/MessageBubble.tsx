import type { UIMessage } from "ai";
import { messageMeta } from "./messages";

function getText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export default function MessageBubble({
  message,
  onSuggestionClick,
}: {
  message: UIMessage;
  onSuggestionClick?: (value: string) => void;
}) {
  const text = getText(message);
  const meta = messageMeta[message.id];

  if (message.role === "user") {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[75%] rounded-2xl bg-[var(--navy)] px-5 py-4 text-sm leading-6 text-white shadow-sm">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 flex gap-3">
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--coral)]" />

      <div className="max-w-[78%] rounded-2xl border border-[#efe6df] bg-white px-4 py-4 text-sm leading-6 text-[var(--navy)] shadow-sm">
        <p className="whitespace-pre-wrap">{text}</p>

        {meta?.suggestions && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {meta.suggestions.map((s) => (
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

        {meta?.annotations && (
          <div className="mt-4 space-y-2">
            {meta.annotations.map((annotation) => (
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
                <p className="mt-0.5 text-xs text-[#7a6a45]">
                  {annotation.detail}
                </p>
              </div>
            ))}
          </div>
        )}

        {meta?.citation && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#f6d4cb] bg-[#fff5f2] px-3 py-1 text-xs text-[var(--coral)]">
            Source: {meta.citation}
          </div>
        )}
      </div>
    </div>
  );
}
