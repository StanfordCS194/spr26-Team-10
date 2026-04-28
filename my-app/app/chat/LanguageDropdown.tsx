// Language selector dropdown in the sidebar header.
// Currently updates UI label only — translation wired in Milestone 2.

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
};

export default function LanguageDropdown({
  selected,
  onSelect,
}: LanguageDropdownProps) {
  const [open, setOpen] = useState(false);
  const [localSelected, setLocalSelected] = useState<LanguageOption>(languages[0]);
  const resolvedSelected = selected ?? localSelected;
  const resolvedOnSelect = onSelect ?? setLocalSelected;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-full border border-[#e8ddd3] bg-white px-3 py-1.5 text-xs font-medium text-[var(--navy)]"
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--coral)]" />
        <span>{resolvedSelected.label}</span>
        <span className="text-[10px] text-gray-400">v</span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-10 min-w-[150px] overflow-hidden rounded-xl border border-[#e8ddd3] bg-white shadow-sm">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                resolvedOnSelect(lang);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm ${
                resolvedSelected.code === lang.code
                  ? "bg-[#faf7f3] text-[var(--navy)]"
                  : "bg-white text-gray-600"
              }`}
            >
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
