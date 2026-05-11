import {
  languages,
  type LanguageOption,
} from "@/app/chat/LanguageDropdown";

export const LANGUAGE_STORAGE_KEY = "formlyPreferredLanguage";

export function getStoredLanguageCode(): LanguageOption["code"] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!raw) return null;
    const match = languages.find((l) => l.code === raw);
    return match ? match.code : null;
  } catch {
    return null;
  }
}

export function setPreferredLanguage(code: LanguageOption["code"]) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Valid URL param wins; otherwise localStorage; default English. */
export function resolveLanguageForStep(
  urlLanguage: string | null,
): LanguageOption {
  if (urlLanguage) {
    const fromUrl = languages.find((l) => l.code === urlLanguage);
    if (fromUrl) return fromUrl;
  }
  const stored = getStoredLanguageCode();
  if (stored) {
    const fromStored = languages.find((l) => l.code === stored);
    if (fromStored) return fromStored;
  }
  return languages[0];
}
