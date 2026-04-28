// Chat input bar at the bottom of the chat area.
"use client";

import { useState } from "react";

type ChatInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: () => void;
};

export default function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const [localValue, setLocalValue] = useState("");
  const resolvedValue = value ?? localValue;
  const resolvedOnChange = onChange ?? setLocalValue;
  const resolvedOnSend = onSend ?? (() => {});

  return (
    <div className="border-t border-[#efe6df] bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Ask a question about your form..."
          value={resolvedValue}
          onChange={(e) => resolvedOnChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              resolvedOnSend();
            }
          }}
          className="flex-1 rounded-2xl border border-[#efe6df] bg-[#f8f5f1] px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[#d6c8bd]"
        />
        <button
          onClick={resolvedOnSend}
          className="rounded-2xl bg-[var(--coral)] px-4 py-3 text-sm font-medium text-white transition hover:opacity-95"
          aria-label="Send question"
        >
          Send
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">
        Responses are grounded in your document. Always verify important
        details.
      </p>
    </div>
  );
}
