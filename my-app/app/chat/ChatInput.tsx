"use client";

import { useState } from "react";

type ChatInputProps = {
  value?: string;
  onChange?: (value: string) => void;
  onSend?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  waitingPlaceholder?: string;
  footerHint?: string;
  inputLabel?: string;
};

export default function ChatInput({
  value,
  onChange,
  onSend,
  isLoading = false,
  disabled = false,
  placeholder = "Ask a question about your form…",
  waitingPlaceholder = "Waiting for response…",
  footerHint = "Responses are grounded in your document. Always verify important details.",
  inputLabel = "Your question",
}: ChatInputProps) {
  const [localValue, setLocalValue] = useState("");
  const resolvedValue = value ?? localValue;
  const resolvedOnChange = onChange ?? setLocalValue;
  const resolvedOnSend = onSend ?? (() => {});

  const trimmedEmpty = resolvedValue.trim().length === 0;
  const sendDisabled = isLoading || trimmedEmpty || disabled;
  const inputDisabled = isLoading || disabled;

  return (
    <div className="blur-backdrop sticky bottom-0 border-t border-border bg-[rgba(255,255,255,0.9)] px-6 py-4 backdrop-blur-[12px]">
      <div className="mx-auto max-w-[1080px]">
        <label
          htmlFor="chat-input-field"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {inputLabel}
        </label>
        <div className="flex items-center gap-4">
          <input
            id="chat-input-field"
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
            className="h-12 flex-1 rounded-[12px] border border-border bg-alt px-4 text-base font-normal leading-[1.55] text-foreground outline-none transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-apple)] placeholder:text-tertiary-fg focus:border-[var(--color-border-focus)] focus:bg-background focus:shadow-[var(--ring-focus)] disabled:cursor-not-allowed disabled:opacity-40"
          />
          <button
            type="button"
            onClick={resolvedOnSend}
            disabled={sendDisabled}
            className="inline-flex shrink-0 items-center justify-center text-[15px] font-normal leading-none text-[var(--color-text-link)] hover:underline hover:decoration-1 hover:underline-offset-2 disabled:cursor-not-allowed disabled:no-underline disabled:text-tertiary-fg"
          >
            {isLoading ? "…" : "Send"}
          </button>
        </div>
        <p className="mt-2 text-center text-[12px] font-normal leading-[1.45] tracking-[0.01em] text-secondary-fg">
          {footerHint}
        </p>
      </div>
    </div>
  );
}
