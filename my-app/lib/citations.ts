export type CitationSource = {
  id?: string;
  source: string;
  label: string;
  snippet: string;
  href?: string;
  sectionTitle?: string;
};

export type FormReferenceRow = {
  id?: string | null;
  source?: string | null;
  source_url?: string | null;
  source_title?: string | null;
  section_title?: string | null;
  page_number?: number | null;
  form_key?: string | null;
  content?: string | null;
};

const LEGACY_PDF_URLS: Record<string, string> = {
  "072403.pdf": "https://www.ssa.gov/pubs/EN-05-10002.pdf",
  "2025-fall-semiannual-report-to-congress.pdf":
    "https://www.ssa.gov/legislation/2025-fall-semiannual-report-to-congress.pdf",
  "cms-l564e.pdf":
    "https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms-l564e.pdf",
  "cms-l564s.pdf":
    "https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms-l564s.pdf",
  "cms1763.pdf":
    "https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms1763.pdf",
  "cms40b-e.pdf":
    "https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms40b-e.pdf",
  "cms40b-s.pdf":
    "https://www.cms.gov/medicare/cms-forms/cms-forms/downloads/cms40b-s.pdf",
  "fss4.pdf": "https://www.irs.gov/pub/irs-pdf/fss4.pdf",
  "fss4sp.pdf": "https://www.irs.gov/pub/irs-pdf/fss4sp.pdf",
  "fw4v.pdf": "https://www.irs.gov/pub/irs-pdf/fw4v.pdf",
  "m10-22.pdf": "https://www.uscis.gov/sites/default/files/document/forms/m-10-22.pdf",
  "PLAW-111publ274.pdf":
    "https://www.congress.gov/111/plaws/publ274/PLAW-111publ274.pdf",
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      ["and", "or", "of", "the", "to", "for", "in"].includes(word)
        ? word
        : `${word.charAt(0).toUpperCase()}${word.slice(1)}`,
    )
    .join(" ");
}

function getSourceBase(source: string): string {
  return source.replace(/\s*\(part\s+\d+\)\s*$/i, "").trim();
}

function getLegacyUrl(source: string): string | undefined {
  const base = getSourceBase(source);
  if (/^https?:\/\//i.test(base)) return base;

  const filename = base.split("/").pop();
  if (!filename) return undefined;

  return LEGACY_PDF_URLS[filename];
}

function appendPdfPage(url: string, pageNumber?: number | null): string {
  if (!pageNumber || !url.toLowerCase().includes(".pdf")) return url;
  return `${url}#page=${pageNumber}`;
}

function fallbackLabel(source: string, content = ""): string {
  const sourceBase = getSourceBase(source);
  const text = `${sourceBase} ${content}`.toLowerCase();

  if (
    text.includes("ss-5") ||
    text.includes("social security card") ||
    text.includes("application for a social security")
  ) {
    return "Social Security application";
  }

  if (text.includes("ssi") || text.includes("supplemental security income")) {
    return "Supplemental Security Income";
  }

  if (text.includes("medicare")) return "Medicare application";
  if (text.includes("w-4") || text.includes("fw4")) {
    return "Employee withholding form";
  }
  if (text.includes("i-9")) return "Employment eligibility form";

  const cleaned = sourceBase
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(pdf|gov|ssa)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned ? titleCase(cleaned) : "Government form reference";
}

export function buildCitationSource(row: FormReferenceRow): CitationSource {
  const source = row.source || row.source_title || "Form Reference";
  const content = row.content || "";
  const sourceUrl = row.source_url || getLegacyUrl(source);

  // "Page N" is not meaningful to users — prefer source_title when section_title
  // is just a page number (e.g. rows seeded from PDFs without section headings).
  const isPageNumber = /^page\s*\d+$/i.test((row.section_title || "").trim());
  const label = (!isPageNumber && row.section_title)
    ? row.section_title
    : row.source_title || fallbackLabel(source, content);

  const href = sourceUrl ? appendPdfPage(sourceUrl, row.page_number) : undefined;

  return {
    id: row.id || undefined,
    source,
    label,
    snippet: content.slice(0, 220),
    href,
    sectionTitle: row.section_title || undefined,
  };
}

export function uniqueCitationSources(
  citations: CitationSource[],
): CitationSource[] {
  const seen = new Set<string>();
  const unique: CitationSource[] = [];

  for (const citation of citations) {
    const key = citation.href ?? `${citation.source}:${citation.label}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(citation);
  }

  return unique;
}
