"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./PdfViewer.module.css";

type Highlight = {
  id: string;
  text: string;
  pageIndex: number;
  rects: { top: number; left: number; width: number; height: number }[];
};

type FloatingBtn = {
  x: number;
  y: number;
  text: string;
};

type Props = {
  url: string;
  fileName: string;
  onSelectText: (text: string) => void;
};

export default function PdfViewer({ url, fileName, onSelectText }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [floatingBtn, setFloatingBtn] = useState<FloatingBtn | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState("");
  const pdfRef = useRef<unknown>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load PDF.js dynamically (avoids SSR issues)
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setPageCount(pdf.numPages);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load PDF");
      }
    }

    void loadPdf();
    return () => { cancelled = true; };
  }, [url]);

  // Render each page once pageCount is known
  useEffect(() => {
    if (!pageCount || !pdfRef.current) return;
    let cancelled = false;

    async function renderPages() {
      const pdfjsLib = await import("pdfjs-dist");
      const pdf = pdfRef.current as Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>;

      for (let i = 1; i <= pageCount; i++) {
        if (cancelled) return;
        const container = pageRefs.current[i - 1];
        if (!container) continue;

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        // Canvas layer
        let canvas = container.querySelector("canvas");
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.className = styles.pageCanvas;
          container.appendChild(canvas);
        }
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        container.style.width = `${viewport.width}px`;
        container.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvas, viewport }).promise;

        // Text layer
        let textLayerEl = container.querySelector<HTMLDivElement>(`.${styles.textLayer}`);
        if (!textLayerEl) {
          textLayerEl = document.createElement("div");
          textLayerEl.className = styles.textLayer;
          container.appendChild(textLayerEl);
        }
        textLayerEl.style.width = `${viewport.width}px`;
        textLayerEl.style.height = `${viewport.height}px`;
        textLayerEl.innerHTML = "";

        const { TextLayer } = await import("pdfjs-dist");
        const tl = new TextLayer({
          textContentSource: page.streamTextContent(),
          container: textLayerEl,
          viewport,
        });
        await tl.render();
      }
    }

    void renderPages();
    return () => { cancelled = true; };
  }, [pageCount]);

  // Track text selection
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!text || text.length < 3) {
      setFloatingBtn(null);
      return;
    }
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setFloatingBtn({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      text,
    });
  }, []);

  const handleAskAbout = useCallback(() => {
    if (!floatingBtn || !containerRef.current) return;

    const selection = window.getSelection();
    const text = floatingBtn.text;

    // Capture rects from selection ranges before clearing
    const rects: Highlight["rects"] = [];
    const containerRect = containerRef.current.getBoundingClientRect();

    if (selection && selection.rangeCount > 0) {
      for (let r = 0; r < selection.rangeCount; r++) {
        const range = selection.getRangeAt(r);
        // Find which page container this range falls in
        for (let p = 0; p < pageRefs.current.length; p++) {
          const pageEl = pageRefs.current[p];
          if (!pageEl || !pageEl.contains(range.startContainer)) continue;
          const pageRect = pageEl.getBoundingClientRect();
          for (const cr of Array.from(range.getClientRects())) {
            rects.push({
              top: cr.top - pageRect.top,
              left: cr.left - pageRect.left,
              width: cr.width,
              height: cr.height,
            });
          }
        }
      }
    }

    // Find page index from click position
    let pageIndex = 0;
    for (let p = 0; p < pageRefs.current.length; p++) {
      const el = pageRefs.current[p];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (floatingBtn.y + containerRect.top >= r.top && floatingBtn.y + containerRect.top <= r.bottom) {
        pageIndex = p;
        break;
      }
    }

    selection?.removeAllRanges();
    setFloatingBtn(null);

    const id = `h-${Date.now()}`;
    setHighlights((prev) => [...prev, { id, text, pageIndex, rects }]);
    onSelectText(text);
  }, [floatingBtn, onSelectText]);

  const removeHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleDownload = useCallback(async () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  }, [url, fileName]);

  if (error) {
    return (
      <div className={styles.error}>
        <p>Could not load PDF: {error}</p>
        <a href={url} target="_blank" rel="noreferrer" className={styles.fallbackLink}>
          Open in browser
        </a>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarName}>{fileName}</span>
        <button type="button" className={styles.downloadBtn} onClick={handleDownload}>
          Download
        </button>
      </div>

      <div
        ref={containerRef}
        className={styles.pages}
        onMouseUp={handleMouseUp}
      >
        {Array.from({ length: pageCount }, (_, i) => (
          <div
            key={i}
            className={styles.page}
            ref={(el) => { pageRefs.current[i] = el; }}
          >
            {/* Highlights for this page */}
            {highlights
              .filter((h) => h.pageIndex === i)
              .map((h) => (
                <div key={h.id} className={styles.highlightLayer}>
                  {h.rects.map((r, ri) => (
                    <div
                      key={ri}
                      className={styles.highlightRect}
                      style={{ top: r.top, left: r.left, width: r.width, height: r.height }}
                      onClick={() => removeHighlight(h.id)}
                      title="Click to remove highlight"
                    />
                  ))}
                </div>
              ))}
          </div>
        ))}

        {/* Floating "Ask about this" button */}
        {floatingBtn && (
          <button
            type="button"
            className={styles.floatingAskBtn}
            style={{ top: floatingBtn.y - 40, left: floatingBtn.x }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAskAbout}
          >
            Ask about this
          </button>
        )}
      </div>

      {pageCount === 0 && !error && (
        <div className={styles.loading}>Loading PDF…</div>
      )}
    </div>
  );
}
