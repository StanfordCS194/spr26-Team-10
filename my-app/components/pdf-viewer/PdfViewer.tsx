"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./PdfViewer.module.css";

type Highlight = {
  id: string;
  text: string;
  pageIndex: number;
  // stored in natural (zoom=1) coordinates relative to the page div
  rects: { top: number; left: number; width: number; height: number }[];
};

type FloatingBtn = {
  x: number;
  y: number;
  text: string;
  highlightId: string;
};

type Props = {
  url: string;
  fileName: string;
  onSelectText: (text: string) => void;
};

export default function PdfViewer({ url, fileName, onSelectText }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const floatingBtnRef = useRef<HTMLButtonElement>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [floatingBtn, setFloatingBtn] = useState<FloatingBtn | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [error, setError] = useState("");
  const pdfRef = useRef<unknown>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  // natural page size (at zoom=1) for the first page — used for fit-to-width
  const naturalWidthRef = useRef<number>(0);
  // always up-to-date zoom for use in event handlers (avoids stale closure)
  const zoomRef = useRef<number>(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Load PDF.js dynamically (avoids SSR issues)
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

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

  // Once pageCount is set, compute fit-to-width zoom from page 1
  useEffect(() => {
    if (!pageCount || !pdfRef.current) return;
    let cancelled = false;

    async function computeFitZoom() {
      const pdfjsLib = await import("pdfjs-dist");
      const pdf = pdfRef.current as Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1 });
      naturalWidthRef.current = vp.width;

      if (cancelled) return;
      const containerEl = containerRef.current;
      if (!containerEl) return;
      const availableWidth = containerEl.clientWidth - 32;
      const fitZoom = availableWidth > 0 ? availableWidth / vp.width : 1;
      setZoom(Math.min(Math.max(fitZoom, 0.25), 3));
    }

    void computeFitZoom();
    return () => { cancelled = true; };
  }, [pageCount]);

  // Refit to width whenever the container is resized (e.g. panel resize handle dragged)
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl || !naturalWidthRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!naturalWidthRef.current) return;
      const availableWidth = containerEl.clientWidth - 32;
      const fitZoom = availableWidth > 0 ? availableWidth / naturalWidthRef.current : 1;
      setZoom(Math.min(Math.max(fitZoom, 0.25), 3));
    });

    observer.observe(containerEl);
    return () => observer.disconnect();
  // Only attach after the natural width is known (pageCount triggers that)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount]);

  // Render / re-render all pages whenever zoom changes
  useEffect(() => {
    if (!pageCount || !pdfRef.current) return;
    let cancelled = false;
    // Track active render tasks so we can cancel them on cleanup
    const activeTasks: { cancel: () => void }[] = [];

    async function renderPages() {
      const pdfjsLib = await import("pdfjs-dist");
      const pdf = pdfRef.current as Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]>;
      const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
      const renderScale = zoom * dpr;

      for (let i = 1; i <= pageCount; i++) {
        if (cancelled) return;
        const container = pageRefs.current[i - 1];
        if (!container) continue;

        const page = await pdf.getPage(i);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: renderScale });
        const cssWidth = viewport.width / dpr;
        const cssHeight = viewport.height / dpr;

        // Canvas
        let canvas = container.querySelector("canvas");
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.className = styles.pageCanvas;
          container.appendChild(canvas);
        }
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        container.style.width = `${cssWidth}px`;
        container.style.height = `${cssHeight}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        const renderTask = page.render({ canvas, viewport });
        activeTasks.push(renderTask);
        try {
          await renderTask.promise;
        } catch {
          // cancelled — stop rendering further pages
          return;
        }
        if (cancelled) return;

        // Text layer — spans at render scale, CSS-scaled down to CSS size
        let textLayerEl = container.querySelector<HTMLDivElement>(".pdfTextLayer");
        if (!textLayerEl) {
          textLayerEl = document.createElement("div");
          textLayerEl.className = "pdfTextLayer";
          container.appendChild(textLayerEl);
        }
        textLayerEl.style.cssText = `
          position: absolute; top: 0; left: 0;
          width: ${viewport.width}px; height: ${viewport.height}px;
          overflow: hidden; pointer-events: auto; user-select: text;
          transform: scale(${1 / dpr});
          transform-origin: top left;
        `;
        textLayerEl.innerHTML = "";

        const textContent = await page.getTextContent();
        if (cancelled) return;
        for (const item of textContent.items) {
          if (!("str" in item) || !item.str) continue;
          const tx = item.transform;
          const x = tx[4] * renderScale;
          const y = viewport.height - tx[5] * renderScale;
          const fontHeight = Math.hypot(tx[2], tx[3]) * renderScale;
          const angle = Math.atan2(tx[1], tx[0]);
          const span = document.createElement("span");
          span.textContent = item.str;
          span.style.cssText = `
            position: absolute;
            color: transparent;
            white-space: pre;
            cursor: text;
            font-size: ${fontHeight}px;
            line-height: 1;
            font-family: sans-serif;
            left: ${x}px;
            top: ${y - fontHeight}px;
            transform: rotate(${angle}rad);
            transform-origin: 0% 100%;
            pointer-events: auto;
            user-select: text;
          `;
          textLayerEl.appendChild(span);
        }
      }
    }

    void renderPages();
    return () => {
      cancelled = true;
      activeTasks.forEach((t) => { try { t.cancel(); } catch { /* ignore */ } });
    };
  }, [pageCount, zoom]);

  // Native document-level mouseup so selection is always captured
  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      if (floatingBtnRef.current?.contains(e.target as Node)) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length < 3) {
        setFloatingBtn(null);
        return;
      }

      const containerEl = containerRef.current;
      if (!containerEl) return;
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      if (!range || !containerEl.contains(range.commonAncestorContainer)) return;

      const currentZoom = zoomRef.current;
      const containerRect = containerEl.getBoundingClientRect();
      const rects: Highlight["rects"] = [];
      let pageIndex = 0;
      let selectionBounds: DOMRect | null = null;

      if (selection && selection.rangeCount > 0) {
        for (let r = 0; r < selection.rangeCount; r++) {
          const rng = selection.getRangeAt(r);
          for (let p = 0; p < pageRefs.current.length; p++) {
            const pageEl = pageRefs.current[p];
            if (!pageEl || !pageEl.contains(rng.startContainer)) continue;
            pageIndex = p;
            const pageRect = pageEl.getBoundingClientRect();
            for (const cr of Array.from(rng.getClientRects())) {
              if (cr.width < 1 || cr.height < 1) continue;
              selectionBounds = selectionBounds
                ? DOMRect.fromRect({
                    x: Math.min(selectionBounds.left, cr.left),
                    y: Math.min(selectionBounds.top, cr.top),
                    width:
                      Math.max(selectionBounds.right, cr.right) -
                      Math.min(selectionBounds.left, cr.left),
                    height:
                      Math.max(selectionBounds.bottom, cr.bottom) -
                      Math.min(selectionBounds.top, cr.top),
                  })
                : DOMRect.fromRect(cr);
              // Store in natural (zoom=1) coordinates
              rects.push({
                top: (cr.top - pageRect.top) / currentZoom,
                left: (cr.left - pageRect.left) / currentZoom,
                width: cr.width / currentZoom,
                height: cr.height / currentZoom,
              });
            }
          }
        }
      }

      selection?.removeAllRanges();

      if (rects.length > 0) {
        const id = `h-${Date.now()}`;
        setHighlights((prev) => [...prev, { id, text, pageIndex, rects }]);
        const buttonRect = selectionBounds ?? new DOMRect(e.clientX, e.clientY, 0, 0);
        setFloatingBtn({
          x:
            buttonRect.left -
            containerRect.left +
            containerEl.scrollLeft +
            buttonRect.width / 2,
          y: buttonRect.top - containerRect.top + containerEl.scrollTop - 8,
          text,
          highlightId: id,
        });
      }
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleAskAbout = useCallback(() => {
    if (!floatingBtn) return;
    onSelectText(floatingBtn.text);
    setFloatingBtn(null);
  }, [floatingBtn, onSelectText]);

  const removeHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    setFloatingBtn((current) =>
      current?.highlightId === id ? null : current,
    );
  }, []);

  const selectHighlight = useCallback((highlight: Highlight) => {
    const containerEl = containerRef.current;
    const pageEl = pageRefs.current[highlight.pageIndex];
    const firstRect = highlight.rects[0];
    if (!containerEl || !pageEl || !firstRect) return;

    const currentZoom = zoomRef.current;
    const containerRect = containerEl.getBoundingClientRect();
    const pageRect = pageEl.getBoundingClientRect();
    setFloatingBtn({
      x:
        pageRect.left -
        containerRect.left +
        containerEl.scrollLeft +
        firstRect.left * currentZoom +
        (firstRect.width * currentZoom) / 2,
      y:
        pageRect.top -
        containerRect.top +
        containerEl.scrollTop +
        firstRect.top * currentZoom -
        8,
      text: highlight.text,
      highlightId: highlight.id,
    });
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
        <div className={styles.toolbarActions}>
          <div className={styles.zoomControls}>
            <button type="button" className={styles.zoomBtn} onClick={() => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))} title="Zoom out">−</button>
            <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
            <button type="button" className={styles.zoomBtn} onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))} title="Zoom in">+</button>
          </div>
          <button type="button" className={styles.downloadBtn} onClick={handleDownload}>
            Download
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={styles.pages}
      >
        {Array.from({ length: pageCount }, (_, i) => (
          <div
            key={i}
            className={styles.page}
            ref={(el) => { pageRefs.current[i] = el; }}
          >
            {highlights
              .filter((h) => h.pageIndex === i)
              .map((h) => (
                <div key={h.id} className={styles.highlightLayer}>
                  {h.rects.map((r, ri) => (
                    <div
                      key={ri}
                      className={styles.highlightRect}
                      style={{
                        top: r.top * zoom,
                        left: r.left * zoom,
                        width: r.width * zoom,
                        height: r.height * zoom,
                      }}
                      onClick={() => selectHighlight(h)}
                      onDoubleClick={() => removeHighlight(h.id)}
                      title="Click to ask about this highlight. Double-click to remove it."
                    />
                  ))}
                </div>
              ))}
          </div>
        ))}

        {floatingBtn && (
          <button
            ref={floatingBtnRef}
            type="button"
            className={styles.floatingAskBtn}
            style={{ top: floatingBtn.y, left: floatingBtn.x }}
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
