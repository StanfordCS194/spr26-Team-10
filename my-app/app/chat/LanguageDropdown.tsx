// Language selector: RTL, URL sync on chat, locale for /api/chat and /api/upload.

"use client";

import { useState } from "react";

export type LanguageOption = {
  code: "en" | "es" | "zh" | "ar" | "fr";
  label: string;
};

export const languages: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية" },
  { code: "fr", label: "Français" },
];

type LanguageDropdownProps = {
  selected?: LanguageOption;
  onSelect?: (language: LanguageOption) => void;
  /** `nav` = §6.10 secondary-style control in the top bar */
  variant?: "default" | "nav";
};

export default function LanguageDropdown({
  selected,
  onSelect,
  variant = "default",
}: LanguageDropdownProps) {
  const [open, setOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<LanguageOption>(languages[0]);
  const resolvedSelected = selected ?? localSelected;
  const resolvedOnSelect = onSelect ?? setLocalSelected;

  const triggerClass =
    variant === "nav"
      ? "inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-border bg-background px-3 text-[13px] font-normal leading-none text-foreground transition-[border-color,background-color] duration-150 ease-[var(--ease-apple)] hover:border-[var(--color-border-strong)] hover:bg-alt active:bg-[var(--color-bg-press)] md:h-11 md:min-h-0"
      : "inline-flex h-11 min-h-[48px] items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-normal leading-none text-foreground transition-[border-color,background-color] duration-150 ease-[var(--ease-apple)] hover:border-[var(--color-border-strong)] hover:bg-alt active:bg-[var(--color-bg-press)] md:min-h-0";

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        <span>{resolvedSelected.label}</span>
        <span className="text-tertiary-fg" aria-hidden>
          ▼
        </span>
      </button>

      {open ? (
        <div
          className="absolute end-0 top-[calc(100%+8px)] z-50 min-w-[160px] overflow-hidden rounded-[12px] border border-border bg-background shadow-sm"
          role="listbox"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="option"
              aria-selected={resolvedSelected.code === lang.code}
              onClick={() => {
                resolvedOnSelect(lang);
                setOpen(false);
              }}
              className={`flex w-full items-center px-4 py-3 text-left text-base font-normal transition-colors ${
                resolvedSelected.code === lang.code
                  ? "bg-secondary text-foreground"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
