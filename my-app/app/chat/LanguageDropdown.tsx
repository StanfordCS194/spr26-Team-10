// Language selector dropdown in the sidebar header.
// Currently updates UI label only — translation wired in Milestone 2.

"use client";

import { useState } from "react";

export type LanguageOption = {
  code: "en" | "es" | "zh" | "ar" | "fr";
  flag: string;
  label: string;
};

export const languages: LanguageOption[] = [
  { code: "en", flag: "🇺🇸", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "zh", flag: "🇨🇳", label: "中文" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
];

type LanguageDropdownProps = {
  selected: LanguageOption;
  onSelect: (language: LanguageOption) => void;
};

export default function LanguageDropdown({
  selected,
  onSelect,
}: LanguageDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Pill button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          border: "1px solid #e2e8f0",
          borderRadius: "20px",
          background: "white",
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: "14px" }}>{selected.flag}</span>
        <span>{selected.label}</span>
        <span style={{ fontSize: "10px", color: "#94a3b8" }}>▾</span>
      </button>

      {/* Dropdown list */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            overflow: "hidden",
            zIndex: 10,
            minWidth: "160px",
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onSelect(lang);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "10px 14px",
                border: "none",
                background: selected.code === lang.code ? "#f8fafc" : "white",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "16px" }}>{lang.flag}</span>
              <span>{lang.label}</span>
              {selected.code === lang.code && (
                <span style={{ marginLeft: "auto", color: "#E8593C" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
