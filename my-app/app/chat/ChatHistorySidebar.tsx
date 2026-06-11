"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import styles from "./chat-history-sidebar.module.css";

export type ChatSessionSummary = {
  id: string;
  documentId: string | null;
  title: string | null;
  language: string;
  createdAt: string;
  updatedAt: string;
  documentName: string | null;
  formType: string | null;
};

export type ChatHistorySidebarLabels = {
  heading: string;
  newChat: string;
  empty: string;
  loading: string;
  loadFailed: string;
  deleteConfirm: string;
  deleteAria: string;
  untitled: string;
};

type ChatHistorySidebarProps = {
  currentSessionId: string | null;
  currentDocumentId: string | null;
  currentLanguage: string;
  labels: ChatHistorySidebarLabels;
};

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ChatHistorySidebar({
  currentSessionId,
  currentDocumentId,
  currentLanguage,
  labels,
}: ChatHistorySidebarProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSessionSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/chat-sessions", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<{ sessions: ChatSessionSummary[] }>;
      })
      .then((data) => {
        if (cancelled) return;
        setSessions(data.sessions);
      })
      .catch(() => {
        if (cancelled) return;
        setError(labels.loadFailed);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, currentSessionId, labels.loadFailed]);

  const handleNew = useCallback(async () => {
    if (!currentDocumentId) return;
    try {
      const res = await fetch("/api/chat-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          documentId: currentDocumentId,
          language: currentLanguage,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { session } = (await res.json()) as {
        session: { id: string };
      };
      const params = new URLSearchParams({
        documentId: currentDocumentId,
        sessionId: session.id,
        language: currentLanguage,
      });
      router.push(`/step/3?${params.toString()}`);
      refresh();
    } catch {
      setError(labels.loadFailed);
    }
  }, [currentDocumentId, currentLanguage, labels.loadFailed, refresh, router]);

  const handleOpen = (s: ChatSessionSummary) => {
    if (s.id === currentSessionId) return;
    const params = new URLSearchParams();
    if (s.documentId) params.set("documentId", s.documentId);
    params.set("sessionId", s.id);
    params.set("language", s.language || currentLanguage);
    router.push(`/step/3?${params.toString()}`);
  };

  const handleDelete = async (
    e: React.MouseEvent,
    s: ChatSessionSummary,
  ) => {
    e.stopPropagation();
    if (!window.confirm(labels.deleteConfirm)) return;

    try {
      const res = await fetch(`/api/chat-sessions/${s.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(`HTTP ${res.status}`);
      }
      // If the user deleted the chat they're viewing, drop them back to /step/3
      // with the same document so the auto-create kicks in.
      if (s.id === currentSessionId) {
        const params = new URLSearchParams();
        if (currentDocumentId) params.set("documentId", currentDocumentId);
        params.set("language", currentLanguage);
        const qs = params.toString();
        router.replace(qs ? `/step/3?${qs}` : "/step/3");
      }
      refresh();
    } catch {
      setError(labels.loadFailed);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <p
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-tertiary)",
            margin: 0,
          }}
        >
          {labels.heading}
        </p>
        <button
          type="button"
          className={styles.newBtn}
          onClick={handleNew}
          disabled={!currentDocumentId}
          title={labels.newChat}
        >
          <IconPlus size={12} aria-hidden />
          {labels.newChat}
        </button>
      </div>

      {error ? <p className={styles.errorRow}>{error}</p> : null}

      {loading && sessions === null ? (
        <p className={styles.statusRow}>{labels.loading}</p>
      ) : null}

      <div className={styles.list}>
        {sessions && sessions.length === 0 ? (
          <p className={styles.empty}>{labels.empty}</p>
        ) : null}

        {sessions?.map((s) => {
          const isActive = s.id === currentSessionId;
          const displayTitle = s.title?.trim() || labels.untitled;
          const meta = [s.documentName, formatRelative(s.updatedAt)]
            .filter(Boolean)
            .join(" · ");
          return (
            <button
              key={s.id}
              type="button"
              className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
              onClick={() => handleOpen(s)}
              aria-current={isActive ? "page" : undefined}
            >
              <span className={styles.itemTitle}>{displayTitle}</span>
              {meta ? <span className={styles.itemMeta}>{meta}</span> : null}
              <span
                role="button"
                tabIndex={0}
                aria-label={labels.deleteAria}
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(e, s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    void handleDelete(
                      e as unknown as React.MouseEvent,
                      s,
                    );
                  }
                }}
              >
                <IconTrash size={13} aria-hidden />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
