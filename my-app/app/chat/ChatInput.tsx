"use client";

import { useState } from "react";

type ChatInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: () => void;
  isLoading?: boolean;
  /** When true, blocks send and disables the field (e.g. missing document context). */
  disabled?: boolean;
  placeholder?: string;
  waitingPlaceholder?: string;
  footerHint?: string;
};

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = "Ask a question about your form...",
  waitingPlaceholder = "Waiting for response...",
  footerHint = "Responses are grounded in your document. Always verify important details.",
}: ChatInputProps) {
  const [localValue, setLocalValue] = useState("");
  const resolvedValue = value ?? localValue;
  const resolvedOnChange = onChange ?? setLocalValue;
  const resolvedOnSend = onSend ?? (() => {});

  const trimmedEmpty = resolvedValue.trim().length === 0;
  const sendDisabled = isLoading || trimmedEmpty || disabled;
  const inputDisabled = isLoading || disabled;

  return (
    <div className="border-t border-[#efe6df] bg-white px-6 py-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder={isLoading ? waitingPlaceholder : placeholder}
          value={resolvedValue}
          onChange={(e) => resolvedOnChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (!sendDisabled) resolvedOnSend();
            }
          }}
          disabled={inputDisabled}
          aria-busy={isLoading}
          className="flex-1 rounded-2xl border border-[#efe6df] bg-[#f8f5f1] px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[#d6c8bd] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          onClick={resolvedOnSend}
          disabled={sendDisabled}
          className="rounded-2xl bg-[var(--coral)] px-4 py-3 text-sm font-medium text-white transition enabled:hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send question"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">{footerHint}</p>
    </div>
  );
}
